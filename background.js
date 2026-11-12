let homeButtonRegistration = null;
let homeButtonRegistrationUpdate = Promise.resolve();
const dashboardHomeTabs = new Map();

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

browser.permissions.onAdded.addListener(refreshHomeButtonRegistration);
browser.permissions.onRemoved.addListener(refreshHomeButtonRegistration);
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.showHomeButton) {
    refreshHomeButtonRegistration();
  }
});
browser.runtime.onConnect.addListener((port) => {
  if (port.name !== "joydash-dashboard-page" ||
      port.sender.url !== browser.runtime.getURL("newtab.html") ||
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
browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "joydash:close-dashboard-tabs") {
    if (sender.url !== browser.runtime.getURL("newtab.html") ||
        typeof sender.tab?.id !== "number") {
      throw new Error("Only Joydash pages can close Joydash tabs.");
    }
    const tabIds = new Set(dashboardHomeTabs.keys());
    tabIds.add(sender.tab.id);
    return browser.tabs.remove([...tabIds]).then(() => ({ ok: true }));
  }
  if (message?.type !== "joydash:return-home") {
    return undefined;
  }
  if (typeof sender.tab?.id !== "number") {
    throw new Error("The Joydash home button requires a browser tab.");
  }
  return browser.tabs.update(sender.tab.id, {
    url: browser.runtime.getURL("newtab.html")
  }).then(() => ({ ok: true }));
});

refreshHomeButtonRegistration();