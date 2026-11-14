let homeButtonRegistration = null;
let homeButtonRegistrationUpdate = Promise.resolve();
const dashboardHomeTabs = new Map();
const homeButtonPorts = new Set();
const homeButtonPortFullscreenStates = new Map();
const dashboardHomePage = browser.runtime.getManifest().chrome_settings_overrides.homepage;
const dashboardHomeUrl = browser.runtime.getURL(dashboardHomePage);

async function updateHomeButtonRegistration() {
  const [hasAllSitesAccess, preferences] = await Promise.all([
    browser.permissions.contains({ origins: ["<all_urls>"] }),
    browser.storage.local.get("showHomeButton")
  ]);
  const shouldRegister = hasAllSitesAccess && preferences.showHomeButton !== false;
  if (shouldRegister && !homeButtonRegistration) {
    homeButtonRegistration = await browser.contentScripts.register({
      matches: ["http://*/*", "https://*/*"],
      js: [{ file: "home-button.js" }],
      runAt: "document_idle"
    });
  } else if (!shouldRegister && homeButtonRegistration) {
    const registration = homeButtonRegistration;
    homeButtonRegistration = null;
    await registration.unregister();
  }
}

function refreshHomeButtonRegistration() {
  homeButtonRegistrationUpdate = homeButtonRegistrationUpdate
    .then(updateHomeButtonRegistration)
    .catch((error) => {
      console.error("Could not update the Joydash home button:", error);
    });
}

function updateHomeButtonPortFullscreenState(port, currentWindow) {
  const windowId = port.sender.tab?.windowId;
  if (typeof windowId !== "number") {
    return;
  }
  const windowPromise = currentWindow?.id === windowId
    ? Promise.resolve(currentWindow)
    : browser.windows.get(windowId);
  windowPromise.then((browserWindow) => {
    if (!homeButtonPorts.has(port)) {
      return;
    }
    const fullscreen = browserWindow.state === "fullscreen";
    if (homeButtonPortFullscreenStates.get(port) === fullscreen) {
      return;
    }
    homeButtonPortFullscreenStates.set(port, fullscreen);
    port.postMessage({ type: "joydash:fullscreen-state", fullscreen });
  }).catch((error) => {
    console.error("Could not check the Joydash Home button window state:", error);
  });
}

browser.permissions.onAdded.addListener(refreshHomeButtonRegistration);
browser.permissions.onRemoved.addListener(refreshHomeButtonRegistration);
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.showHomeButton) {
    refreshHomeButtonRegistration();
  }
});
browser.runtime.onConnect.addListener((port) => {
  if (port.name === "joydash-home-button") {
    if (typeof port.sender.tab?.windowId !== "number") {
      return;
    }
    homeButtonPorts.add(port);
    updateHomeButtonPortFullscreenState(port);
    port.onMessage.addListener((message) => {
      if (message?.type === "joydash:refresh-fullscreen-state") {
        updateHomeButtonPortFullscreenState(port);
      }
    });
    port.onDisconnect.addListener(() => {
      homeButtonPorts.delete(port);
      homeButtonPortFullscreenStates.delete(port);
    });
    return;
  }
  if (port.name !== "joydash-dashboard-page" ||
      port.sender.url !== dashboardHomeUrl ||
      typeof port.sender.tab?.id !== "number") {
    return;
  }
  const tabId = port.sender.tab.id;
  let ports = dashboardHomeTabs.get(tabId);
  if (!ports) {
    ports = new Set();
    dashboardHomeTabs.set(tabId, ports);
  }
  ports.add(port);
  port.onDisconnect.addListener(() => {
    const connectedPorts = dashboardHomeTabs.get(tabId);
    connectedPorts?.delete(port);
    if (connectedPorts?.size === 0) {
      dashboardHomeTabs.delete(tabId);
    }
  });
});
if (browser.windows.onBoundsChanged) {
  browser.windows.onBoundsChanged.addListener((browserWindow) => {
    for (const port of homeButtonPorts) {
      updateHomeButtonPortFullscreenState(port, browserWindow);
    }
  });
}
browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "joydash:close-dashboard-tabs") {
    if (sender.url !== dashboardHomeUrl ||
        typeof sender.tab?.id !== "number") {
      throw new Error("Only Joydash pages can close Joydash tabs.");
    }
    return browser.windows.get(sender.tab.windowId).then((browserWindow) => {
      if (browserWindow.state !== "fullscreen") {
        return { ok: true, closed: false };
      }
      const tabIds = new Set(dashboardHomeTabs.keys());
      tabIds.add(sender.tab.id);
      return browser.tabs.remove([...tabIds]).then(() => ({ ok: true, closed: true }));
    });
  }
  if (message?.type !== "joydash:return-home") {
    return undefined;
  }
  if (typeof sender.tab?.id !== "number") {
    throw new Error("The Joydash home button requires a browser tab.");
  }
  return browser.windows.get(sender.tab.windowId).then((browserWindow) => {
    if (browserWindow.state !== "fullscreen") {
      return { ok: false, reason: "fullscreen-required" };
    }
    return browser.tabs.update(sender.tab.id, {
      url: dashboardHomeUrl
    }).then(() => ({ ok: true }));
  });
});

refreshHomeButtonRegistration();