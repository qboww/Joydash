let homeButtonRegistration = null;
let homeButtonRegistrationUpdate = Promise.resolve();
const dashboardHomeTabs = new Map();
const dashboardPagePorts = new Set();
const homeButtonPorts = new Set();
const homeButtonPortFullscreenStates = new Map();
const dashboardHomePage = browser.runtime.getManifest().chrome_settings_overrides.homepage;
const dashboardHomeUrl = browser.runtime.getURL(dashboardHomePage);
let discreetStateInitialization;
let favoriteHostsRefreshTimer;

async function getDiscreetState() {
  const preferences = await browser.storage.local.get([
    "discreetModeEnabled",
    "coverFavoritePagesEnabled",
    "discreetModeContext"
  ]);
  let session = await browser.storage.session.get([
    "discreetCoverActive",
    "discreetModeInitialized"
  ]);
  if (session.discreetModeInitialized !== true) {
    if (!discreetStateInitialization) {
      discreetStateInitialization = browser.storage.session.set({
        discreetCoverActive: preferences.discreetModeEnabled !== false,
        discreetModeInitialized: true
      }).finally(() => {
        discreetStateInitialization = null;
      });
    }
    await discreetStateInitialization;
    session = await browser.storage.session.get([
      "discreetCoverActive",
      "discreetModeInitialized"
    ]);
  }
  return {
    discreetModeEnabled: preferences.discreetModeEnabled !== false,
    coverFavoritePagesEnabled: preferences.coverFavoritePagesEnabled !== false,
    discreetModeContext: ["both", "fullscreen", "windowed"].includes(preferences.discreetModeContext)
      ? preferences.discreetModeContext
      : "both",
    covered: preferences.discreetModeEnabled !== false &&
      session.discreetCoverActive === true
  };
}

function discreetModeAppliesInContext(context, fullscreen) {
  return context === "both" ||
    (context === "fullscreen" && fullscreen) ||
    (context === "windowed" && !fullscreen);
}

function findBookmarkNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const found = findBookmarkNode(node.children ?? [], id);
    if (found) {
      return found;
    }
  }
  return null;
}

async function getFavoriteHosts() {
  const [preferences, tree] = await Promise.all([
    browser.storage.local.get(["bookmarkFolderIds", "bookmarkFolderId"]),
    browser.bookmarks.getTree()
  ]);
  const root = tree[0];
  if (!root || !Array.isArray(root.children)) {
    throw new Error("Firefox did not return a bookmarks folder tree.");
  }
  const savedFolderIds = Array.isArray(preferences.bookmarkFolderIds)
    ? preferences.bookmarkFolderIds
    : typeof preferences.bookmarkFolderId === "string"
      ? [preferences.bookmarkFolderId]
      : [];
  let selectedFolder = savedFolderIds
    .map((id) => findBookmarkNode(root.children, id))
    .find((node) => node && Array.isArray(node.children));
  if (savedFolderIds.length === 0 &&
      preferences.bookmarkFolderIds === undefined &&
      preferences.bookmarkFolderId === undefined) {
    selectedFolder = root.children.find((folder) => folder.id === "toolbar_____") ??
      root.children[1] ??
      null;
  }
  const hosts = new Set();
  const collectHosts = (node) => {
    if (typeof node.url === "string") {
      let url;
      try {
        url = new URL(node.url);
      } catch {
        url = null;
      }
      if (url && (url.protocol === "http:" || url.protocol === "https:")) {
        hosts.add(url.hostname.toLowerCase().replace(/^www\./, ""));
      }
    }
    for (const child of node.children ?? []) {
      collectHosts(child);
    }
  };
  if (selectedFolder) {
    collectHosts(selectedFolder);
  }
  return hosts;
}

