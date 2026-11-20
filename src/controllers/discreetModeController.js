export function createDiscreetModeController({
  browser,
  document,
  dashboardPage,
  historyHoverPreview,
  toggleButton,
  enabledCheckbox,
  favoritePagesCheckbox,
  contextSelect,
  cover,
  status,
  homeButtonCheckbox,
  historyStatus,
  onCoverChange
}) {
  let enabled = true;
  let favoritePagesEnabled = true;
  let context = "both";
  let coverActive = false;
  let initialized = false;
  let isFullscreen = false;
  let fullscreenStateKnown = false;
  const dashboardPagePort = browser.runtime.connect({ name: "joydash-dashboard-page" });
  const bootCover = document.querySelector("#discreet-cover-boot");
  const bootStatus = document.querySelector("#discreet-cover-boot-status");

  function isContextActive() {
    return context === "both" ||
      !fullscreenStateKnown ||
      (context === "fullscreen" && isFullscreen) ||
      (context === "windowed" && !isFullscreen);
  }

  function isCoverVisible() {
    return enabled && coverActive && isContextActive();
  }

  function updateUI() {
    const coverVisible = isCoverVisible();
    const contextActive = isContextActive();
    toggleButton.hidden = !enabled ||
      !contextActive ||
      (context !== "both" && !fullscreenStateKnown);
    toggleButton.setAttribute("aria-pressed", String(coverVisible));
    cover.hidden = !coverVisible;
    enabledCheckbox.checked = enabled;
    contextSelect.value = context;
    dashboardPage.inert = coverVisible;
    historyHoverPreview.inert = coverVisible;
    status.textContent = coverVisible
      ? "Press Escape to reveal Joydash."
      : "";
    if (coverVisible) {
      cover.focus();
    }
    onCoverChange();
  }

  async function setCover(active) {
    if (active && !enabled) {
      return;
    }
    if (active && context !== "both" && !fullscreenStateKnown) {
      throw new Error("Wait until Firefox reports the window mode before covering Joydash.");
    }
    if (active && !isContextActive()) {
      throw new Error("Discreet mode is not available in this window mode.");
    }
    await browser.storage.session.set({ discreetCoverActive: active });
    coverActive = active;
    updateUI();
    if (!isCoverVisible() && !toggleButton.hidden) {
      toggleButton.focus();
    }
  }

  async function setEnabled(value) {
    const wasCovered = coverActive;
    await browser.storage.session.set({ discreetCoverActive: false });
    try {
      await browser.storage.local.set({ discreetModeEnabled: value });
    } catch (error) {
      if (wasCovered) {
        try {
          await browser.storage.session.set({ discreetCoverActive: true });
        } catch (restoreError) {
          throw new Error(
            `Could not save discreet mode: ${error.message}. The cover could not be restored: ${restoreError.message}`
          );
        }
      }
      throw error;
    }
    enabled = value;
    coverActive = false;
    updateUI();
  }

  async function setContext(value) {
    if (!["both", "fullscreen", "windowed"].includes(value)) {
      throw new Error("Choose F11 full-screen, windowed, or both modes.");
    }
    await browser.storage.local.set({ discreetModeContext: value });
    context = value;
    updateUI();
  }

  async function setFavoritePagesEnabled(value) {
    await browser.storage.local.set({ coverFavoritePagesEnabled: value });
    favoritePagesEnabled = value;
  }

  async function initialize() {
    const [preferences, session] = await Promise.all([
      browser.storage.local.get([
        "discreetModeEnabled",
        "showHomeButton",
        "coverFavoritePagesEnabled",
        "discreetModeContext"
      ]),
      browser.storage.session.get(["discreetCoverActive", "discreetModeInitialized"])
    ]);
    enabled = preferences.discreetModeEnabled !== false;
    favoritePagesEnabled = preferences.coverFavoritePagesEnabled !== false;
    context = ["both", "fullscreen", "windowed"].includes(preferences.discreetModeContext)
      ? preferences.discreetModeContext
      : "both";
    homeButtonCheckbox.checked = preferences.showHomeButton !== false;
    favoritePagesCheckbox.checked = favoritePagesEnabled;
    if (session.discreetModeInitialized === true) {
      coverActive = enabled && session.discreetCoverActive === true;
    } else {
      coverActive = enabled;
      await browser.storage.session.set({
        discreetCoverActive: coverActive,
        discreetModeInitialized: true
      });
    }
    initialized = true;
    updateUI();
    bootCover?.remove();
  }

  function showInitializationError(error) {
    const message = `Could not initialize discreet mode: ${error.message}`;
    status.textContent = message;
    if (bootStatus) {
      bootStatus.textContent = message;
    }
  }

  dashboardPagePort.onMessage.addListener((message) => {
    if (message?.type !== "joydash:fullscreen-state") {
      return;
    }
    isFullscreen = message.fullscreen === true;
    fullscreenStateKnown = true;
    updateUI();
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.discreetModeContext) {
        context = ["both", "fullscreen", "windowed"].includes(
          changes.discreetModeContext.newValue
        )
          ? changes.discreetModeContext.newValue
          : "both";
        if (initialized) {
          updateUI();
        }
      }
      if (changes.discreetModeEnabled && initialized) {
        enabled = changes.discreetModeEnabled.newValue !== false;
        if (!enabled) {
          coverActive = false;
        }
        updateUI();
      }
      if (changes.coverFavoritePagesEnabled && initialized) {
        favoritePagesEnabled = changes.coverFavoritePagesEnabled.newValue !== false;
        favoritePagesCheckbox.checked = favoritePagesEnabled;
      }
      return;
    }
    if (area !== "session" ||
        !changes.discreetCoverActive ||
        !initialized) {
      return;
    }
    const wasCovered = isCoverVisible();
    coverActive = enabled && changes.discreetCoverActive.newValue === true;
    updateUI();
    if (isCoverVisible() && !wasCovered) {
      cover.focus();
    } else if (!isCoverVisible() && wasCovered && enabled) {
      toggleButton.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!isCoverVisible()) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setCover(false).catch((error) => {
        status.textContent = `Could not reveal Joydash: ${error.message}`;
      });
    } else if (event.key === "Tab") {
      event.preventDefault();
      cover.focus();
    }
  });

  document.addEventListener("focusin", (event) => {
    if (isCoverVisible() && !event.composedPath().includes(cover)) {
      cover.focus();
    }
  });

  toggleButton.addEventListener("click", async () => {
    toggleButton.disabled = true;
    historyStatus.textContent = "";
    try {
      await setCover(true);
    } catch (error) {
      historyStatus.textContent = `Could not cover Joydash: ${error.message}`;
    } finally {
      toggleButton.disabled = false;
    }
  });

  enabledCheckbox.addEventListener("change", async () => {
    enabledCheckbox.disabled = true;
    try {
      await setEnabled(enabledCheckbox.checked);
    } catch (error) {
      enabledCheckbox.checked = enabled;
      historyStatus.textContent = `Could not update discreet mode: ${error.message}`;
    } finally {
      enabledCheckbox.disabled = false;
    }
  });

  favoritePagesCheckbox.addEventListener("change", async () => {
    favoritePagesCheckbox.disabled = true;
    try {
      await setFavoritePagesEnabled(favoritePagesCheckbox.checked);
    } catch (error) {
      favoritePagesCheckbox.checked = favoritePagesEnabled;
      historyStatus.textContent = `Could not update favorite-page cover setting: ${error.message}`;
    } finally {
      favoritePagesCheckbox.disabled = false;
    }
  });

  contextSelect.addEventListener("change", async () => {
    contextSelect.disabled = true;
    try {
      await setContext(contextSelect.value);
    } catch (error) {
      contextSelect.value = context;
      historyStatus.textContent = `Could not update discreet mode scope: ${error.message}`;
    } finally {
      contextSelect.disabled = false;
    }
  });

  return {
    initialize,
    isInitialized: () => initialized,
    isCoverActive: () => coverActive,
    isCoverVisible,
    showInitializationError,
    setStatus: (message) => {
      status.textContent = message;
    }
  };
}
