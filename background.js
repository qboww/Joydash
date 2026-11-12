let homeButtonRegistration = null;
let homeButtonRegistrationUpdate = Promise.resolve();

async function updateHomeButtonRegistration() {
  const hasAllSitesAccess = await browser.permissions.contains({
    origins: ["<all_urls>"]
  });
  if (hasAllSitesAccess && !homeButtonRegistration) {
    homeButtonRegistration = await browser.contentScripts.register({
      matches: ["http://*/*", "https://*/*"],
      js: [{ file: "home-button.js" }],
      runAt: "document_idle"
    });
  } else if (!hasAllSitesAccess && homeButtonRegistration) {
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
browser.runtime.onMessage.addListener((message, sender) => {
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