function isFavoritePage(urlString, hosts) {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const host of hosts) {
      if (hostname === host || hostname.endsWith(`.${host}`)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

async function updateHomeButtonPortStates() {
  const [hosts, discreetState] = await Promise.all([
    getFavoriteHosts(),
    getDiscreetState()
  ]);
  for (const port of homeButtonPorts) {
    port.postMessage({
      type: "joydash:page-state",
      favorite: discreetState.coverFavoritePagesEnabled &&
        isFavoritePage(port.sender.url, hosts),
      discreetModeEnabled: discreetState.discreetModeEnabled,
      discreetModeContext: discreetState.discreetModeContext,
      covered: discreetState.covered
    });
  }
}

function scheduleHomeButtonPortStateUpdate() {
  clearTimeout(favoriteHostsRefreshTimer);
  favoriteHostsRefreshTimer = setTimeout(() => {
    updateHomeButtonPortStates().catch((error) => {
      console.error("Could not update Joydash discreet page state:", error);
    });
  }, 100);
}

async function updateHomeButtonRegistration() {
  const [hasAllSitesAccess, preferences] = await Promise.all([
    browser.permissions.contains({ origins: ["<all_urls>"] }),
    browser.storage.local.get([
      "showHomeButton",
      "coverFavoritePagesEnabled",
      "discreetModeEnabled"
    ])
  ]);
  const shouldRegister = hasAllSitesAccess &&
    (preferences.showHomeButton !== false ||
      (preferences.coverFavoritePagesEnabled !== false &&
       preferences.discreetModeEnabled !== false));
  if (shouldRegister && !homeButtonRegistration) {
    homeButtonRegistration = await browser.contentScripts.register({
      matches: ["http://*/*", "https://*/*"],
      js: [
        { file: "discreet-cover-component.js" },
        { file: "home-button.js" }
      ],
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

function updateDashboardPagePortFullscreenState(port, currentWindow) {
  const windowId = port.sender.tab?.windowId;
  if (typeof windowId !== "number") {
    return;
  }
  const windowPromise = currentWindow?.id === windowId
    ? Promise.resolve(currentWindow)
    : browser.windows.get(windowId);
  windowPromise.then((browserWindow) => {
    if (!dashboardPagePorts.has(port)) {
      return;
    }
    port.postMessage({
      type: "joydash:fullscreen-state",
      fullscreen: browserWindow.state === "fullscreen"
    });
  }).catch((error) => {
    console.error("Could not check the Joydash dashboard window state:", error);
    if (dashboardPagePorts.has(port)) {
      port.postMessage({
        type: "joydash:fullscreen-state",
        fullscreen: false
      });
    }
  });
}

browser.permissions.onAdded.addListener(refreshHomeButtonRegistration);
browser.permissions.onRemoved.addListener(refreshHomeButtonRegistration);
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" &&
      (changes.showHomeButton ||
       changes.coverFavoritePagesEnabled ||
       changes.discreetModeEnabled)) {
    refreshHomeButtonRegistration();
  }
  if (area === "local" &&
      (changes.discreetModeEnabled ||
       changes.discreetModeContext ||
       changes.coverFavoritePagesEnabled ||
       changes.bookmarkFolderIds ||
       changes.bookmarkFolderId)) {
    scheduleHomeButtonPortStateUpdate();
  }
  if (area === "session" &&
      (changes.discreetCoverActive || changes.discreetModeInitialized)) {
    scheduleHomeButtonPortStateUpdate();
  }
});
browser.runtime.onConnect.addListener((port) => {
  if (port.name === "joydash-home-button") {
    if (typeof port.sender.tab?.windowId !== "number") {
      return;
    }
    homeButtonPorts.add(port);
    updateHomeButtonPortFullscreenState(port);
    updateHomeButtonPortStates().catch((error) => {
      console.error("Could not read Joydash discreet page state:", error);
    });
    port.onMessage.addListener((message) => {
      if (message?.type === "joydash:refresh-fullscreen-state") {
        updateHomeButtonPortFullscreenState(port);
        return;
      }
      if (message?.type !== "joydash:cover-favorite-page" &&
          message?.type !== "joydash:reveal-favorite-page" &&
          message?.type !== "joydash:disable-discreet-mode") {
        return;
      }
      const active = message.type === "joydash:cover-favorite-page";
      const disableMode = message.type === "joydash:disable-discreet-mode";
      Promise.all([getFavoriteHosts(), getDiscreetState()]).then(([hosts, state]) => {
        if (!state.coverFavoritePagesEnabled ||
            !isFavoritePage(port.sender.url, hosts) ||
            ((active || disableMode) && !state.discreetModeEnabled)) {
          throw new Error("Discreet mode is not available on this page.");
        }
        return browser.windows.get(port.sender.tab.windowId).then((browserWindow) => {
          if (!discreetModeAppliesInContext(
            state.discreetModeContext,
            browserWindow.state === "fullscreen"
          )) {
            throw new Error("Discreet mode is not available in this window mode.");
          }
          if (!disableMode) {
            return browser.storage.session.set({ discreetCoverActive: active });
          }
          return browser.storage.session.set({ discreetCoverActive: false })
            .then(() => browser.storage.local.set({ discreetModeEnabled: false }))
            .catch(async (error) => {
              if (state.covered) {
                try {
                  await browser.storage.session.set({ discreetCoverActive: true });
                } catch (restoreError) {
                  throw new Error(
                    `Could not disable discreet mode: ${error.message}. The cover could not be restored: ${restoreError.message}`
                  );
                }
              }
              throw error;
            });
        });
      }).catch((error) => {
        console.error("Could not update Joydash discreet cover:", error);
        port.postMessage({
          type: "joydash:cover-error",
          message: error.message
        });
      });
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
  dashboardPagePorts.add(port);
  updateDashboardPagePortFullscreenState(port);
  port.onDisconnect.addListener(() => {
    dashboardPagePorts.delete(port);
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
    for (const port of dashboardPagePorts) {
      updateDashboardPagePortFullscreenState(port, browserWindow);
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

for (const event of [
  browser.bookmarks.onCreated,
  browser.bookmarks.onChanged,
  browser.bookmarks.onMoved,
  browser.bookmarks.onRemoved,
  browser.bookmarks.onChildrenReordered
]) {
  event?.addListener(scheduleHomeButtonPortStateUpdate);
}

refreshHomeButtonRegistration();