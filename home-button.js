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
      height: auto !important;
      color-scheme: dark !important;
      pointer-events: auto !important;
    }

    :host([hidden]) {
      display: none !important;
    }

    .button-stack {
      position: relative;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .button-stack > button {
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

    .button-stack > button[hidden] {
      display: none;
    }

    .button-stack > button:hover,
    .button-stack > button:focus-visible {
      border-color: #fff;
      background: rgba(32, 32, 36, 0.98);
      opacity: 1;
    }

    .button-stack > button:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
    }

    .button-stack > button:disabled {
      cursor: progress;
    }

    .discreet-cover {
      box-sizing: border-box;
      min-height: 100vh;
      padding: 24px;
      display: grid;
      place-items: center;
      position: fixed;
      z-index: 10000;
      inset: 0;
      background: #080808;
      color: #f7f0eb;
      font-family: Roboto, "Segoe UI", Arial, sans-serif;
    }

    .discreet-cover[hidden] {
      display: none;
    }

    .discreet-cover-panel {
      box-sizing: border-box;
      width: min(380px, 100%);
      padding: 28px;
      border: 1px solid rgba(235, 206, 171, 0.18);
      border-radius: 16px;
      background: #0e0e0e;
      text-align: center;
    }

    .discreet-cover .eyebrow {
      margin: 0 0 7px;
      color: #c99c72;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.24em;
      text-transform: uppercase;
    }

    .discreet-cover-panel h1 {
      margin: 0;
      font-size: clamp(24px, 5vw, 34px);
      font-weight: 400;
      letter-spacing: -0.035em;
    }

    .discreet-cover-panel > p:not(.eyebrow) {
      margin: 10px 0 18px;
      color: #8b9099;
      font-size: 12px;
      line-height: 1.5;
    }

    .home-icon {
      width: 20px;
      height: 20px;
      display: block;
      object-fit: contain;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .button-stack > button {
        transition: none;
      }
    }
  `;

  const buttonStack = document.createElement("div");
  buttonStack.className = "button-stack";
  const coverButton = document.createElement("button");
  coverButton.type = "button";
  coverButton.className = "cover-button";
  coverButton.setAttribute("aria-label", "Cover this favorite page");
  coverButton.title = "Cover this favorite page";
  const coverIcon = document.createElement("img");
  coverIcon.className = "home-icon";
  coverIcon.src = browser.runtime.getURL("icons/ui/hide.svg");
  coverIcon.alt = "";
  coverIcon.setAttribute("aria-hidden", "true");
  coverButton.append(coverIcon);

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
  buttonStack.append(coverButton, button);

  const { element: coverScreen } = globalThis.JoydashDiscreetCover.create(document);

  let homeButtonEnabled = false;
  let isFullscreen = false;
  let fullscreenStateKnown = false;
  let isFavoritePage = false;
  let discreetModeEnabled = false;
  let discreetModeContext = "both";
  let discreetCoverActive = false;
  const isDiscreetModeContextActive = () => discreetModeContext === "both" ||
    (fullscreenStateKnown &&
      ((discreetModeContext === "fullscreen" && isFullscreen) ||
       (discreetModeContext === "windowed" && !isFullscreen)));
  const shouldShowDiscreetCover = () => isFavoritePage &&
    discreetModeEnabled &&
    discreetCoverActive &&
    isDiscreetModeContextActive();
  const coveredPageTitle = "Joydash";
  let originalPageTitle = null;
  let pageTitleObserver = null;
  const updatePageTitle = (covered) => {
    if (covered) {
      if (!pageTitleObserver) {
        originalPageTitle = document.title;
        pageTitleObserver = new MutationObserver(() => {
          if (!shouldShowDiscreetCover() || document.title === coveredPageTitle) {
            return;
          }
          originalPageTitle = document.title;
          document.title = coveredPageTitle;
        });
        pageTitleObserver.observe(document.head, {
          childList: true,
          characterData: true,
          subtree: true
        });
      }
      if (document.title !== coveredPageTitle) {
        originalPageTitle = document.title;
        document.title = coveredPageTitle;
      }
      return;
    }
    if (!pageTitleObserver) {
      return;
    }
    pageTitleObserver.disconnect();
    pageTitleObserver = null;
    if (document.title === coveredPageTitle && originalPageTitle !== null) {
      document.title = originalPageTitle;
    }
    originalPageTitle = null;
  };
  const updateHomeButtonVisibility = () => {
    const showHomeActions = homeButtonEnabled && isFullscreen && !document.fullscreenElement;
    const showCoverAction = isFavoritePage &&
      discreetModeEnabled &&
      isDiscreetModeContextActive();
    const showDiscreetCover = shouldShowDiscreetCover();
    host.hidden = !showHomeActions && !showCoverAction && !showDiscreetCover;
    button.hidden = !showHomeActions || showDiscreetCover;
    coverButton.hidden = !showCoverAction;
    coverButton.title = showDiscreetCover ? "Reveal this favorite page" : "Cover this favorite page";
    coverButton.setAttribute(
      "aria-label",
      showDiscreetCover ? "Reveal this favorite page" : "Cover this favorite page"
    );
    coverScreen.hidden = !showDiscreetCover;
    updatePageTitle(showDiscreetCover);
  };
  let fullscreenPortConnected = true;
  const fullscreenPort = browser.runtime.connect({ name: "joydash-home-button" });
  fullscreenPort.onMessage.addListener((message) => {
    if (message?.type === "joydash:page-state") {
      const wasCovered = shouldShowDiscreetCover();
      isFavoritePage = message.favorite === true;
      discreetModeEnabled = message.discreetModeEnabled === true;
      discreetModeContext = ["both", "fullscreen", "windowed"].includes(message.discreetModeContext)
        ? message.discreetModeContext
        : "both";
      discreetCoverActive = message.covered === true;
      updateHomeButtonVisibility();
      if (shouldShowDiscreetCover() && !wasCovered) {
        coverScreen.focus();
      }
      return;
    }
    if (message?.type === "joydash:cover-error") {
      console.error("Could not update the Joydash cover:", message.message);
      return;
    }
    if (message?.type !== "joydash:fullscreen-state") {
      return;
    }
    const wasCovered = shouldShowDiscreetCover();
    isFullscreen = message.fullscreen === true;
    fullscreenStateKnown = true;
    updateHomeButtonVisibility();
    if (shouldShowDiscreetCover() && !wasCovered) {
      coverScreen.focus();
    }
  });
  document.addEventListener("fullscreenchange", updateHomeButtonVisibility);
  fullscreenPort.onDisconnect.addListener(() => {
    fullscreenPortConnected = false;
    isFullscreen = false;
    fullscreenStateKnown = false;
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
  coverButton.addEventListener("click", () => {
    fullscreenPort.postMessage({
      type: discreetCoverActive
        ? "joydash:reveal-favorite-page"
        : "joydash:cover-favorite-page"
    });
  });
  document.addEventListener("keydown", (event) => {
    if (!shouldShowDiscreetCover()) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      fullscreenPort.postMessage({ type: "joydash:reveal-favorite-page" });
    } else if (event.key === "Tab") {
      event.preventDefault();
      coverButton.focus();
    }
  }, true);
  document.addEventListener("focusin", (event) => {
    if (shouldShowDiscreetCover() &&
        !event.composedPath().includes(host)) {
      coverScreen.focus();
    }
  }, true);

  shadowRoot.append(style, buttonStack, coverScreen);
  const appendHost = () => {
    if (!document.documentElement) {
      return false;
    }
    document.documentElement.append(host);
    updateHomeButtonVisibility();
    if (shouldShowDiscreetCover()) {
      coverScreen.focus();
    }
    return true;
  };
  if (!appendHost()) {
    const rootObserver = new MutationObserver(() => {
      if (appendHost()) {
        rootObserver.disconnect();
      }
    });
    rootObserver.observe(document, { childList: true });
  }

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
