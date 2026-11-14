if (!globalThis.__joydashHomeButtonInstalled) {
  globalThis.__joydashHomeButtonInstalled = true;

  const host = document.createElement("div");
  host.hidden = true;
  const shadowRoot = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial !important;
      position: fixed !important;
      z-index: 2147483647 !important;
      right: 16px !important;
      bottom: 16px !important;
      display: block !important;
      width: 42px !important;
      height: 42px !important;
      color-scheme: dark !important;
      pointer-events: auto !important;
    }

    :host([hidden]) {
      display: none !important;
    }

    button {
      all: initial;
      box-sizing: border-box;
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 12px;
      background: rgba(15, 15, 18, 0.9);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.38);
      color: #f5f5f5;
      cursor: pointer;
      opacity: 0.82;
      transition: opacity 140ms ease, background-color 140ms ease, border-color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }

    button:hover,
    button:focus-visible {
      border-color: rgba(255, 255, 255, 0.72);
      background: rgba(32, 32, 36, 0.98);
      opacity: 1;
    }

    button:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
    }

    button:disabled {
      cursor: progress;
    }

    .home-icon {
      width: 20px;
      height: 20px;
      display: block;
      object-fit: contain;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  `;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Return to Joydash home page");
  button.title = "Return to Joydash";
  const icon = document.createElement("img");
  icon.className = "home-icon";
  icon.src = browser.runtime.getURL("icons/ui/home.svg");
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  button.append(icon);
  let homeButtonEnabled = false;
  let isFullscreen = false;
  const updateHomeButtonVisibility = () => {
    host.hidden = !homeButtonEnabled || !isFullscreen || Boolean(document.fullscreenElement);
  };
  let fullscreenPortConnected = true;
  const fullscreenPort = browser.runtime.connect({ name: "joydash-home-button" });
  fullscreenPort.onMessage.addListener((message) => {
    if (message?.type !== "joydash:fullscreen-state") {
      return;
    }
    isFullscreen = message.fullscreen === true;
    updateHomeButtonVisibility();
  });
  document.addEventListener("fullscreenchange", updateHomeButtonVisibility);
  fullscreenPort.onDisconnect.addListener(() => {
    fullscreenPortConnected = false;
    isFullscreen = false;
    updateHomeButtonVisibility();
  });
  window.addEventListener("resize", () => {
    if (fullscreenPortConnected) {
      fullscreenPort.postMessage({ type: "joydash:refresh-fullscreen-state" });
    }
  });
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    button.disabled = true;
    try {
      const result = await browser.runtime.sendMessage({
        type: "joydash:return-home"
      });
      if (!result?.ok) {
        throw new Error("The Joydash page could not be opened.");
      }
    } catch (error) {
      console.error("Could not return to Joydash:", error);
      button.disabled = false;
      button.title = "Could not return to Joydash";
    }
  });

  shadowRoot.append(style, button);
  document.documentElement.append(host);

  let homeButtonPreferenceChanged = false;
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.showHomeButton) {
      return;
    }
    homeButtonPreferenceChanged = true;
    homeButtonEnabled = changes.showHomeButton.newValue !== false;
    updateHomeButtonVisibility();
  });
  browser.storage.local.get("showHomeButton")
    .then((preferences) => {
      if (!homeButtonPreferenceChanged) {
        homeButtonEnabled = preferences.showHomeButton !== false;
        updateHomeButtonVisibility();
      }
    })
    .catch((error) => console.error("Could not read the Joydash Home button setting:", error));
}
