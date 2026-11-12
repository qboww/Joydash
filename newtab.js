if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const bookmarkFolderSelect = document.querySelector("#bookmark-folder");
const bookmarkStatus = document.querySelector("#bookmark-status");
const bookmarkGrid = document.querySelector("#bookmark-grid");
const bookmarkEmpty = document.querySelector("#bookmark-empty");
const manageShortcutsButton = document.querySelector("#manage-shortcuts");
const shortcutsHelp = document.querySelector("#shortcuts-help");
const hiddenShortcuts = document.querySelector("#hidden-shortcuts");
const hiddenShortcutList = document.querySelector("#hidden-shortcut-list");
const continueContent = document.querySelector("#continue-content");
const toggleContinueSectionButton = document.querySelector("#toggle-continue-section");
const enableAutomaticPreviewsButton = document.querySelector("#enable-automatic-previews");
const historyStatus = document.querySelector("#history-status");
const historyInfoStatus = document.querySelector("#history-info-status");
const historyGrid = document.querySelector("#history-grid");
const historyEmpty = document.querySelector("#history-empty");
const historySearchInput = document.querySelector("#history-search");
const clearHistorySearchButton = document.querySelector("#clear-history-search");
const historySiteFilter = document.querySelector("#history-site-filter");
const historyDateFilter = document.querySelector("#history-date-filter");
const historyVideoOnlyFilter = document.querySelector("#history-video-only");
const historyIncludeNoPreviewFilter = document.querySelector("#history-include-no-preview");
const resetHistoryFiltersButton = document.querySelector("#reset-history-filters");
const historyFilterStatus = document.querySelector("#history-filter-status");
const showLessHistoryButton = document.querySelector("#show-less-history");
const loadMoreHistoryButton = document.querySelector("#load-more-history");
const manageDashboardSectionsButton = document.querySelector("#manage-dashboard-sections");
const saveDashboardSectionOrderButton = document.querySelector("#save-dashboard-section-order");
const homeButtonEnabledCheckbox = document.querySelector("#show-home-button");
const dashboardSectionArranger = document.querySelector("#dashboard-section-arranger");
const dashboardSectionOrderList = document.querySelector("#dashboard-section-order-list");
const dashboardSectionOrderStatus = document.querySelector("#dashboard-section-order-status");
const dashboardSectionStack = document.querySelector("#dashboard-section-stack");
const favoriteSiteVideosSection = document.querySelector("#favorite-site-videos-section");
const favoriteSiteVideos = document.querySelector("#favorite-site-videos");
const favoriteSiteSelect = document.querySelector("#favorite-site-select");
const favoriteSitePreviousRowButton = document.querySelector("#favorite-site-previous-row");
const favoriteSiteNextRowButton = document.querySelector("#favorite-site-next-row");
const favoriteSiteStatus = document.querySelector("#favorite-site-status");
const randomVideoSection = document.querySelector("#random-video-section");
const randomVideoBackButton = document.querySelector("#random-video-back");
const randomVideoForwardButton = document.querySelector("#random-video-forward");
const randomVideoSlots = [1, 2].map((slotNumber) => {
  const player = document.querySelector(`#random-video-player-${slotNumber}`);
  return {
    element: player.closest(".random-video-slot"),
    player,
    previousPoster: document.querySelector(`#random-video-previous-poster-${slotNumber}`),
    poster: document.querySelector(`#random-video-poster-${slotNumber}`),
    title: document.querySelector(`#random-video-title-${slotNumber}`),
    site: document.querySelector(`#random-video-site-${slotNumber}`),
    currentItem: null,
    transitionTimer: null
  };
});
const randomVideoStatus = document.querySelector("#random-video-status");
const favoriteHistoryList = document.querySelector("#favorite-history-list");
const favoriteHistoryEmpty = document.querySelector("#favorite-history-empty");
const historyRailDate = document.querySelector("#history-rail-date");
const historyRailClock = document.querySelector("#history-rail-clock");
const historyHoverPreview = document.querySelector("#history-hover-preview");
const historyHoverPreviewImage = document.querySelector("#history-hover-preview-image");
const historyHoverPreviewTitle = document.querySelector("#history-hover-preview-title");
const historyHoverPreviewMessage = document.querySelector("#history-hover-preview-message");
const clearPreviewsButton = document.querySelector("#clear-previews");
const loadPreviewsButton = document.querySelector("#load-previews");
const discreetModeToggleButton = document.querySelector("#toggle-discreet-mode");
const discreetModeEnabledCheckbox = document.querySelector("#discreet-mode-enabled");
const discreetCover = document.querySelector("#discreet-cover");
const discreetCoverStatus = document.querySelector("#discreet-cover-status");
const revealDiscreetCoverButton = document.querySelector("#reveal-discreet-cover");
const disableDiscreetModeButton = document.querySelector("#disable-discreet-mode");
const dashboardPage = document.querySelector(".page");
const dashboardPagePort = browser.runtime.connect({ name: "joydash-dashboard-page" });

let bookmarkFolders = [];
let selectedBookmarkFolderId = "";
let selectedFavoriteSiteHostname = "";
let favoriteSiteRowIndex = 0;
let favoriteSiteRowTransitionTimer = null;
let allSitesPermissionGranted = false;
let bookmarkGroups = [];
let bookmarkedSites = new Map();
let favoriteBookmarkedSites = new Map();
let favoriteSiteHistoryItems = [];
let favoriteSiteHistoryReady = false;
let favoriteSiteRows = [];
let favoriteSiteRowLoadInProgress = false;
let automaticSectionsInitialRevealComplete = false;
let automaticSectionRevealInProgress = false;
let automaticSectionsRevealed = new Set();
let dashboardSectionOrder = [];
let dashboardSectionOrderDraft = [];
let dashboardSectionOrderSaving = false;
let dashboardSectionPointerDrag = null;
let shortcutPreferences = {};
let manageShortcuts = false;
let draggedShortcut = null;
let continueSectionCollapsed = false;
let historyGroupLimits = new Map();
let bookmarkIconsLoading = false;
let faviconCache = {};
let historyCards = [];
let historyItems = [];
let historyVisibleCount = 0;
let historyDisplayLimit = 0;
let historyFilterControlsBusy = false;
let historyFilterDebounceTimer;
let historyHasMoreResults = false;
let historyOlderEndTime = null;
let historySeenUrls = new Set();
let historyPageLoadPromise = null;
let historyGroupLoadsInProgress = new Set();
let historyFillInProgress = false;
let historyInitialBatchLoading = false;
let historyVisibilityDeferred = false;
let historyLoadInProgress = false;
let historyLoadRequested = false;
let previewCache = {};
let previewMetadataCache = {};
let discreetModeEnabled = true;
let discreetCoverActive = false;
let discreetModeInitialized = false;
let historySnapshot = null;
let historySnapshotNeedsRefresh = false;
let randomVideoObserver = null;
let randomVideoIsVisible = false;
let randomVideoVisibilityEventsAttached = false;
let randomVideoTimer = null;
let randomVideoSourceScanInProgress = false;
let randomVideoAdvancePending = false;
let randomVideoHistoryLoadInProgress = false;
let randomVideoPlayedUrls = new Set();
let randomVideoExploredUrls = new Set();
let randomVideoPermittedUrls = new Set();
let randomVideoSourceAttempts = new Set();
let favoriteSiteVideoObserver = null;
let favoriteSiteVideosAreVisible = false;
let favoriteSitePreviewScanInProgress = false;
let favoriteSitePreviewAttempts = new Set();
let favoriteSiteHistoryLoadVersion = 0;
let randomVideoBackHistory = [];
let randomVideoForwardHistory = [];
let randomVideoClickedUrls = new Set();
const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let activeHistoryPreviewEntry = null;
let historyHoverPreviewTimer;
let historyHoverPreviewHideTimer;
const historyHoverPreviewCache = new Map();
const historyHoverPreviewRequests = new Map();
let previewPhase = "pages";
let refreshTimer;
let historyRefreshTimer;
const MAX_HISTORY_RESULTS = 500;
const MAX_PREVIEW_METADATA = 250;
const HISTORY_GROUP_PAGE_BATCH = 5;
const MAX_HISTORY_SCAN_ITEMS = 80;
const MAX_HISTORY_PAGES_PER_FILL = 5;
const MAX_SAVED_POSTERS = 16;
const HISTORY_SNAPSHOT_REFRESH_MS = 24 * 60 * 60 * 1000;
const HISTORY_SYNC_OVERLAP_MS = 60 * 1000;
const PREVIEW_METADATA_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HISTORY_HOVER_PREVIEWS = 16;
const HISTORY_HOVER_PREVIEW_DELAY_MS = 180;
const HISTORY_FILTER_DEBOUNCE_MS = 500;
const FAVORITE_SITE_SEARCH_STATUS_DELAY_MS = 1_000;
const MAX_FAVORITE_SITE_CARDS = 4;
const MAX_FAVORITE_SITE_PREVIEW_ATTEMPTS_PER_SITE = MAX_FAVORITE_SITE_CARDS;
const MAX_FAVORITE_SITE_PREVIEW_CHECKS = 16;
const MAX_FAVORITE_SITE_PREVIEW_CHECKS_PER_NEXT = 16;
const MAX_RANDOM_PREVIEW_CHECKS = 8;
const AUTOMATIC_SECTION_REVEAL_MS = 450;
const PREVIEW_CLASSIFICATION_VERSION = 2;
const MAX_RANDOM_VIDEO_SOURCE_SCANS = 8;
const MAX_RANDOM_VIDEO_HISTORY = 3;
const RANDOM_VIDEO_DURATION_MS = 5_000;
const MAX_POSTER_DATA_URL_LENGTH = 400_000;
const POSTER_QUALITY_VERSION = 2;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_FAVICON_BYTES = 256 * 1024;
const MAX_FAVICON_CACHE = 64;
const BOOKMARKS_TIMEOUT_MS = 5_000;

for (const slot of randomVideoSlots) {
  slot.element.addEventListener("click", handleRandomVideoSlotClick);
}

async function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function updateDiscreetModeUI() {
  discreetModeToggleButton.hidden = !discreetModeEnabled;
  discreetModeToggleButton.setAttribute("aria-pressed", String(discreetCoverActive));
  discreetCover.hidden = !discreetCoverActive;
  revealDiscreetCoverButton.hidden = !discreetCoverActive;
  disableDiscreetModeButton.hidden = !discreetCoverActive;
  discreetModeEnabledCheckbox.checked = discreetModeEnabled;
  dashboardPage.inert = discreetCoverActive;
  historyHoverPreview.inert = discreetCoverActive;
  discreetCoverStatus.textContent = discreetCoverActive
    ? "Your dashboard stays covered until you reveal it or Firefox closes."
    : "";
  updateRandomVideoPlayback();
}

async function initializeDiscreetMode() {
  const [preferences, session] = await Promise.all([
    browser.storage.local.get(["discreetModeEnabled", "showHomeButton"]),
    browser.storage.session.get("discreetCoverActive")
  ]);
  discreetModeEnabled = preferences.discreetModeEnabled !== false;
  homeButtonEnabledCheckbox.checked = preferences.showHomeButton !== false;
  discreetCoverActive = discreetModeEnabled && session.discreetCoverActive === true;
  discreetModeInitialized = true;
  updateDiscreetModeUI();
}

async function setDiscreetCover(active) {
  if (active && !discreetModeEnabled) {
    return;
  }
  await browser.storage.session.set({ discreetCoverActive: active });
  discreetCoverActive = active;
  updateDiscreetModeUI();
  if (active) {
    revealDiscreetCoverButton.focus();
  } else {
    discreetModeToggleButton.focus();
  }
}

async function setDiscreetModeEnabled(enabled) {
  const wasCovered = discreetCoverActive;
  await browser.storage.session.set({ discreetCoverActive: false });
  try {
    await browser.storage.local.set({ discreetModeEnabled: enabled });
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
  discreetModeEnabled = enabled;
  discreetCoverActive = false;
  updateDiscreetModeUI();
}

function showBookmarkLoadError(error) {
  const option = document.createElement("option");
  option.textContent = "Bookmarks unavailable";
  bookmarkFolderSelect.replaceChildren(option);
  bookmarkFolderSelect.disabled = true;
  bookmarkStatus.textContent = `Could not read Firefox bookmarks: ${error.message}`;
  bookmarkGrid.replaceChildren();
  hiddenShortcutList.replaceChildren();
  hiddenShortcuts.hidden = true;
  shortcutsHelp.hidden = !manageShortcuts;
  bookmarkEmpty.hidden = false;
  bookmarkEmpty.textContent = "Check Joydash's Bookmarks permission in about:addons, then reload this tab.";
  bookmarkedSites = new Map();
  historyGrid.replaceChildren();
  historyCards = [];
  historyItems = [];
  historyVisibleCount = 0;
  historyDisplayLimit = 0;
  historyHasMoreResults = false;
  historyOlderEndTime = null;
  updateHistoryFilterOptions();
  updateHistoryFilterStatus();
  historyStatus.textContent = "Recent previews are hidden until Firefox bookmarks are available.";
  historyEmpty.hidden = false;
  historyEmpty.textContent = "Cannot verify your favorites, so previews are hidden.";
  favoriteSiteVideos.replaceChildren();
  favoriteSiteVideosSection.hidden = true;
  randomVideoSection.hidden = true;
  stopRandomVideoPlayback();
  for (const slot of randomVideoSlots) {
    slot.currentItem = null;
  }
  favoriteHistoryList.replaceChildren();
  favoriteHistoryEmpty.hidden = false;
  favoriteHistoryEmpty.textContent = "History is hidden until Firefox bookmarks are available.";
  loadPreviewsButton.disabled = true;
  loadMoreHistoryButton.hidden = true;
  showLessHistoryButton.hidden = true;
}

function getBookmarkFolders(root) {
  const folders = [];

  function visit(folder) {
    if (!Array.isArray(folder.children)) {
      return;
    }

    const title = folder.title?.trim() || "Bookmarks";
    folders.push({ id: folder.id, label: title });
    for (const child of folder.children) {
      if (Array.isArray(child.children)) {
        visit(child);
      }
    }
  }

  for (const child of root.children ?? []) {
    if (Array.isArray(child.children)) {
      visit(child);
    }
  }
  return folders;
}

function renderBookmarkFolders() {
  bookmarkFolderSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = bookmarkFolders.length === 0
    ? "No bookmark folders found"
    : "Choose a folder...";
  placeholder.disabled = true;
  bookmarkFolderSelect.append(placeholder);
  for (const folder of bookmarkFolders) {
    const option = document.createElement("option");
    option.value = folder.id;
    option.textContent = folder.label;
    bookmarkFolderSelect.append(option);
  }
  bookmarkFolderSelect.value = selectedBookmarkFolderId;
  bookmarkFolderSelect.disabled = bookmarkFolders.length === 0;
}

function renderFavoriteSiteOptions() {
  favoriteSiteSelect.replaceChildren();
  const allSitesOption = document.createElement("option");
  allSitesOption.value = "";
  allSitesOption.textContent = favoriteBookmarkedSites.size === 0
    ? "No bookmarked sites found"
    : "All bookmarked sites";
  allSitesOption.disabled = favoriteBookmarkedSites.size === 0;
  favoriteSiteSelect.append(allSitesOption);
  const sortedSites = [...favoriteBookmarkedSites.values()].sort((first, second) =>
    first.name.localeCompare(second.name) || first.hostname.localeCompare(second.hostname)
  );
  for (const site of sortedSites) {
    const option = document.createElement("option");
    option.value = site.hostname;
    option.textContent = site.name === site.hostname
      ? site.hostname
      : `${site.name} (${site.hostname})`;
    favoriteSiteSelect.append(option);
  }
  favoriteSiteSelect.value = selectedFavoriteSiteHostname;
  favoriteSiteSelect.disabled = favoriteBookmarkedSites.size === 0;
}

function getDashboardSections() {
  return [...dashboardSectionStack.children].filter((section) =>
    section.dataset.dashboardSection
  );
}

function updateHistoryRailDateTime() {
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(now);
  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(now);
  historyRailDate.textContent = formattedDate;
  historyRailDate.dateTime = now.toISOString();
  historyRailDate.setAttribute("aria-label", `Local date: ${formattedDate}`);
  historyRailClock.textContent = formattedTime;
  historyRailClock.dateTime = now.toISOString();
  historyRailClock.setAttribute("aria-label", `Local time: ${formattedTime}`);
  window.setTimeout(
    updateHistoryRailDateTime,
    60_000 - (Date.now() % 60_000)
  );
}

function normalizeDashboardSectionOrder(savedOrder) {
  const availableIds = getDashboardSections().map((section) => section.dataset.dashboardSection);
  const validSavedIds = Array.isArray(savedOrder)
    ? savedOrder.filter((id) => typeof id === "string" && availableIds.includes(id))
    : [];
  return [...new Set([...validSavedIds, ...availableIds])];
}

function hasDashboardSectionOrderChanges() {
  return dashboardSectionOrderDraft.length !== dashboardSectionOrder.length ||
    dashboardSectionOrderDraft.some((sectionId, index) =>
      sectionId !== dashboardSectionOrder[index]
    );
}

function setDashboardSectionOrderDraft(order) {
  dashboardSectionOrderDraft = normalizeDashboardSectionOrder(order);
  dashboardSectionOrderStatus.textContent = hasDashboardSectionOrderChanges()
    ? "Unsaved order changes."
    : "";
  renderDashboardSectionOrderList();
}

function renderDashboardSectionOrderList() {
  dashboardSectionOrderList.replaceChildren();
  const sectionsById = new Map(
    getDashboardSections().map((section) => [section.dataset.dashboardSection, section])
  );
  dashboardSectionOrderDraft.forEach((sectionId, index) => {
    const section = sectionsById.get(sectionId);
    if (!section) {
      return;
    }
    const item = document.createElement("li");
    item.className = "dashboard-section-order-item";
    item.dataset.dashboardSection = sectionId;
    item.draggable = false;
    const label = document.createElement("span");
    label.textContent = section.dataset.dashboardSectionLabel;
    const controls = document.createElement("div");
    controls.className = "dashboard-section-order-controls";
    for (const [direction, text] of [[-1, "Up"], [1, "Down"]]) {
      const button = document.createElement("button");
      button.className = "text-button dashboard-section-order-button";
      button.type = "button";
      button.textContent = text;
      button.setAttribute("aria-label", `Move ${section.dataset.dashboardSectionLabel} ${text.toLowerCase()}`);
      button.disabled = dashboardSectionOrderSaving ||
        index + direction < 0 ||
        index + direction >= dashboardSectionOrderDraft.length;
      button.addEventListener("click", () => {
        void moveDashboardSection(sectionId, direction);
      });
      controls.append(button);
    }
    item.append(label, controls);
    dashboardSectionOrderList.append(item);
  });
  saveDashboardSectionOrderButton.disabled = dashboardSectionOrderSaving ||
    !hasDashboardSectionOrderChanges();
}

function applyDashboardSectionOrder(order) {
  dashboardSectionOrder = normalizeDashboardSectionOrder(order);
  dashboardSectionOrderDraft = [...dashboardSectionOrder];
  const sectionsById = new Map(
    getDashboardSections().map((section) => [section.dataset.dashboardSection, section])
  );
  for (const sectionId of dashboardSectionOrder) {
    const section = sectionsById.get(sectionId);
    if (section) {
      dashboardSectionStack.append(section);
    }
  }
  renderDashboardSectionOrderList();
}

async function saveDashboardSectionOrder(order) {
  if (dashboardSectionOrderSaving) {
    return;
  }
  const nextOrder = normalizeDashboardSectionOrder(order);
  if (nextOrder.length === dashboardSectionOrder.length &&
      nextOrder.every((sectionId, index) => sectionId === dashboardSectionOrder[index])) {
    return;
  }
  const previousOrder = [...dashboardSectionOrder];
  dashboardSectionOrderSaving = true;
  dashboardSectionOrderStatus.textContent = "";
  applyDashboardSectionOrder(nextOrder);
  try {
    await browser.storage.local.set({ dashboardSectionOrder });
    dashboardSectionOrderStatus.textContent = "Section order saved.";
  } catch (error) {
    applyDashboardSectionOrder(previousOrder);
    dashboardSectionOrderStatus.textContent = `Could not save section order: ${error.message}`;
  } finally {
    dashboardSectionOrderSaving = false;
    renderDashboardSectionOrderList();
  }
}

async function moveDashboardSection(sectionId, direction) {
  if (dashboardSectionOrderSaving) {
    return;
  }
  const currentIndex = dashboardSectionOrderDraft.indexOf(sectionId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= dashboardSectionOrderDraft.length) {
    return;
  }
  const nextOrder = [...dashboardSectionOrderDraft];
  [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
  setDashboardSectionOrderDraft(nextOrder);
}

function updateAutomaticSectionVisibility() {
  if (!favoriteSiteHistoryReady && !automaticSectionsInitialRevealComplete) {
    return;
  }
  if (automaticSectionRevealInProgress) {
    return;
  }
  const automaticSections = getDashboardSections().filter((section) =>
    section.dataset.dashboardSection !== "recent-history"
  );
  if (automaticSectionsInitialRevealComplete) {
    for (const section of automaticSections) {
      const shouldShow = section.dataset.dashboardSection === "favorite-sites"
        ? bookmarkFolders.length > 0
        : getAutomaticVideoItems().length > 0;
      const wasHidden = section.hidden;
      section.hidden = !shouldShow;
      if (shouldShow && wasHidden) {
        animateAutomaticHistorySection(section);
      }
    }
    return;
  }
  for (const section of automaticSections) {
    const sectionId = section.dataset.dashboardSection;
    if (automaticSectionsRevealed.has(sectionId)) {
      continue;
    }
    const shouldShow = sectionId === "favorite-sites"
      ? bookmarkFolders.length > 0
      : getAutomaticVideoItems().length > 0;
    if (!shouldShow) {
      automaticSectionsRevealed.add(sectionId);
      continue;
    }
    section.hidden = false;
    automaticSectionRevealInProgress = true;
    animateAutomaticHistorySection(section, () => {
      if (!section.hidden) {
        automaticSectionsRevealed.add(sectionId);
      }
      automaticSectionRevealInProgress = false;
  updateAutomaticSectionVisibility();
    });
    return;
  }
  automaticSectionsInitialRevealComplete = true;
  updateAutomaticSectionVisibility();
}

function getShortcutPreference(group) {
  const bookmarkIds = group.items.map((item) => item.id);
  const saved = shortcutPreferences[group.id];
  const savedOrder = Array.isArray(saved?.order)
    ? saved.order.filter((id) => typeof id === "string" && bookmarkIds.includes(id))
    : [];
  const order = [...new Set([...savedOrder, ...bookmarkIds])];
  const hidden = Array.isArray(saved?.hidden)
    ? [...new Set(saved.hidden.filter((id) => typeof id === "string" && bookmarkIds.includes(id)))]
    : [];
  return { order, hidden };
}

function updateContinueSection() {
  continueContent.hidden = continueSectionCollapsed;
  toggleContinueSectionButton.textContent = continueSectionCollapsed ? "Show previews" : "Hide previews";
  toggleContinueSectionButton.setAttribute("aria-expanded", String(!continueSectionCollapsed));
  updateRandomVideoVisibility();
  if (!continueSectionCollapsed && !favoriteSiteVideosSection.hidden) {
    observeFavoriteSiteVideoSection();
    if (favoriteSiteVideosAreVisible) {
      void scanFavoriteSitePreviews();
    }
  }
}

function isWebsiteBookmark(item) {
  if (typeof item.url !== "string") {
    return false;
  }
  try {
    const url = new URL(item.url);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getBookmarkedSites(bookmarks) {
  const sites = new Map();
  for (const node of bookmarks) {
    if (isWebsiteBookmark(node)) {
      const url = getHistoryUrl(node.url);
      if (url) {
        const hostname = url.hostname.replace(/^www\./i, "");
        const name = node.title?.trim();
        const isRootPage = url.pathname === "/" && !url.search;
        const site = sites.get(hostname);
        if (!site) {
          sites.set(hostname, {
            hostname,
            name: name || hostname,
            nameIsRootPage: isRootPage,
            origins: new Set([url.origin])
          });
        } else {
          site.origins.add(url.origin);
          if (isRootPage && name && !site.nameIsRootPage) {
            site.name = name;
            site.nameIsRootPage = true;
          }
        }
      }
    }
  }
  return sites;
}

function getBookmarkedSiteHostname(value) {
  return getBookmarkedSiteHostnameFrom(value, bookmarkedSites);
}

function getBookmarkedSiteHostnameFrom(value, sites) {
  const url = getHistoryUrl(value);
  if (!url) {
    return null;
  }
  const labels = url.hostname.replace(/^www\./i, "").split(".");
  return labels
    .map((_, index) => labels.slice(index).join("."))
    .find((hostname) => sites.has(hostname)) ?? null;
}

function getFavoriteBookmarkedSitesInScope() {
  if (!selectedFavoriteSiteHostname) {
    return favoriteBookmarkedSites;
  }
  const site = favoriteBookmarkedSites.get(selectedFavoriteSiteHostname);
  return site
    ? new Map([[selectedFavoriteSiteHostname, site]])
    : favoriteBookmarkedSites;
}

function isBookmarkedWebsite(value) {
  return getBookmarkedSiteHostname(value) !== null;
}

function getBookmarkGroup(folder) {
  return {
    id: folder.id,
    title: folder.title?.trim() || "Bookmarks",
    items: (folder.children ?? []).filter(isWebsiteBookmark)
  };
}

function findBookmarkFolder(root, id) {
  if (root.id === id) {
    return root;
  }
  for (const child of root.children ?? []) {
    if (Array.isArray(child.children)) {
      const match = findBookmarkFolder(child, id);
      if (match) {
        return match;
      }
    }
  }
  return null;
}

function renderBookmarks(groups) {
  bookmarkGrid.replaceChildren();
  hiddenShortcutList.replaceChildren();
  bookmarkEmpty.hidden = groups.length > 0;
  hiddenShortcuts.hidden = true;
  bookmarkGrid.classList.toggle("is-arranging", manageShortcuts);
  manageShortcutsButton.textContent = manageShortcuts ? "Done" : "Arrange";
  manageShortcutsButton.setAttribute("aria-pressed", String(manageShortcuts));
  shortcutsHelp.hidden = !manageShortcuts;
  if (groups.length === 0) {
    bookmarkEmpty.textContent = bookmarkFolders.length === 0
      ? "No Firefox bookmark folders were found."
      : !selectedBookmarkFolderId
        ? "Choose a folder above to see its bookmarks."
        : "The selected Firefox bookmark folder is unavailable.";
    return;
  }

  let hiddenShortcutCount = 0;
  for (const group of groups) {
    const groupElement = document.createElement("section");
    groupElement.className = "bookmark-group";
    const headingRow = document.createElement("div");
    headingRow.className = "bookmark-group-heading";
    const heading = document.createElement("h3");
    heading.className = "bookmark-group-title";
    heading.textContent = group.title;
    headingRow.append(heading);
    const row = document.createElement("div");
    row.className = "bookmark-group-items";
    row.addEventListener("dragover", (event) => {
      if (!manageShortcuts || draggedShortcut?.groupId !== group.id) {
        return;
      }
      event.preventDefault();
      const target = event.target.closest(".bookmark-icon-tile");
      const draggedTile = row.querySelector(".bookmark-icon-tile.is-dragging");
      if (!target || !draggedTile || target === draggedTile) {
        return;
      }
      const targetBounds = target.getBoundingClientRect();
      const insertAfter = event.clientX > targetBounds.left + targetBounds.width / 2;
      row.insertBefore(draggedTile, insertAfter ? target.nextSibling : target);
    });
    row.addEventListener("drop", (event) => {
      if (!manageShortcuts || draggedShortcut?.groupId !== group.id) {
        return;
      }
      event.preventDefault();
      const preference = getShortcutPreference(group);
      const visibleOrder = [...row.querySelectorAll(".bookmark-icon-tile")]
        .map((tile) => tile.dataset.bookmarkId);
      let visibleIndex = 0;
      preference.order = preference.order.map((id) =>
        preference.hidden.includes(id) ? id : visibleOrder[visibleIndex++] ?? id
      );
      saveShortcutPreference(group.id, preference);
    });
    const preference = getShortcutPreference(group);
    const bookmarksById = new Map(group.items.map((item) => [item.id, item]));
    const orderedBookmarks = preference.order
      .map((id) => bookmarksById.get(id))
      .filter(Boolean);
    const hiddenIds = new Set(preference.hidden);
    const visibleBookmarks = orderedBookmarks.filter((bookmark) => !hiddenIds.has(bookmark.id));
    if (visibleBookmarks.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state bookmark-group-empty";
      empty.textContent = group.items.length === 0
        ? "No website bookmarks in this folder."
        : "No visible shortcuts. Choose Arrange to restore a hidden shortcut.";
      row.append(empty);
    }

    for (const bookmark of visibleBookmarks) {
      const url = new URL(bookmark.url);
      const bookmarkLabel = bookmark.title?.trim() || url.hostname;
      const tile = document.createElement("article");
      tile.className = "bookmark-icon-tile";
      tile.dataset.bookmarkId = bookmark.id;
      tile.draggable = manageShortcuts;
      tile.addEventListener("dragstart", (event) => {
        if (!manageShortcuts) {
          event.preventDefault();
          return;
        }
        draggedShortcut = { groupId: group.id, bookmarkId: bookmark.id };
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", bookmark.id);
        tile.classList.add("is-dragging");
      });
      tile.addEventListener("dragend", () => {
        tile.classList.remove("is-dragging");
        draggedShortcut = null;
      });
      const link = document.createElement("a");
      link.className = "bookmark-icon-link";
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = bookmarkLabel;
      link.setAttribute("aria-label", `Open ${bookmarkLabel}`);
      const savedFavicon = faviconCache[url.origin];
      if (savedFavicon) {
        const icon = document.createElement("img");
        icon.className = "bookmark-favicon";
        icon.src = savedFavicon;
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        link.append(icon);
      } else {
        const mark = document.createElement("span");
        mark.className = "bookmark-icon";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = bookmarkLabel.slice(0, 1).toUpperCase();
        link.append(mark);
      }
      tile.append(link);
      if (manageShortcuts) {
        const controls = document.createElement("div");
        controls.className = "shortcut-controls";
        const hideButton = document.createElement("button");
        hideButton.className = "shortcut-control-button";
        hideButton.type = "button";
        hideButton.textContent = "×";
        hideButton.title = `Hide ${bookmarkLabel}`;
        hideButton.setAttribute("aria-label", `Hide ${bookmarkLabel}`);
        hideButton.addEventListener("click", () => {
          setShortcutHidden(group.id, bookmark.id, true);
        });
        controls.append(hideButton);
        tile.append(controls);
      }
      row.append(tile);
    }
    groupElement.append(headingRow, row);
    bookmarkGrid.append(groupElement);

    for (const bookmark of orderedBookmarks) {
      if (!hiddenIds.has(bookmark.id)) {
        continue;
      }
      hiddenShortcutCount += 1;
      const url = new URL(bookmark.url);
      const bookmarkLabel = bookmark.title?.trim() || url.hostname;
      const restoreButton = document.createElement("button");
      restoreButton.className = "text-button hidden-shortcut-button";
      restoreButton.type = "button";
      restoreButton.textContent = `Restore ${bookmarkLabel}`;
      restoreButton.addEventListener("click", () => {
        setShortcutHidden(group.id, bookmark.id, false);
      });
      hiddenShortcutList.append(restoreButton);
    }
  }

  manageShortcutsButton.textContent = manageShortcuts ? "Done" : "Arrange";
  manageShortcutsButton.setAttribute("aria-pressed", String(manageShortcuts));
  shortcutsHelp.hidden = !manageShortcuts;
  hiddenShortcuts.hidden = !manageShortcuts || hiddenShortcutCount === 0;
}

async function saveShortcutPreference(groupId, preference) {
  const nextPreferences = {
    ...shortcutPreferences,
    [groupId]: {
      order: preference.order,
      hidden: preference.hidden
    }
  };
  try {
    await browser.storage.local.set({ shortcutPreferences: nextPreferences });
    shortcutPreferences = nextPreferences;
    renderBookmarks(bookmarkGroups);
  } catch (error) {
    bookmarkStatus.textContent = `Could not save shortcut layout: ${error.message}`;
  }
}

function setShortcutHidden(groupId, bookmarkId, hidden) {
  const group = bookmarkGroups.find((item) => item.id === groupId);
  if (!group) {
    return;
  }
  const preference = getShortcutPreference(group);
  preference.hidden = hidden
    ? [...new Set([...preference.hidden, bookmarkId])]
    : preference.hidden.filter((id) => id !== bookmarkId);
  saveShortcutPreference(groupId, preference);
}

function getBookmarkOrigins(items) {
  return [...new Set(items
    .map((item) => getHistoryUrl(item.url))
    .filter(Boolean)
    .map((url) => url.origin))];
}

function getDisplayedBookmarkOrigins() {
  const origins = new Set(getBookmarkOrigins(bookmarkGroups.flatMap((group) => group.items)));
  for (const item of historyItems) {
    const hostname = getBookmarkedSiteHostname(item.url);
    const site = hostname ? bookmarkedSites.get(hostname) : null;
    for (const origin of site?.origins ?? []) {
      origins.add(origin);
    }
  }
  return [...origins];
}

async function findBookmarkFaviconUrl(origin) {
  try {
    const { bytes, responseUrl } = await fetchPreviewResponse(
      new URL("/", origin).href,
      MAX_HTML_BYTES,
      "text/html"
    );
    const document = new DOMParser().parseFromString(new TextDecoder().decode(bytes), "text/html");
    const siteOrigin = new URL(origin).origin;
    for (const link of document.querySelectorAll('link[rel~="icon"], link[rel~="shortcut"]')) {
      const href = link.getAttribute("href")?.trim();
      if (!href) {
        continue;
      }
      try {
        const iconUrl = new URL(href, responseUrl || origin);
        if ((iconUrl.protocol === "http:" || iconUrl.protocol === "https:") &&
            iconUrl.origin === siteOrigin) {
          return iconUrl.href;
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Some sites block their homepage while still exposing /favicon.ico.
  }
  return new URL("/favicon.ico", origin).href;
}

async function makeFaviconDataUrl(bytes, contentType) {
  const bitmap = await createImageBitmap(new Blob([bytes], { type: contentType }));
  try {
    if (bitmap.width > 4096 || bitmap.height > 4096) {
      throw new Error("The site icon is too large to resize safely.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare the site icon.");
    }
    const scale = Math.min(48 / bitmap.width, 48 / bitmap.height, 1);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    context.drawImage(bitmap, (64 - width) / 2, (64 - height) / 2, width, height);
    const dataUrl = canvas.toDataURL("image/png");
    if (dataUrl.length > 30_000) {
      throw new Error("The resized site icon is too large to save locally.");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

async function loadBookmarkFavicons() {
  const sourceOrigins = getDisplayedBookmarkOrigins();
  const origins = sourceOrigins.filter((origin) => !faviconCache[origin]);
  if (origins.length === 0 || bookmarkIconsLoading) {
    return;
  }
  bookmarkIconsLoading = true;
  renderBookmarks(bookmarkGroups);
  try {
    const permittedOrigins = [];
    let originsWithoutPermission = 0;
    for (const origin of origins) {
      if (await hasOriginPermission(origin)) {
        permittedOrigins.push(origin);
      } else {
        originsWithoutPermission += 1;
      }
    }

    const uncachedOrigins = permittedOrigins.filter((origin) => !faviconCache[origin]);
    let failedCount = 0;
    await forEachWithConcurrency(uncachedOrigins, 3, async (origin) => {
      try {
        const iconUrl = await findBookmarkFaviconUrl(origin);
        const { bytes, contentType } = await fetchPreviewResponse(
          iconUrl,
          MAX_FAVICON_BYTES,
          "image/"
        );
        faviconCache[origin] = await makeFaviconDataUrl(bytes, contentType);
      } catch {
        failedCount += 1;
      }
    });

    const cachedOrigins = Object.keys(faviconCache);
    if (cachedOrigins.length > MAX_FAVICON_CACHE) {
      for (const staleOrigin of cachedOrigins.slice(0, cachedOrigins.length - MAX_FAVICON_CACHE)) {
        delete faviconCache[staleOrigin];
      }
    }
    const loadedCount = uncachedOrigins.length - failedCount;
    if (loadedCount > 0) {
      try {
        await browser.storage.local.set({ faviconCache });
      } catch (error) {
        bookmarkStatus.textContent = `Site icons are showing, but could not be saved locally: ${error.message}`;
      }
    }
    renderBookmarks(bookmarkGroups);
    if (originsWithoutPermission > 0) {
      bookmarkStatus.textContent = `${originsWithoutPermission} site${originsWithoutPermission === 1 ? "" : "s"} need access. Select Allow all sites to load their icons automatically.`;
    } else if (failedCount > 0) {
      bookmarkStatus.textContent = `${failedCount} site icon${failedCount === 1 ? "" : "s"} could not be loaded; those favorites keep their initials.`;
    } else if (loadedCount > 0) {
      bookmarkStatus.textContent = "";
    }
  } finally {
    bookmarkIconsLoading = false;
    renderBookmarks(bookmarkGroups);
    renderFavoriteHistory(historyItems);
  }
}

function getHistoryUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isSafeVideoSourceUrl(value) {
  const url = getHistoryUrl(value);
  return Boolean(url && !url.username && !url.password && url.href.length <= 4096);
}

function getHistorySnapshotKey() {
  return JSON.stringify([
    selectedBookmarkFolderId,
    [...bookmarkedSites.keys()].sort()
  ]);
}

function isValidPreviewMetadata(url, entry, now = Date.now()) {
  return Boolean(
    getHistoryUrl(url) &&
    entry &&
    typeof entry.videoPage === "boolean" &&
    (entry.videoPage !== false ||
      entry.classificationVersion === PREVIEW_CLASSIFICATION_VERSION) &&
    Number.isFinite(entry.checkedAt) &&
    entry.checkedAt <= now &&
    now - entry.checkedAt < PREVIEW_METADATA_TTL_MS &&
    (entry.imageUrl === null ||
      (typeof entry.imageUrl === "string" &&
        entry.imageUrl.length <= 4096 &&
        getHistoryUrl(entry.imageUrl))) &&
    (entry.videoUrl === undefined ||
      entry.videoUrl === null ||
      (typeof entry.videoUrl === "string" &&
        isSafeVideoSourceUrl(entry.videoUrl))) &&
    (entry.videoCheckedAt === undefined ||
      (Number.isFinite(entry.videoCheckedAt) &&
        entry.videoCheckedAt <= now))
  );
}

function getFreshPreviewMetadata(url) {
  const entry = previewMetadataCache[url];
  return isValidPreviewMetadata(url, entry) ? entry : null;
}

function trimPreviewMetadataCache() {
  const now = Date.now();
  const entries = Object.entries(previewMetadataCache)
    .filter(([url, entry]) => isValidPreviewMetadata(url, entry, now))
    .sort(([, first], [, second]) => second.checkedAt - first.checkedAt)
    .slice(0, MAX_PREVIEW_METADATA);
  previewMetadataCache = Object.fromEntries(entries);
}

async function savePreviewMetadataCache() {
  trimPreviewMetadataCache();
  await browser.storage.local.set({ previewMetadataCache });
}

function getOriginPattern(value) {
  const url = getHistoryUrl(value);
  if (!url) {
    throw new Error("Only website pages can have previews.");
  }
  return `${url.protocol}//${url.hostname}/*`;
}

async function hasOriginPermission(value) {
  if (allSitesPermissionGranted) {
    return true;
  }
  return browser.permissions.contains({
    origins: [getOriginPattern(value)]
  });
}

async function updateAutomaticPreviewsButton() {
  randomVideoPermittedUrls.clear();
  randomVideoSourceAttempts.clear();
  favoriteSitePreviewAttempts.clear();
  allSitesPermissionGranted = await browser.permissions.contains({
    origins: ["<all_urls>"]
  });
  enableAutomaticPreviewsButton.hidden = allSitesPermissionGranted;
  enableAutomaticPreviewsButton.disabled = allSitesPermissionGranted;
  updateRandomVideoPlayback();
  void scanFavoriteSitePreviews();
}

function refreshAutomaticPreviewsButton() {
  updateAutomaticPreviewsButton().catch((error) => {
    historyStatus.textContent = `Could not check all-sites access: ${error.message}`;
  });
}

function createHistoryCard(item) {
  const url = getHistoryUrl(item.url);
  if (!url) {
    return null;
  }

  const card = document.createElement("a");
  card.className = "history-card";
  card.hidden = true;
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.setAttribute("aria-label", `Open ${item.title?.trim() || url.hostname}`);
  const imageFrame = document.createElement("div");
  imageFrame.className = "history-image";
  setHistoryPlaceholder(
    imageFrame,
    hasActiveHistoryFilters() || isVideoOnlyFilterEnabled() ? "Preview not loaded" : "Your next favorite"
  );

  const content = document.createElement("div");
  content.className = "history-content";
  const title = document.createElement("span");
  title.className = "history-title";
  title.textContent = item.title?.trim() || url.hostname;

  const details = document.createElement("p");
  details.className = "history-details";
  const lastVisit = Number.isFinite(item.lastVisitTime)
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(item.lastVisitTime)
    : "";
  details.textContent = lastVisit ? `${url.hostname} · ${lastVisit}` : url.hostname;

  const status = document.createElement("p");
  status.className = "preview-status";
  status.setAttribute("role", "status");

  const cached = previewCache[item.url];
  const cachedMetadata = getFreshPreviewMetadata(item.url);
  if (cachedMetadata) {
    item.videoPage = cachedMetadata.videoPage;
  } else if (typeof item.videoPage !== "boolean" && cached?.videoPage === true) {
    item.videoPage = true;
  }
  const cardState = {
    item,
    element: card,
    imageFrame,
    status,
    imageUrl: cachedMetadata?.imageUrl ?? null,
    metadataCheckedAt: cachedMetadata?.checkedAt ?? 0,
    videoUrl: isFreshVideoSourceCheck(cachedMetadata) ? cachedMetadata.videoUrl : null,
    posterVersion: 0,
    videoPage: typeof item.videoPage === "boolean" ? item.videoPage : null
  };
  historyCards.push(cardState);
  if (cached?.videoPage === true && cached.dataUrl) {
    cardState.posterVersion = cached.posterVersion === POSTER_QUALITY_VERSION ? POSTER_QUALITY_VERSION : 1;
    showThumbnail(cardState, cached.dataUrl, `Saved poster from ${cached.imageHost}.`);
  }
  content.append(title, details, status);
  card.append(imageFrame, content);
  return card;
}

function setHistoryPlaceholder(imageFrame, message = "Your next favorite") {
  const placeholder = document.createElement("span");
  placeholder.className = "history-placeholder";
  placeholder.textContent = message;
  imageFrame.replaceChildren(placeholder);
}

function hasActiveHistoryFilters() {
  return Boolean(
    historySearchInput.value.trim() ||
    historySiteFilter.value ||
    historyDateFilter.value
  );
}

function isVideoOnlyFilterEnabled() {
  return historyVideoOnlyFilter.checked;
}

function getFilteredHistoryItems(items = historyItems) {
  const query = historySearchInput.value.trim().toLowerCase();
  const selectedSite = historySiteFilter.value;
  const dateFilter = historyDateFilter.value;
  const now = Date.now();
  const dateLimits = {
    "24h": now - 24 * 60 * 60 * 1000,
    "7d": now - 7 * 24 * 60 * 60 * 1000,
    "30d": now - 30 * 24 * 60 * 60 * 1000
  };
  const cutoff = dateLimits[dateFilter] ?? null;

  return items.filter((item) => {
    const url = getHistoryUrl(item.url);
    if (!url || (selectedSite && url.hostname !== selectedSite)) {
      return false;
    }
    if (query && !`${item.title ?? ""} ${item.url} ${url.hostname}`.toLowerCase().includes(query)) {
      return false;
    }
    return cutoff === null ||
      (Number.isFinite(item.lastVisitTime) && item.lastVisitTime >= cutoff);
  });
}

function updateHistoryFilterOptions() {
  const selectedSite = historySiteFilter.value;
  const sites = [...new Set(historyItems
    .map((item) => getHistoryUrl(item.url)?.hostname)
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const allSitesOption = document.createElement("option");
  allSitesOption.value = "";
  allSitesOption.textContent = "All bookmarked sites";
  historySiteFilter.replaceChildren(allSitesOption);
  for (const site of sites) {
    const option = document.createElement("option");
    option.value = site;
    option.textContent = site;
    historySiteFilter.append(option);
  }
  if (sites.includes(selectedSite)) {
    historySiteFilter.value = selectedSite;
  }
}

function updateHistoryFilterStatus(items = getFilteredHistoryItems()) {
  const videosOnly = isVideoOnlyFilterEnabled();
  const includeNoPreviewVideos = historyIncludeNoPreviewFilter.checked;
  if (!hasActiveHistoryFilters() && !videosOnly && !includeNoPreviewVideos) {
    historyFilterStatus.textContent = "";
    return;
  }
  const verifiedVideos = videosOnly
    ? items.filter((item) => item.videoPage === true).length
    : items.length;
  const countLabel = videosOnly
    ? `${verifiedVideos} verified video page${verifiedVideos === 1 ? "" : "s"} in loaded history.`
    : `${items.length} matching page${items.length === 1 ? "" : "s"} in loaded history.`;
  const hasMoreToCheck = historyVisibleCount < items.length || historyHasMoreResults;
  const hasUnclassifiedItems = videosOnly &&
    items.some((item) => typeof item.videoPage !== "boolean");
  historyFilterStatus.textContent = hasMoreToCheck
    ? `${countLabel} Select View more to check further history.`
    : hasUnclassifiedItems
      ? `${countLabel} Select Load previews to check remaining pages.`
      : countLabel;
}

function updateHistoryFilterControls() {
  const disabled = historyFilterControlsBusy || historyFillInProgress || historyInitialBatchLoading;
  historySearchInput.disabled = disabled;
  clearHistorySearchButton.disabled = disabled;
  clearHistorySearchButton.hidden = !historySearchInput.value;
  historySiteFilter.disabled = disabled;
  historyDateFilter.disabled = disabled;
  historyVideoOnlyFilter.disabled = disabled;
  historyIncludeNoPreviewFilter.disabled = disabled;
  resetHistoryFiltersButton.disabled = disabled ||
    (!hasActiveHistoryFilters() &&
      isVideoOnlyFilterEnabled() &&
      !historyIncludeNoPreviewFilter.checked);
}

function renderFilteredHistory() {
  historyGrid.replaceChildren();
  historyCards = [];
  historyVisibleCount = 0;
  historyDisplayLimit = getHistoryBatchSize();
  previewPhase = "pages";
  updateHistoryFilterStatus();
  appendNextHistoryBatch();
  renderFavoriteHistory(historyItems);
}

function applyHistoryFilters() {
  if (historyFilterControlsBusy || historyFillInProgress || historyInitialBatchLoading) {
    return;
  }
  renderFilteredHistory();
}

async function loadFilteredHistoryPreviews() {
  if (historyFilterControlsBusy || historyFillInProgress || historyInitialBatchLoading) {
    return;
  }
  const cardsToLoad = historyCards.filter((card) =>
    card.videoPage !== false &&
    (card.posterVersion < POSTER_QUALITY_VERSION || !card.imageFrame.querySelector("img"))
  );
  const wasVisibilityDeferred = historyVisibilityDeferred;
  historyVisibilityDeferred = true;
  historyFilterControlsBusy = true;
  updateHistoryFilterControls();
  try {
    if (cardsToLoad.length > 0) {
      const previewsLoaded = await loadPagePreviews(cardsToLoad);
      if (!previewsLoaded) {
        return;
      }
    }
    await fillHistoryBatch(historyDisplayLimit);
  } catch (error) {
    historyStatus.textContent = `Could not load filtered previews: ${error.message}`;
  } finally {
    historyVisibilityDeferred = wasVisibilityDeferred;
    historyFilterControlsBusy = false;
    updateHistoryFilterControls();
    if (!historyVisibilityDeferred) {
      updateVisibleHistory();
    }
    updateHistoryFilterStatus();
    updatePreviewLoadButton();
  }
}

function scheduleHistoryFilterApply() {
  clearTimeout(historyFilterDebounceTimer);
  updateHistoryFilterControls();
  historyFilterDebounceTimer = setTimeout(() => {
    if (historyFilterControlsBusy || historyFillInProgress || historyInitialBatchLoading) {
      scheduleHistoryFilterApply();
      return;
    }
    applyHistoryFilters();
    if (hasActiveHistoryFilters() ||
        isVideoOnlyFilterEnabled() ||
        historyIncludeNoPreviewFilter.checked) {
      loadFilteredHistoryPreviews();
    }
  }, HISTORY_FILTER_DEBOUNCE_MS);
}

function getHistoryColumnCount() {
  const columns = getComputedStyle(historyGrid).gridTemplateColumns
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
  return columns || 4;
}

function getHistoryBatchSize() {
  const columns = getHistoryColumnCount();
  return columns === 2 || columns === 5 ? 12 : 13;
}

function getMoreHistoryBatchSize() {
  return getHistoryColumnCount() * 2;
}

function updatePreviewLoadButton() {
  const hasUncachedPages = historyCards.some((card) =>
    needsPagePreviewCheck(card) || needsThumbnailLoad(card)
  );
  const hasCheckedPageWithoutPreview = historyCards.some((card) =>
    getFreshPreviewMetadata(card.item.url) && !card.imageUrl && !card.imageFrame.querySelector("img")
  );
  loadPreviewsButton.disabled = !hasUncachedPages;
  loadPreviewsButton.textContent = hasUncachedPages
    ? "Load previews"
    : hasCheckedPageWithoutPreview
      ? "Previews checked"
      : historyCards.length > 0 ? "Posters saved" : "No recent pages";
}

function appendNextHistoryBatch(batchSize = getHistoryBatchSize()) {
  const filteredItems = getFilteredHistoryItems();
  const nextCount = Math.min(batchSize, filteredItems.length - historyVisibleCount);
  const nextItems = filteredItems.slice(historyVisibleCount, historyVisibleCount + nextCount);
  const firstNewCard = historyCards.length;
  historyVisibleCount += nextItems.length;
  previewPhase = "pages";
  for (const item of nextItems) {
    const card = createHistoryCard(item);
    if (card) {
      historyGrid.append(card);
    }
  }
  updateVisibleHistory();
  updateLoadMoreHistoryButton();
  updatePreviewLoadButton();
  return historyCards.slice(firstNewCard);
}

function getAvailableHistoryCount() {
  return historyCards.filter((card) => {
    const hasPoster = Boolean(card.imageFrame.querySelector("img"));
    return hasPoster ||
      (card.videoPage === true && historyIncludeNoPreviewFilter.checked);
  }).length;
}

function updateLoadMoreHistoryButton() {
  const hasMoreVisibleHistory = hasActiveHistoryFilters() || isVideoOnlyFilterEnabled()
    ? historyVisibleCount > historyDisplayLimit
    : getAvailableHistoryCount() > historyDisplayLimit;
  const hasMoreHistory = historyVisibleCount < getFilteredHistoryItems().length ||
    hasMoreVisibleHistory ||
    historyHasMoreResults;
  const canShowLess = historyDisplayLimit > getHistoryBatchSize();
  showLessHistoryButton.hidden = !canShowLess;
  showLessHistoryButton.disabled = historyFillInProgress || !canShowLess;
  loadMoreHistoryButton.hidden = !hasMoreHistory;
  loadMoreHistoryButton.disabled = historyFillInProgress || !hasMoreHistory;
  updateHistoryFilterControls();
}

async function fillHistoryBatch(targetVisibleCount, includeExisting = false) {
  if (historyFillInProgress) {
    return;
  }
  const wasVisibilityDeferred = historyVisibilityDeferred;
  historyVisibilityDeferred = true;
  historyFillInProgress = true;
  loadMoreHistoryButton.disabled = true;
  updateRandomVideoNavigation();
  updateHistoryFilterControls();
  let cardsToCheck = includeExisting ? historyCards : [];
  const scanLimit = historyVisibleCount + MAX_HISTORY_SCAN_ITEMS;
  let olderPagesLoaded = 0;
  try {
    if (hasActiveHistoryFilters() && !isVideoOnlyFilterEnabled()) {
      while (historyVisibleCount < targetVisibleCount) {
        const filteredItems = getFilteredHistoryItems();
        if (historyVisibleCount >= filteredItems.length) {
          if (!historyHasMoreResults || olderPagesLoaded >= MAX_HISTORY_PAGES_PER_FILL) {
            break;
          }
          const loadedPage = await loadOlderHistoryPage();
          olderPagesLoaded += 1;
          if (!loadedPage || loadedPage.items.length === 0) {
            break;
          }
          continue;
        }
        const nextCards = appendNextHistoryBatch(
          Math.min(targetVisibleCount - historyVisibleCount, filteredItems.length - historyVisibleCount)
        );
        if (nextCards.length > 0) {
          await loadPagePreviews(nextCards);
        }
      }
      return;
    }
    let keepScanning = true;
    if (cardsToCheck.some((card) =>
      card.posterVersion < POSTER_QUALITY_VERSION || !card.imageFrame.querySelector("img")
    )) {
      keepScanning = await loadPagePreviews(cardsToCheck);
      cardsToCheck = [];
    }
    while (keepScanning &&
        getAvailableHistoryCount() < targetVisibleCount &&
        historyVisibleCount < scanLimit) {
      if (historyVisibleCount >= getFilteredHistoryItems().length) {
        if (!historyHasMoreResults || olderPagesLoaded >= MAX_HISTORY_PAGES_PER_FILL) {
          break;
        }
        const loadedPage = await loadOlderHistoryPage();
        olderPagesLoaded += 1;
        if (!loadedPage || loadedPage.items.length === 0) {
          break;
        }
        if (historyVisibleCount >= getFilteredHistoryItems().length) {
          continue;
        }
      }
      if (cardsToCheck.some((card) =>
        card.posterVersion < POSTER_QUALITY_VERSION || !card.imageFrame.querySelector("img")
      )) {
        keepScanning = await loadPagePreviews(cardsToCheck);
      }
      if (getAvailableHistoryCount() >= targetVisibleCount ||
          historyVisibleCount >= getFilteredHistoryItems().length) {
        break;
      }
      if (!keepScanning) {
        break;
      }
      cardsToCheck = appendNextHistoryBatch(
        Math.min(getHistoryBatchSize(), scanLimit - historyVisibleCount)
      );
    }
    if (keepScanning && cardsToCheck.some((card) =>
      card.posterVersion < POSTER_QUALITY_VERSION || !card.imageFrame.querySelector("img")
    )) {
      keepScanning = await loadPagePreviews(cardsToCheck);
    }
    if (getAvailableHistoryCount() < targetVisibleCount && keepScanning) {
      const visibleCount = getAvailableHistoryCount();
      const moreHistoryAvailable = historyVisibleCount < getFilteredHistoryItems().length ||
        historyHasMoreResults;
      if (visibleCount > 0) {
        if (!historyInfoStatus.textContent) {
          const resultLabel = isVideoOnlyFilterEnabled()
            ? `Found ${visibleCount} video page${visibleCount === 1 ? "" : "s"}`
            : `Found ${visibleCount} usable video preview${visibleCount === 1 ? "" : "s"}`;
          historyInfoStatus.textContent = `${resultLabel}${moreHistoryAvailable ? ". Select View more to check further history." : " in your available history."}`;
        }
      } else {
        historyStatus.textContent = moreHistoryAvailable
          ? "No usable video previews found yet. Select View more to check further history."
          : "";
      }
    }
  } finally {
    historyFillInProgress = false;
    historyVisibilityDeferred = wasVisibilityDeferred;
    if (!historyVisibilityDeferred) {
      updateVisibleHistory();
    }
    updateLoadMoreHistoryButton();
    renderFavoriteSiteVideos();
    renderRandomVideoSection();
  }
}

function renderHistory(items) {
  historyItems = items;
  updateHistoryFilterOptions();
  renderFilteredHistory();
  renderFavoriteSiteVideos();
  renderRandomVideoSection();
}

function getAutomaticVideoItems(items = historyItems) {
  return items.filter((item) => {
    const savedPoster = previewCache[item.url];
    const isVideoPage = getFreshPreviewMetadata(item.url)?.videoPage === true ||
      savedPoster?.videoPage === true;
    return isVideoPage &&
      typeof savedPoster?.dataUrl === "string" &&
      Number.isFinite(item.lastVisitTime);
  });
}

function trimPreviewCache(cache, items = historyItems, prioritizedUrls = []) {
  const lastVisits = new Map(items.map((item) => [item.url, item.lastVisitTime ?? 0]));
  const entries = Object.entries(cache)
    .map((entry) => ({
      entry,
      hostname: getBookmarkedSiteHostname(entry[0]) ||
        getBookmarkedSiteHostnameFrom(entry[0], favoriteBookmarkedSites) ||
        getHistoryUrl(entry[0])?.hostname,
      lastVisitTime: Number.isFinite(lastVisits.get(entry[0]))
        ? lastVisits.get(entry[0])
        : null
    }))
    .sort((first, second) =>
      (second.lastVisitTime ?? 0) - (first.lastVisitTime ?? 0)
    );
  if (entries.length <= MAX_SAVED_POSTERS) {
    return cache;
  }
  const selected = [];
  const selectedUrls = new Set();
  const selectedSites = new Set();
  const datedEntries = entries.filter((item) => item.lastVisitTime !== null);
  const selectionPool = datedEntries.length > 0 ? datedEntries : entries;
  const oldestVisit = Math.min(...selectionPool.map((item) => item.lastVisitTime ?? 0));
  const newestVisit = Math.max(...selectionPool.map((item) => item.lastVisitTime ?? 0));
  const visitRange = Math.max(1, newestVisit - oldestVisit + 1);
  const timeBuckets = Array.from({ length: MAX_SAVED_POSTERS }, () => []);
  for (const item of selectionPool) {
    const bucketIndex = Math.min(
      MAX_SAVED_POSTERS - 1,
      Math.floor(((item.lastVisitTime ?? 0) - oldestVisit) / visitRange * MAX_SAVED_POSTERS)
    );
    timeBuckets[bucketIndex].push(item);
  }
  const selectEntry = (item) => {
    selected.push(item.entry);
    selectedUrls.add(item.entry[0]);
    if (item.hostname) {
      selectedSites.add(item.hostname);
    }
  };
  const prioritySet = new Set(prioritizedUrls);
  for (const item of entries.filter((entry) => prioritySet.has(entry.entry[0]))) {
    if (selected.length >= MAX_SAVED_POSTERS) {
      break;
    }
    selectEntry(item);
  }
  for (const bucket of timeBuckets) {
    if (bucket.length === 0 || selected.length >= MAX_SAVED_POSTERS) {
      continue;
    }
    const remaining = bucket.filter((item) => !selectedUrls.has(item.entry[0]));
    if (remaining.length === 0) {
      continue;
    }
    const unusedSites = remaining.filter((item) =>
      item.hostname && !selectedSites.has(item.hostname)
    );
    const pool = unusedSites.length > 0 ? unusedSites : remaining;
    selectEntry(pool[Math.floor(Math.random() * pool.length)]);
  }
  while (selected.length < MAX_SAVED_POSTERS) {
    let remaining = selectionPool.filter((item) => !selectedUrls.has(item.entry[0]));
    if (remaining.length === 0 && selectionPool !== entries) {
      remaining = entries.filter((item) => !selectedUrls.has(item.entry[0]));
    }
    if (remaining.length === 0) {
      break;
    }
    const unusedSites = remaining.filter((item) =>
      item.hostname && !selectedSites.has(item.hostname)
    );
    const pool = unusedSites.length > 0 ? unusedSites : remaining;
    selectEntry(pool[Math.floor(Math.random() * pool.length)]);
  }
  return Object.fromEntries(selected);
}

function createAutomaticHistoryCard(item) {
  const url = getHistoryUrl(item.url);
  const savedPoster = previewCache[item.url];
  if (!url || typeof savedPoster?.dataUrl !== "string") {
    return null;
  }

  const card = document.createElement("a");
  card.className = "history-card automatic-history-card";
  card.href = url.href;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  const titleText = item.title?.trim() || url.hostname;
  const lastVisited = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(item.lastVisitTime);
  card.setAttribute("aria-label", `Open ${titleText}; last visited ${lastVisited}`);

  const imageFrame = document.createElement("div");
  imageFrame.className = "history-image";
  const image = document.createElement("img");
  image.className = "history-thumbnail";
  image.alt = "";
  image.src = savedPoster.dataUrl;
  imageFrame.append(image);

  const content = document.createElement("div");
  content.className = "history-content";
  const title = document.createElement("span");
  title.className = "history-title";
  title.textContent = titleText;
  const details = document.createElement("p");
  details.className = "history-details";
  details.textContent = `${url.hostname} · ${lastVisited}`;
  content.append(title, details);
  card.append(imageFrame, content);
  return card;
}

function renderFavoriteSiteVideos() {
  const currentRowAnchor = favoriteSiteRows[favoriteSiteRowIndex]?.items[0]?.url;
  const sitesInScope = getFavoriteBookmarkedSitesInScope();
  const groupedItems = new Map(
    [...sitesInScope.keys()].map((hostname) => [hostname, []])
  );
  const siteLastVisits = new Map();
  for (const item of favoriteSiteHistoryItems) {
    const hostname = getBookmarkedSiteHostnameFrom(item.url, sitesInScope);
    if (hostname && Number.isFinite(item.lastVisitTime)) {
      siteLastVisits.set(
        hostname,
        Math.max(siteLastVisits.get(hostname) ?? 0, item.lastVisitTime)
      );
    }
  }
  for (const item of getAutomaticVideoItems(favoriteSiteHistoryItems)) {
    const hostname = getBookmarkedSiteHostnameFrom(item.url, sitesInScope);
    if (hostname && groupedItems.has(hostname)) {
      groupedItems.get(hostname).push(item);
    }
  }

  const sortedGroups = [...groupedItems].sort((first, second) => {
    const firstHasPreviews = first[1].length > 0;
    const secondHasPreviews = second[1].length > 0;
    if (firstHasPreviews !== secondHasPreviews) {
      return Number(secondHasPreviews) - Number(firstHasPreviews);
    }
    const firstLatestVisit = Math.max(
      siteLastVisits.get(first[0]) ?? 0,
      ...first[1].map((item) => item.lastVisitTime)
    );
    const secondLatestVisit = Math.max(
      siteLastVisits.get(second[0]) ?? 0,
      ...second[1].map((item) => item.lastVisitTime)
    );
    return secondLatestVisit - firstLatestVisit ||
      (favoriteBookmarkedSites.get(first[0])?.name ?? first[0]).localeCompare(
        favoriteBookmarkedSites.get(second[0])?.name ?? second[0]
      );
  });
  const rows = [];
  for (const [hostname, items] of sortedGroups) {
    items.sort((first, second) => second.lastVisitTime - first.lastVisitTime);
    if (items.length === 0) {
      rows.push({ hostname, items: [] });
      continue;
    }
    for (let index = 0; index < items.length; index += MAX_FAVORITE_SITE_CARDS) {
      rows.push({
        hostname,
        items: items.slice(index, index + MAX_FAVORITE_SITE_CARDS)
      });
    }
  }
  favoriteSiteRows = rows;
  if (currentRowAnchor) {
    const anchoredRowIndex = rows.findIndex((row) =>
      row.items.some((item) => item.url === currentRowAnchor)
    );
    if (anchoredRowIndex >= 0) {
      favoriteSiteRowIndex = anchoredRowIndex;
    }
  }
  favoriteSiteRowIndex = Math.min(favoriteSiteRowIndex, Math.max(rows.length - 1, 0));
  const rowControlsDisabled = favoriteSiteRowLoadInProgress ||
    historyFillInProgress ||
    favoriteSitePreviewScanInProgress ||
    favoriteSiteRowTransitionTimer !== null;
  favoriteSitePreviousRowButton.disabled = rowControlsDisabled;
  favoriteSiteNextRowButton.disabled = rowControlsDisabled;
  favoriteSitePreviousRowButton.hidden = favoriteSiteRowIndex === 0;
  favoriteSiteNextRowButton.hidden = !favoriteSiteHistoryReady ||
    sitesInScope.size === 0 ||
    (favoriteSiteRowIndex >= rows.length - 1 &&
      !historyHasMoreResults &&
      !hasUnscannedFavoriteSitePreviews());
  favoriteSiteVideos.replaceChildren();
  if (sitesInScope.size === 0 && bookmarkFolders.length > 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "favorite-site-video-empty";
    emptyState.textContent = "No bookmarked websites found.";
    favoriteSiteVideos.append(emptyState);
  } else if (rows.length > 0) {
    const { hostname, items } = rows[favoriteSiteRowIndex];
    const siteGroup = document.createElement("section");
    siteGroup.className = "favorite-site-video-group";
    const heading = document.createElement("h4");
    heading.className = "favorite-site-video-heading";
    heading.textContent = favoriteBookmarkedSites.get(hostname)?.name || hostname;
    siteGroup.append(heading);
    if (items.length > 0) {
      const grid = document.createElement("div");
      grid.className = "history-grid favorite-site-video-grid";
      for (const item of items) {
        const card = createAutomaticHistoryCard(item);
        if (card) {
          grid.append(card);
        }
      }
      siteGroup.append(grid);
    } else {
      const emptyState = document.createElement("p");
      emptyState.className = "favorite-site-video-empty";
      emptyState.textContent = "No saved video previews yet.";
      siteGroup.append(emptyState);
    }
    favoriteSiteVideos.append(siteGroup);
  } else if (sitesInScope.size > 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "favorite-site-video-empty";
    emptyState.textContent = "No bookmarked sites match the current selection.";
    favoriteSiteVideos.append(emptyState);
  }
    updateAutomaticSectionVisibility();
  if (!favoriteSiteVideosSection.hidden) {
    observeFavoriteSiteVideoSection();
    if (favoriteSiteVideosAreVisible) {
      void scanFavoriteSitePreviews();
    }
  }
}

function hasUnscannedFavoriteSitePreviews() {
  const sitesInScope = getFavoriteBookmarkedSitesInScope();
  return favoriteSiteHistoryItems.some((item) =>
    getBookmarkedSiteHostnameFrom(item.url, sitesInScope) &&
    item.favoriteSitePreviewChecked !== true &&
    !favoriteSitePreviewAttempts.has(item.url) &&
    !previewCache[item.url]?.dataUrl &&
    getFreshPreviewMetadata(item.url)?.videoPage !== false
  );
}

function animateAutomaticHistorySection(section, onComplete) {
  section.classList.add("is-revealing");
  window.setTimeout(() => {
    section.classList.remove("is-revealing");
    if (onComplete) {
      onComplete();
    }
  }, AUTOMATIC_SECTION_REVEAL_MS);
}

function cancelFavoriteSiteRowTransition() {
  clearTimeout(favoriteSiteRowTransitionTimer);
  favoriteSiteRowTransitionTimer = null;
  favoriteSiteVideos.classList.remove("is-transitioning");
  favoriteSitePreviousRowButton.disabled = false;
  favoriteSiteNextRowButton.disabled = false;
}

function transitionFavoriteSiteRow(direction) {
  if (favoriteSiteRowTransitionTimer !== null) {
    return;
  }
  favoriteSitePreviousRowButton.disabled = true;
  favoriteSiteNextRowButton.disabled = true;
  favoriteSiteVideos.classList.add("is-transitioning");
  favoriteSiteRowTransitionTimer = setTimeout(() => {
    favoriteSiteRowTransitionTimer = null;
    favoriteSiteRowIndex += direction;
    renderFavoriteSiteVideos();
    window.requestAnimationFrame(() => {
      favoriteSiteVideos.classList.remove("is-transitioning");
    });
  }, 850);
}

async function navigateFavoriteSiteRow(direction) {
  const button = direction < 0
    ? favoriteSitePreviousRowButton
    : favoriteSiteNextRowButton;
  if (button.hidden || button.disabled || favoriteSiteRowTransitionTimer !== null) {
    return;
  }
  if (direction < 0 || favoriteSiteRowIndex < favoriteSiteRows.length - 1) {
    transitionFavoriteSiteRow(direction);
    return;
  }
  if (favoriteSiteRowLoadInProgress ||
      (!historyHasMoreResults && !hasUnscannedFavoriteSitePreviews())) {
    return;
  }

  favoriteSiteRowLoadInProgress = true;
  const searchStatusMessage = "Searching older history for previews…";
  favoriteSiteStatus.textContent = "";
  const searchStatusTimer = window.setTimeout(() => {
    if (favoriteSiteRowLoadInProgress && !favoriteSiteStatus.textContent) {
      favoriteSiteStatus.textContent = searchStatusMessage;
    }
  }, FAVORITE_SITE_SEARCH_STATUS_DELAY_MS);
  try {
    renderFavoriteSiteVideos();
    let checkedCandidates = 0;
    let olderPagesLoaded = 0;
    while (checkedCandidates < MAX_FAVORITE_SITE_PREVIEW_CHECKS_PER_NEXT) {
      const checkedCount = await scanFavoriteSitePreviews({
        candidateItems: favoriteSiteHistoryItems,
        maxCandidates: MAX_FAVORITE_SITE_PREVIEW_CHECKS_PER_NEXT - checkedCandidates,
        onDemand: true
      });
      checkedCandidates += checkedCount;
      const nextRow = favoriteSiteRows[favoriteSiteRowIndex + 1];
      if (nextRow?.items.length >= MAX_FAVORITE_SITE_CARDS ||
          checkedCandidates >= MAX_FAVORITE_SITE_PREVIEW_CHECKS_PER_NEXT) {
        break;
      }
      if (checkedCount > 0) {
        continue;
      }
      if (!historyHasMoreResults || olderPagesLoaded >= MAX_HISTORY_PAGES_PER_FILL) {
        break;
      }
      const olderPage = await loadOlderHistoryPage();
      if (!olderPage) {
        break;
      }
      olderPagesLoaded += 1;
    }
    if (favoriteSiteRowIndex < favoriteSiteRows.length - 1) {
      favoriteSiteStatus.textContent = "";
      transitionFavoriteSiteRow(1);
    } else {
      favoriteSiteStatus.textContent = historyHasMoreResults ||
          hasUnscannedFavoriteSitePreviews()
        ? "No new previews found yet. Select Next to keep searching."
        : "No more saved previews are available in your history.";
    }
  } catch (error) {
    favoriteSiteStatus.textContent = `Could not load older favorite-site previews: ${error.message}`;
  } finally {
    window.clearTimeout(searchStatusTimer);
    if (favoriteSiteStatus.textContent === searchStatusMessage) {
      favoriteSiteStatus.textContent = "";
    }
    favoriteSiteRowLoadInProgress = false;
    renderFavoriteSiteVideos();
  }
}

function observeFavoriteSiteVideoSection() {
  if ("IntersectionObserver" in window) {
    if (!favoriteSiteVideoObserver) {
      favoriteSiteVideoObserver = new IntersectionObserver((entries) => {
        favoriteSiteVideosAreVisible = entries.some((entry) =>
          entry.target === favoriteSiteVideosSection && entry.isIntersecting
        );
        if (favoriteSiteVideosAreVisible) {
          void scanFavoriteSitePreviews();
        }
      }, { threshold: 0 });
    }
    favoriteSiteVideoObserver.observe(favoriteSiteVideosSection);
    return;
  }
  const bounds = favoriteSiteVideosSection.getBoundingClientRect();
  favoriteSiteVideosAreVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
  if (favoriteSiteVideosAreVisible) {
    void scanFavoriteSitePreviews();
  }
}

function getFavoriteSitePreviewAttemptCount(hostname) {
  return [...favoriteSitePreviewAttempts]
    .filter((url) => getBookmarkedSiteHostnameFrom(url, favoriteBookmarkedSites) === hostname)
    .length;
}

function createFavoriteSitePreviewCard(item) {
  const metadata = getFreshPreviewMetadata(item.url);
  const savedPoster = previewCache[item.url];
  return {
    item,
    imageFrame: document.createElement("div"),
    status: document.createElement("p"),
    imageUrl: metadata?.imageUrl ?? null,
    metadataCheckedAt: metadata?.checkedAt ?? 0,
    videoUrl: isFreshVideoSourceCheck(metadata) ? metadata.videoUrl : null,
    posterVersion: 0,
    videoPage: metadata?.videoPage ?? (savedPoster?.videoPage === true ? true : null)
  };
}

async function scanFavoriteSitePreviews({
  candidateItems = favoriteSiteHistoryItems,
  maxCandidates = MAX_FAVORITE_SITE_CARDS,
  onDemand = false
} = {}) {
  const isSpecificSiteSelected = Boolean(selectedFavoriteSiteHostname);
  if (favoriteSitePreviewScanInProgress ||
      !favoriteSiteVideosAreVisible ||
      document.hidden ||
      historyInitialBatchLoading ||
      historyFillInProgress ||
      (!onDemand && favoriteSiteRowLoadInProgress) ||
      !favoriteSiteHistoryReady ||
      continueSectionCollapsed ||
      discreetCoverActive ||
      (!onDemand &&
        !isSpecificSiteSelected &&
        favoriteSitePreviewAttempts.size >= MAX_FAVORITE_SITE_PREVIEW_CHECKS)) {
    return 0;
  }
  const sitesInScope = getFavoriteBookmarkedSitesInScope();
  const itemsBySite = new Map([...sitesInScope.keys()].map((hostname) => [hostname, []]));
  for (const item of candidateItems) {
    const hostname = getBookmarkedSiteHostnameFrom(item.url, sitesInScope);
    if (hostname && itemsBySite.has(hostname)) {
      itemsBySite.get(hostname).push(item);
    }
  }

  const cards = [];
  const getCandidates = (siteItems) => siteItems
      .filter((item) =>
        !previewCache[item.url]?.dataUrl &&
        !favoriteSitePreviewAttempts.has(item.url) &&
        item.favoriteSitePreviewChecked !== true &&
        getFreshPreviewMetadata(item.url)?.videoPage !== false
      )
      .sort((first, second) => {
        const firstIsKnownVideo = getFreshPreviewMetadata(first.url)?.videoPage === true;
        const secondIsKnownVideo = getFreshPreviewMetadata(second.url)?.videoPage === true;
        return Number(secondIsKnownVideo) - Number(firstIsKnownVideo) ||
          second.lastVisitTime - first.lastVisitTime;
      });

  if (onDemand) {
    const candidatesBySite = [...itemsBySite]
      .map(([hostname, siteItems]) => [hostname, getCandidates(siteItems)])
      .filter(([, candidates]) => candidates.length > 0)
      .sort((first, second) =>
        second[1].length - first[1].length ||
        second[1][0].lastVisitTime - first[1][0].lastVisitTime
      );
    const [, candidates = []] = candidatesBySite[0] ?? [];
    for (const candidate of candidates.slice(0, Math.min(MAX_FAVORITE_SITE_CARDS, maxCandidates))) {
      candidate.favoriteSitePreviewChecked = true;
      cards.push(createFavoriteSitePreviewCard(candidate));
    }
  } else {
    for (const [hostname, siteItems] of itemsBySite) {
      const savedCount = getAutomaticVideoItems(favoriteSiteHistoryItems).filter((item) =>
        getBookmarkedSiteHostnameFrom(item.url, favoriteBookmarkedSites) === hostname
      ).length;
      if (savedCount >= MAX_FAVORITE_SITE_CARDS ||
          getFavoriteSitePreviewAttemptCount(hostname) >= MAX_FAVORITE_SITE_PREVIEW_ATTEMPTS_PER_SITE ||
          (!isSpecificSiteSelected &&
            favoriteSitePreviewAttempts.size + cards.length >= MAX_FAVORITE_SITE_PREVIEW_CHECKS)) {
        continue;
      }
      const candidate = getCandidates(siteItems)[0];
      if (candidate) {
        favoriteSitePreviewAttempts.add(candidate.url);
        candidate.favoriteSitePreviewChecked = true;
        cards.push(createFavoriteSitePreviewCard(candidate));
      }
    }
  }
  if (cards.length === 0) {
    return 0;
  }
  favoriteSitePreviewScanInProgress = true;
  try {
    const previousRows = favoriteSiteRows
      .slice(Math.max(0, favoriteSiteRowIndex - 2), favoriteSiteRowIndex + 1)
      .flatMap((row) => row.items.map((item) => item.url));
    const prioritizedUrls = [...new Set([
      ...previousRows,
      ...cards.map((card) => card.item.url)
    ])];
    await loadPagePreviews(cards, prioritizedUrls);
  } catch (error) {
    historyStatus.textContent = `Could not load favorite-site previews: ${error.message}`;
  } finally {
    favoriteSitePreviewScanInProgress = false;
    renderFavoriteSiteVideos();
  }
  return cards.length;
}

async function scanRandomHistoryPreviews(items) {
  const candidates = items
    .filter((item) =>
      item.randomPreviewChecked !== true &&
      !previewCache[item.url]?.dataUrl &&
      getFreshPreviewMetadata(item.url)?.videoPage !== false
    )
    .sort((first, second) => {
      const firstIsKnownVideo = getFreshPreviewMetadata(first.url)?.videoPage === true;
      const secondIsKnownVideo = getFreshPreviewMetadata(second.url)?.videoPage === true;
      return Number(secondIsKnownVideo) - Number(firstIsKnownVideo) ||
        second.lastVisitTime - first.lastVisitTime;
    })
    .slice(0, MAX_RANDOM_PREVIEW_CHECKS);
  if (candidates.length === 0) {
    return [];
  }
  for (const candidate of candidates) {
    candidate.randomPreviewChecked = true;
  }
  const cards = candidates.map(createFavoriteSitePreviewCard);
  const navigationUrls = [
    ...randomVideoBackHistory.flatMap((pair) => pair.map((item) => item.url)),
    ...randomVideoForwardHistory.flatMap((pair) => pair.map((item) => item.url)),
    ...getCurrentRandomVideoPair().map((item) => item.url),
    ...cards.map((card) => card.item.url)
  ];
  await loadPagePreviews(cards, [...new Set(navigationUrls)]);
  return getAutomaticVideoItems(items);
}

function renderRandomVideoSection() {
  const items = getAutomaticVideoItems();
  const availableUrls = new Set(items.map((item) => item.url));
  randomVideoExploredUrls = new Set(
    [...randomVideoExploredUrls].filter((url) => availableUrls.has(url))
  );
  if (items.length === 0) {
    stopRandomVideoPlayback();
    clearRandomVideoNavigation();
    for (const slot of randomVideoSlots) {
      clearTimeout(slot.transitionTimer);
      slot.element.classList.remove("is-transitioning");
      slot.currentItem = null;
      slot.previousPoster.removeAttribute("src");
      slot.previousPoster.hidden = true;
      slot.poster.removeAttribute("src");
      slot.title.textContent = "";
      slot.site.textContent = "";
      slot.element.removeAttribute("href");
    }
    updateAutomaticSectionVisibility();
    return;
  }
  if (randomVideoSlots.some((slot) => !items.some((item) => item.url === slot.currentItem?.url))) {
    stopRandomVideoPlayback();
    clearRandomVideoNavigation();
    const pair = getRandomVideoPair(items);
    randomVideoSlots.forEach((slot, index) => setRandomVideoPosterItem(slot, pair[index]));
  }
  randomVideoBackHistory = randomVideoBackHistory.filter((pair) =>
    isAvailableRandomVideoPair(pair, items) && isUnclickedRandomVideoPair(pair)
  );
  randomVideoForwardHistory = randomVideoForwardHistory.filter((pair) =>
    isAvailableRandomVideoPair(pair, items) && isUnclickedRandomVideoPair(pair)
  );
  updateRandomVideoNavigation();
  observeRandomVideoSection();
  if (randomVideoIsVisible) {
    updateRandomVideoPlayback();
  }
  updateAutomaticSectionVisibility();
}

function hasUnscannedRandomHistoryPreviews() {
  return historyItems.some((item) =>
    item.randomPreviewChecked !== true &&
    !previewCache[item.url]?.dataUrl &&
    getFreshPreviewMetadata(item.url)?.videoPage !== false
  );
}

function getCurrentRandomVideoPair() {
  return randomVideoSlots.map((slot) => slot.currentItem).filter(Boolean);
}

function sameRandomVideoPair(first, second) {
  return first.length === second.length &&
    first.every((item, index) => item.url === second[index]?.url);
}

function isUnclickedRandomVideoPair(pair) {
  return pair.length === 2 &&
    pair.every((item) => !randomVideoClickedUrls.has(item.url));
}

function isAvailableRandomVideoPair(pair, items = getAutomaticVideoItems()) {
  return pair.length === 2 &&
    pair.every((item) =>
      items.some((candidate) => candidate.url === item.url) &&
      typeof previewCache[item.url]?.dataUrl === "string"
    );
}

function clearRandomVideoNavigation() {
  randomVideoBackHistory = [];
  randomVideoForwardHistory = [];
  randomVideoClickedUrls.clear();
  randomVideoPlayedUrls.clear();
  updateRandomVideoNavigation();
}

function updateRandomVideoNavigation() {
  randomVideoBackButton.disabled = randomVideoBackHistory.length === 0;
  const items = getAutomaticVideoItems();
  randomVideoForwardButton.disabled = randomVideoHistoryLoadInProgress ||
    historyFillInProgress ||
    historyPageLoadPromise !== null ||
    (randomVideoForwardHistory.length === 0 &&
      items.length < 2 &&
      !historyHasMoreResults &&
      !hasUnscannedRandomHistoryPreviews());
}

function rememberRandomVideoPair(pair) {
  const currentPair = getCurrentRandomVideoPair();
  if (!isUnclickedRandomVideoPair(currentPair) ||
      sameRandomVideoPair(currentPair, pair)) {
    return;
  }
  randomVideoBackHistory.push(currentPair);
  if (randomVideoBackHistory.length > MAX_RANDOM_VIDEO_HISTORY) {
    randomVideoBackHistory.shift();
  }
  randomVideoForwardHistory = [];
}

function handleRandomVideoSlotClick(event) {
  if (event.defaultPrevented || event.button !== 0) {
    return;
  }
  const slot = randomVideoSlots.find((candidate) => candidate.element === event.currentTarget);
  const url = slot?.currentItem?.url;
  if (!url) {
    return;
  }
  randomVideoClickedUrls.add(url);
  randomVideoBackHistory = randomVideoBackHistory.filter((pair) =>
    pair.every((item) => item.url !== url)
  );
  randomVideoForwardHistory = randomVideoForwardHistory.filter((pair) =>
    pair.every((item) => item.url !== url)
  );
  updateRandomVideoNavigation();
}

async function navigateRandomVideo(direction) {
  if (randomVideoHistoryLoadInProgress ||
      historyFillInProgress ||
      historyPageLoadPromise !== null) {
    return;
  }
  stopRandomVideoPlayback();
  const currentPair = getCurrentRandomVideoPair();
  const targetHistory = direction === "back"
    ? randomVideoBackHistory
    : randomVideoForwardHistory;
  let targetPair = null;
  while (targetHistory.length > 0 && !targetPair) {
    const candidate = targetHistory.pop();
    if (isUnclickedRandomVideoPair(candidate) &&
        isAvailableRandomVideoPair(candidate)) {
      targetPair = candidate;
    }
  }
  if (!targetPair && direction === "forward") {
    const items = getAutomaticVideoItems();
    const allItemsExplored = items.length > 0 &&
      items.every((item) => randomVideoExploredUrls.has(item.url));
    if (allItemsExplored &&
        (historyHasMoreResults || hasUnscannedRandomHistoryPreviews())) {
      randomVideoHistoryLoadInProgress = true;
      randomVideoStatus.textContent = "Searching older history for previews…";
      updateRandomVideoNavigation();
      let foundNewPreview = false;
      try {
        let candidateItems = historyItems;
        if (historyHasMoreResults) {
          const olderPage = await loadOlderHistoryPage();
          candidateItems = olderPage?.historyItems ?? [];
          if (!historyHasMoreResults) {
            candidateItems = historyItems;
          }
        }
        const expandedItems = await scanRandomHistoryPreviews(candidateItems);
        foundNewPreview = expandedItems.some((item) =>
          !randomVideoExploredUrls.has(item.url)
        );
        randomVideoStatus.textContent = foundNewPreview
          ? ""
          : historyHasMoreResults || hasUnscannedRandomHistoryPreviews()
            ? "No new random previews in this history page. Select Next previews to keep searching."
            : "No additional random previews are available in your history.";
      } catch (error) {
        randomVideoStatus.textContent = `Could not load older random previews: ${error.message}`;
      } finally {
        randomVideoHistoryLoadInProgress = false;
        updateRandomVideoNavigation();
      }
      if (foundNewPreview) {
        void playRandomVideoPair(true);
      } else {
        updateRandomVideoPlayback();
      }
      return;
    }
    updateRandomVideoNavigation();
    void playRandomVideoPair(true);
    return;
  }
  if (targetPair) {
    if (isUnclickedRandomVideoPair(currentPair)) {
      const returnHistory = direction === "back"
        ? randomVideoForwardHistory
        : randomVideoBackHistory;
      returnHistory.push(currentPair);
      if (returnHistory.length > MAX_RANDOM_VIDEO_HISTORY) {
        returnHistory.shift();
      }
    }
    targetPair.forEach((item) => randomVideoPlayedUrls.add(item.url));
    randomVideoSlots.forEach((slot, index) => setRandomVideoPosterItem(slot, targetPair[index]));
  }
  updateRandomVideoNavigation();
  void playRandomVideoPair(false);
}

function getRandomVideoPair(items) {
  const unseenItems = items.filter((item) => !randomVideoPlayedUrls.has(item.url));
  const pool = unseenItems.length >= 2
    ? unseenItems
    : unseenItems.length === 1
      ? [...unseenItems, ...items.filter((item) => item.url !== unseenItems[0].url)]
      : items;
  const firstUrl = randomVideoSlots[0].currentItem?.url;
  const secondUrl = randomVideoSlots[1].currentItem?.url;
  const pairs = [];
  for (const first of pool) {
    for (const second of pool) {
      if (first.url !== second.url ||
          (items.length === 1 && first.url === second.url)) {
        const includesUnseen = unseenItems.length !== 1 ||
          first.url === unseenItems[0].url ||
          second.url === unseenItems[0].url;
        if (includesUnseen &&
            (first.url !== firstUrl || second.url !== secondUrl || items.length === 1)) {
          pairs.push([first, second]);
        }
      }
    }
  }
  const pair = pairs.length > 0
    ? pairs[Math.floor(Math.random() * pairs.length)]
    : items.length === 1
      ? [items[0], items[0]]
      : [items[1], items[0]];
  for (const item of pair) {
    randomVideoPlayedUrls.add(item.url);
    randomVideoExploredUrls.add(item.url);
  }
  if (randomVideoPlayedUrls.size >= items.length) {
    randomVideoPlayedUrls.clear();
    for (const item of pair) {
      randomVideoPlayedUrls.add(item.url);
    }
  }
  return pair;
}

function setRandomVideoPosterItem(slot, item) {
  clearTimeout(slot.transitionTimer);
  slot.element.classList.remove("is-transitioning");
  slot.previousPoster.hidden = true;
  const previousItem = slot.currentItem;
  const previousPoster = previousItem ? previewCache[previousItem.url]?.dataUrl : null;
  const shouldTransition = previousItem?.url !== item.url && Boolean(previousPoster);
  if (shouldTransition) {
    slot.previousPoster.src = previousPoster;
    slot.previousPoster.hidden = false;
  }
  slot.currentItem = item;
  const url = getHistoryUrl(item.url);
  slot.element.href = url.href;
  slot.element.setAttribute("aria-label", `Open video preview: ${item.title?.trim() || url.hostname}`);
  slot.poster.src = previewCache[item.url].dataUrl;
  slot.poster.hidden = false;
  slot.title.textContent = item.title?.trim() || url?.hostname || "";
  slot.site.textContent = url?.hostname || "";
  if (shouldTransition) {
    void slot.element.offsetWidth;
    slot.element.classList.add("is-transitioning");
    slot.transitionTimer = setTimeout(() => {
      if (slot.currentItem?.url === item.url) {
        slot.element.classList.remove("is-transitioning");
        slot.previousPoster.hidden = true;
      }
    }, 1900);
  }
}

function observeRandomVideoSection() {
  if ("IntersectionObserver" in window && !randomVideoObserver) {
    randomVideoObserver = new IntersectionObserver(() => {
      updateRandomVideoVisibility();
    }, { threshold: 0 });
    randomVideoObserver.observe(randomVideoSection);
  }
  if (!randomVideoVisibilityEventsAttached) {
    window.addEventListener("scroll", updateRandomVideoVisibility, { passive: true });
    window.addEventListener("resize", updateRandomVideoVisibility);
    randomVideoVisibilityEventsAttached = true;
  }
  updateRandomVideoVisibility();
}

function updateRandomVideoVisibility() {
  const bounds = randomVideoSection.getBoundingClientRect();
  randomVideoIsVisible = !randomVideoSection.hidden &&
    !continueContent.hidden &&
    bounds.bottom > 0 &&
    bounds.top < window.innerHeight;
  updateRandomVideoPlayback();
}

function handleReducedMotionChange() {
  if (reducedMotionPreference.matches) {
    for (const slot of randomVideoSlots) {
      slot.player.pause();
      slot.player.removeAttribute("src");
      slot.player.load();
      slot.player.hidden = true;
      slot.poster.hidden = false;
    }
  }
  updateRandomVideoVisibility();
}

function isFreshVideoSourceCheck(metadata, now = Date.now()) {
  return Number.isFinite(metadata?.videoCheckedAt) &&
    metadata.videoCheckedAt <= now &&
    now - metadata.videoCheckedAt < PREVIEW_METADATA_TTL_MS;
}

async function scanRandomVideoSources() {
  if (randomVideoSourceScanInProgress) {
    return;
  }
  randomVideoSourceScanInProgress = true;
  randomVideoStatus.textContent = "Checking bookmarked pages for direct video clips…";
  let changed = false;
  let failedCount = 0;
  let permissionSkippedCount = 0;
  const candidates = getAutomaticVideoItems()
    .filter((item) =>
      !randomVideoSourceAttempts.has(item.url) &&
      !isFreshVideoSourceCheck(getFreshPreviewMetadata(item.url))
    )
    .sort((first, second) => second.lastVisitTime - first.lastVisitTime)
    .slice(0, MAX_RANDOM_VIDEO_SOURCE_SCANS);
  try {
    await forEachWithConcurrency(candidates, 2, async (item) => {
      if (!canPlayRandomVideo() || reducedMotionPreference.matches) {
        return;
      }
      let permitted;
      try {
        permitted = await hasOriginPermission(item.url);
      } catch {
        randomVideoSourceAttempts.add(item.url);
        failedCount += 1;
        return;
      }
      if (!canPlayRandomVideo() || reducedMotionPreference.matches) {
        return;
      }
      randomVideoSourceAttempts.add(item.url);
      if (!permitted) {
        permissionSkippedCount += 1;
        return;
      }
      try {
        const response = await fetchPreviewResponse(item.url, MAX_HTML_BYTES, "text/html");
        const html = new TextDecoder().decode(response.bytes);
        const document = new DOMParser().parseFromString(html, "text/html");
        const metadata = getFreshPreviewMetadata(item.url) ?? {
          videoPage: true,
          imageUrl: null,
          checkedAt: Date.now(),
          classificationVersion: PREVIEW_CLASSIFICATION_VERSION
        };
        metadata.videoUrl = findDirectVideoUrl(document, response.responseUrl || item.url);
        metadata.videoCheckedAt = Date.now();
        previewMetadataCache[item.url] = metadata;
        changed = true;
      } catch {
        failedCount += 1;
      }
    });
    if (changed) {
      await savePreviewMetadataCache();
      randomVideoPermittedUrls.clear();
    }
    const hasDirectClip = getAutomaticVideoItems().some((item) => {
      const metadata = getFreshPreviewMetadata(item.url);
      return isFreshVideoSourceCheck(metadata) && typeof metadata.videoUrl === "string";
    });
    randomVideoStatus.textContent = failedCount > 0
      ? "Some clip sources could not be checked; saved posters will be used where needed."
      : hasDirectClip
        ? ""
        : permissionSkippedCount > 0
          ? "Some pages need site access before clips can be checked; saved posters will keep rotating."
          : "No playable direct clips were found; saved posters will keep rotating.";
  } catch (error) {
    randomVideoStatus.textContent = `Could not check clip sources: ${error.message}`;
  } finally {
    randomVideoSourceScanInProgress = false;
    updateRandomVideoPlayback();
  }
}

function canPlayRandomVideo() {
  return randomVideoIsVisible &&
    !document.hidden &&
    !randomVideoHistoryLoadInProgress &&
    !discreetCoverActive &&
    !randomVideoSection.hidden;
}

function needsRandomVideoSourceCheck() {
  return getAutomaticVideoItems().some((item) =>
    !randomVideoSourceAttempts.has(item.url) &&
    !isFreshVideoSourceCheck(getFreshPreviewMetadata(item.url))
  );
}

function stopRandomVideoPlayback() {
  clearTimeout(randomVideoTimer);
  randomVideoTimer = null;
  for (const slot of randomVideoSlots) {
    slot.player.pause();
    slot.player.removeAttribute("src");
    slot.player.load();
    slot.player.hidden = true;
    if (slot.currentItem && previewCache[slot.currentItem.url]?.dataUrl) {
      slot.poster.hidden = false;
    }
  }
}

function updateRandomVideoPlayback() {
  if (!canPlayRandomVideo()) {
    stopRandomVideoPlayback();
    return;
  }
  if (!reducedMotionPreference.matches &&
      !randomVideoSourceScanInProgress &&
      needsRandomVideoSourceCheck()) {
    void scanRandomVideoSources();
  }
  if (randomVideoTimer === null) {
    void playRandomVideoPair(false);
  }
}

function scheduleRandomVideoAdvance() {
  if (!canPlayRandomVideo()) {
    return;
  }
  randomVideoTimer = setTimeout(() => {
    randomVideoTimer = null;
    void playRandomVideoPair(true);
  }, RANDOM_VIDEO_DURATION_MS);
}

async function hasRandomVideoPermission(url) {
  if (randomVideoPermittedUrls.has(url)) {
    return true;
  }
  if (!await hasOriginPermission(url)) {
    return false;
  }
  randomVideoPermittedUrls.add(url);
  return true;
}

async function showRandomVideoInSlot(slot, item) {
  const metadata = getFreshPreviewMetadata(item.url);
  const videoUrl = !reducedMotionPreference.matches &&
    isFreshVideoSourceCheck(metadata)
    ? metadata.videoUrl
    : null;
  slot.player.pause();
  slot.player.removeAttribute("src");
  slot.player.load();
  slot.player.hidden = true;
  slot.poster.hidden = false;
  if (typeof videoUrl !== "string" || !canPlayRandomVideo()) {
    return;
  }
  try {
    const hasPermission = await hasRandomVideoPermission(videoUrl);
    if (slot.currentItem?.url !== item.url || !canPlayRandomVideo()) {
      return;
    }
    if (!hasPermission) {
      randomVideoStatus.textContent = "A clip host does not have permission; showing its saved poster.";
      return;
    }

    slot.player.crossOrigin = "anonymous";
    slot.player.referrerPolicy = "no-referrer";
    slot.player.muted = true;
    slot.player.playsInline = true;
    slot.player.preload = "metadata";
    slot.player.onerror = () => {
      if (slot.currentItem?.url !== item.url) {
        return;
      }
      slot.player.pause();
      slot.player.hidden = true;
      slot.poster.hidden = false;
      randomVideoStatus.textContent = "A clip could not play; showing its saved poster instead.";
    };
    slot.player.onloadeddata = () => {
      if (slot.currentItem?.url === item.url && canPlayRandomVideo()) {
        slot.poster.hidden = true;
      }
    };
    slot.player.hidden = false;
    slot.player.src = videoUrl;
    void slot.player.play().catch(() => {
      if (slot.currentItem?.url !== item.url || slot.player.src !== videoUrl) {
        return;
      }
      slot.player.hidden = true;
      slot.poster.hidden = false;
      randomVideoStatus.textContent = "A clip could not play; showing its saved poster instead.";
    });
  } catch (error) {
    randomVideoStatus.textContent = `Could not prepare a video preview: ${error.message}`;
  }
}

async function playRandomVideoPair(advance) {
  if (randomVideoAdvancePending || !canPlayRandomVideo()) {
    return;
  }
  randomVideoAdvancePending = true;
  try {
    const items = getAutomaticVideoItems();
    if (items.length === 0) {
      return;
    }
    if (advance ||
        randomVideoSlots.some((slot) => !items.some((item) => item.url === slot.currentItem?.url))) {
      const pair = getRandomVideoPair(items);
      if (advance) {
        rememberRandomVideoPair(pair);
      }
      randomVideoSlots.forEach((slot, index) => setRandomVideoPosterItem(slot, pair[index]));
      updateRandomVideoNavigation();
    }
    await Promise.all(randomVideoSlots.map((slot) =>
      showRandomVideoInSlot(slot, slot.currentItem)
    ));
    scheduleRandomVideoAdvance();
  } catch (error) {
    randomVideoStatus.textContent = `Could not prepare the random previews: ${error.message}`;
    scheduleRandomVideoAdvance();
  } finally {
    randomVideoAdvancePending = false;
    if (randomVideoTimer === null && canPlayRandomVideo()) {
      void playRandomVideoPair(false);
    }
  }
}

function hideHistoryHoverPreview() {
  clearTimeout(historyHoverPreviewTimer);
  clearTimeout(historyHoverPreviewHideTimer);
  historyHoverPreviewTimer = null;
  historyHoverPreviewHideTimer = null;
  activeHistoryPreviewEntry = null;
  historyHoverPreview.classList.remove("is-visible");
  historyHoverPreview.setAttribute("aria-hidden", "true");
  historyHoverPreviewImage.removeAttribute("src");
  historyHoverPreviewImage.style.display = "";
  historyHoverPreviewTitle.textContent = "";
  historyHoverPreviewMessage.textContent = "";
}

function hideHistoryHoverPreviewFor(link) {
  if (activeHistoryPreviewEntry !== link ||
      link.matches(":hover") ||
      link === document.activeElement ||
      historyHoverPreview.matches(":hover") ||
      historyHoverPreview.contains(document.activeElement)) {
    return;
  }
  clearTimeout(historyHoverPreviewHideTimer);
  historyHoverPreviewHideTimer = setTimeout(() => {
    if (activeHistoryPreviewEntry === link && !isHistoryHoverActive(link)) {
      hideHistoryHoverPreview();
    }
  }, 250);
}

function showHistoryHoverPreview(link, item) {
  clearTimeout(historyHoverPreviewTimer);
  clearTimeout(historyHoverPreviewHideTimer);
  activeHistoryPreviewEntry = link;
  const cached = previewCache[item.url];
  const loadedCard = historyCards.find((card) => card.item.url === item.url);
  const posterDataUrl = cached?.videoPage === true && cached.dataUrl
    ? cached.dataUrl
    : loadedCard?.posterDataUrl;
  if (typeof posterDataUrl === "string" && posterDataUrl.startsWith("data:image/jpeg;base64,")) {
    updateHistoryHoverPreview(link, item, posterDataUrl, "");
    return;
  }

  const genericPreview = historyHoverPreviewCache.get(item.url);
  if (genericPreview) {
    updateHistoryHoverPreview(link, item, genericPreview, "");
    return;
  }

  updateHistoryHoverPreview(link, item, null, "Checking site access…");
  historyHoverPreviewTimer = setTimeout(() => {
    if (isHistoryHoverActive(link)) {
      void loadGenericHistoryHoverPreview(link, item);
    }
  }, HISTORY_HOVER_PREVIEW_DELAY_MS);
}

function isHistoryHoverActive(link) {
  return activeHistoryPreviewEntry === link &&
    (link.matches(":hover") ||
      link === document.activeElement ||
      historyHoverPreview.matches(":hover") ||
      historyHoverPreview.contains(document.activeElement));
}

function updateHistoryHoverPreview(link, item, dataUrl, message) {
  if (activeHistoryPreviewEntry !== link) {
    return;
  }

  const rect = link.getBoundingClientRect();
  const width = Math.min(280, window.innerWidth - 24);
  const height = dataUrl ? width * 0.5625 + 48 : 104;
  let left = rect.left - width - 12;
  if (left < 12) {
    left = rect.right + 12;
  }
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  const top = Math.max(12, Math.min(
    rect.top + (rect.height - height) / 2,
    window.innerHeight - height - 12
  ));

  if (dataUrl) {
    historyHoverPreviewImage.src = dataUrl;
    historyHoverPreviewImage.style.display = "";
  } else {
    historyHoverPreviewImage.removeAttribute("src");
    historyHoverPreviewImage.style.display = "none";
  }
  historyHoverPreviewTitle.textContent =
    link.querySelector(".favorite-history-title")?.textContent || new URL(item.url).hostname;
  historyHoverPreviewMessage.textContent = message;
  historyHoverPreview.style.width = `${width}px`;
  historyHoverPreview.style.left = `${left}px`;
  historyHoverPreview.style.top = `${top}px`;
  historyHoverPreview.setAttribute("aria-hidden", "false");
  historyHoverPreview.classList.add("is-visible");
}

function showHistoryHoverPermission(link, item, error) {
  const hostType = error.hostType === "image" ? "image host" : "page site";
  updateHistoryHoverPreview(
    link,
    item,
    null,
    `This ${hostType} needs access. Select Allow all sites above to load this preview.`
  );
}

async function loadGenericHistoryHoverPreview(link, item) {
  if (!isHistoryHoverActive(link)) {
    return;
  }

  updateHistoryHoverPreview(link, item, null, "Checking site access…");
  let request = historyHoverPreviewRequests.get(item.url);
  if (!request) {
    request = fetchGenericHistoryHoverPreview(item.url);
    historyHoverPreviewRequests.set(item.url, request);
  }

  try {
    const dataUrl = await request;
    rememberGenericHistoryHoverPreview(item.url, dataUrl);
    if (isHistoryHoverActive(link)) {
      updateHistoryHoverPreview(link, item, dataUrl, "");
    }
  } catch (error) {
    if (isHistoryHoverActive(link)) {
      if (error instanceof UnapprovedHistoryPreviewHostError) {
        showHistoryHoverPermission(link, item, error);
      } else {
        updateHistoryHoverPreview(link, item, null, `Preview unavailable: ${error.message}`);
      }
    }
  } finally {
    if (historyHoverPreviewRequests.get(item.url) === request) {
      historyHoverPreviewRequests.delete(item.url);
    }
  }
}

function rememberGenericHistoryHoverPreview(url, dataUrl) {
  historyHoverPreviewCache.delete(url);
  historyHoverPreviewCache.set(url, dataUrl);
  while (historyHoverPreviewCache.size > MAX_HISTORY_HOVER_PREVIEWS) {
    historyHoverPreviewCache.delete(historyHoverPreviewCache.keys().next().value);
  }
}

class UnapprovedHistoryPreviewHostError extends Error {
  constructor(url, hostType) {
    super(`${hostType === "image" ? "Image host" : "Page site"} access is not approved.`);
    this.name = "UnapprovedHistoryPreviewHostError";
    this.url = url;
    this.hostType = hostType;
  }
}

async function fetchGenericHistoryHoverPreview(pageUrl) {
  if (!await hasOriginPermission(pageUrl)) {
    throw new UnapprovedHistoryPreviewHostError(pageUrl, "page");
  }
  const response = await fetchPreviewResponse(pageUrl, MAX_HTML_BYTES, "text/html");
  const html = new TextDecoder().decode(response.bytes);
  const imageUrl = findPagePreviewImageUrl(html, response.responseUrl || pageUrl);
  if (!await hasOriginPermission(imageUrl)) {
    throw new UnapprovedHistoryPreviewHostError(imageUrl, "image");
  }
  return fetchPreviewImageDataUrl(imageUrl);
}

historyHoverPreview.addEventListener("pointerenter", () => {
  clearTimeout(historyHoverPreviewHideTimer);
});
historyHoverPreview.addEventListener("pointerleave", () => {
  if (activeHistoryPreviewEntry) {
    hideHistoryHoverPreviewFor(activeHistoryPreviewEntry);
  }
});
historyHoverPreview.addEventListener("focusout", () => {
  const link = activeHistoryPreviewEntry;
  if (!link) {
    return;
  }
  clearTimeout(historyHoverPreviewHideTimer);
  historyHoverPreviewHideTimer = setTimeout(() => {
    if (activeHistoryPreviewEntry === link && !isHistoryHoverActive(link)) {
      hideHistoryHoverPreview();
    }
  }, 0);
});
window.addEventListener("scroll", hideHistoryHoverPreview, true);
window.addEventListener("resize", hideHistoryHoverPreview);

async function loadMoreFavoriteHistory(hostname, visibleLimit) {
  if (historyGroupLoadsInProgress.has(hostname)) {
    return;
  }
  historyGroupLoadsInProgress.add(hostname);
  const targetLimit = visibleLimit + HISTORY_GROUP_PAGE_BATCH;
  try {
    let olderPagesLoaded = 0;
    while (historyHasMoreResults && olderPagesLoaded < MAX_HISTORY_PAGES_PER_FILL) {
      const matchingCount = getFilteredHistoryItems(historyItems).filter((item) =>
        getBookmarkedSiteHostname(item.url) === hostname
      ).length;
      if (matchingCount >= targetLimit) {
        break;
      }
      const olderPage = await loadOlderHistoryPage();
      olderPagesLoaded += 1;
      if (!olderPage || olderPage.items.length === 0) {
        break;
      }
    }
    historyGroupLimits.set(hostname, targetLimit);
  } catch (error) {
    historyStatus.textContent = `Could not load older history for ${hostname}: ${error.message}`;
  } finally {
    historyGroupLoadsInProgress.delete(hostname);
    renderFavoriteHistory(historyItems);
  }
}

function renderFavoriteHistory(items) {
  hideHistoryHoverPreview();
  const filteredItems = getFilteredHistoryItems(items);
  const groupedItems = new Map();
  for (const item of filteredItems) {
    const hostname = getBookmarkedSiteHostname(item.url);
    if (!hostname) {
      continue;
    }
    if (!groupedItems.has(hostname)) {
      groupedItems.set(hostname, []);
    }
    groupedItems.get(hostname).push(item);
  }

  const groups = [...groupedItems.entries()];
  for (const [, pages] of groups) {
    pages.sort((a, b) => (b.lastVisitTime ?? 0) - (a.lastVisitTime ?? 0));
  }
  groups.sort(([, a], [, b]) => (b[0]?.lastVisitTime ?? 0) - (a[0]?.lastVisitTime ?? 0));
  for (const hostname of historyGroupLimits.keys()) {
    if (!groupedItems.has(hostname)) {
      historyGroupLimits.delete(hostname);
    }
  }

  favoriteHistoryList.replaceChildren();
  favoriteHistoryEmpty.hidden = groups.length > 0;
  favoriteHistoryEmpty.textContent = bookmarkedSites.size === 0
    ? "Add a website bookmark to the selected folder to see its history."
    : items.length > 0 && filteredItems.length === 0
      ? "No history matches these filters."
      : "No recent history from the selected folder's bookmarked websites.";

  const visitTimeFormat = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  for (const [hostname, pages] of groups) {
    const site = bookmarkedSites.get(hostname);
    const visibleLimit = Math.min(
      pages.length,
      Math.max(HISTORY_GROUP_PAGE_BATCH, historyGroupLimits.get(hostname) ?? HISTORY_GROUP_PAGE_BATCH)
    );
    const group = document.createElement("section");
    group.className = "favorite-history-group";
    const heading = document.createElement("div");
    heading.className = "favorite-history-group-heading";
    const identity = document.createElement("div");
    identity.className = "favorite-history-site-identity";
    const siteIcon = document.createElement("span");
    siteIcon.className = "favorite-history-site-icon";
    const iconDataUrl = [...(site?.origins ?? [])]
      .map((origin) => faviconCache[origin])
      .find(Boolean);
    if (iconDataUrl) {
      const image = document.createElement("img");
      image.src = iconDataUrl;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.addEventListener("error", () => {
        const mark = document.createElement("span");
        mark.className = "favorite-history-site-mark";
        mark.textContent = (site?.name || hostname).slice(0, 1).toUpperCase();
        siteIcon.replaceChildren(mark);
      }, { once: true });
      siteIcon.append(image);
    } else {
      const mark = document.createElement("span");
      mark.className = "favorite-history-site-mark";
      mark.textContent = (site?.name || hostname).slice(0, 1).toUpperCase();
      siteIcon.append(mark);
    }
    const siteLabels = document.createElement("div");
    siteLabels.className = "favorite-history-site-labels";
    const title = document.createElement("h3");
    title.className = "favorite-history-hostname";
    title.textContent = site?.name || hostname;
    title.title = site?.name || hostname;
    const hostLabel = document.createElement("span");
    hostLabel.className = "favorite-history-host-label";
    hostLabel.textContent = hostname;
    const pageCount = document.createElement("span");
    pageCount.className = "favorite-history-group-count";
    pageCount.textContent = String(pages.length);
    siteLabels.append(title, hostLabel);
    identity.append(siteIcon, siteLabels);
    heading.append(identity, pageCount);

    const entries = document.createElement("div");
    entries.className = "favorite-history-entries";
    for (const item of pages.slice(0, visibleLimit)) {
      const url = getHistoryUrl(item.url);
      if (!url) {
        continue;
      }
      const link = document.createElement("a");
      link.className = "favorite-history-entry";
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const pageTitle = document.createElement("span");
      pageTitle.className = "favorite-history-title";
      pageTitle.textContent = item.title?.trim() || url.hostname;
      link.append(pageTitle);
      link.addEventListener("pointerenter", () => showHistoryHoverPreview(link, item));
      link.addEventListener("pointerleave", () => hideHistoryHoverPreviewFor(link));
      link.addEventListener("focus", () => showHistoryHoverPreview(link, item));
      link.addEventListener("blur", () => hideHistoryHoverPreviewFor(link));
      if (Number.isFinite(item.lastVisitTime)) {
        const visitedAt = new Date(item.lastVisitTime);
        if (Number.isFinite(visitedAt.getTime())) {
          const time = document.createElement("time");
          time.className = "favorite-history-time";
          time.dateTime = visitedAt.toISOString();
          time.textContent = visitTimeFormat.format(visitedAt);
          link.append(time);
        }
      }
      entries.append(link);
    }
    group.append(heading, entries);
    if (pages.length > HISTORY_GROUP_PAGE_BATCH ||
        historyHasMoreResults ||
        visibleLimit > HISTORY_GROUP_PAGE_BATCH) {
      const actions = document.createElement("div");
      actions.className = "favorite-history-actions";
      if (visibleLimit < pages.length || historyHasMoreResults) {
        const loadMore = document.createElement("button");
        loadMore.className = "text-button favorite-history-action";
        loadMore.type = "button";
        loadMore.textContent = historyGroupLoadsInProgress.has(hostname) ? "Loading…" : "Load more";
        loadMore.disabled = historyGroupLoadsInProgress.has(hostname) || historyFillInProgress;
        loadMore.addEventListener("click", () => {
          if (visibleLimit < pages.length) {
            historyGroupLimits.set(hostname, visibleLimit + HISTORY_GROUP_PAGE_BATCH);
            renderFavoriteHistory(items);
          } else {
            void loadMoreFavoriteHistory(hostname, visibleLimit);
          }
        });
        actions.append(loadMore);
      }
      if (visibleLimit > HISTORY_GROUP_PAGE_BATCH) {
        const showLess = document.createElement("button");
        showLess.className = "text-button favorite-history-action";
        showLess.type = "button";
        showLess.textContent = "Show less";
        showLess.addEventListener("click", () => {
          historyGroupLimits.set(hostname, HISTORY_GROUP_PAGE_BATCH);
          renderFavoriteHistory(items);
        });
        actions.append(showLess);
      }
      group.append(actions);
    }
    favoriteHistoryList.append(group);
  }
}

function updateHistorySearchCursor(items, previousEndTime = null) {
  let oldestVisitTime = Infinity;
  for (const item of items) {
    if (Number.isFinite(item?.lastVisitTime)) {
      oldestVisitTime = Math.min(oldestVisitTime, item.lastVisitTime);
    }
  }
  if (items.length < MAX_HISTORY_RESULTS ||
      !Number.isFinite(oldestVisitTime) ||
      (previousEndTime !== null && oldestVisitTime + 1 >= previousEndTime)) {
    historyHasMoreResults = false;
    historyOlderEndTime = null;
    return;
  }
  historyHasMoreResults = true;
  historyOlderEndTime = oldestVisitTime + 1;
}

function normalizeHistorySnapshotItems(items, sites = bookmarkedSites) {
  return items
    .filter((item) =>
      item &&
      typeof item.url === "string" &&
      getHistoryUrl(item.url) &&
      Number.isFinite(item.lastVisitTime) &&
      getBookmarkedSiteHostnameFrom(item.url, sites)
    )
    .map((item) => ({
      url: item.url,
      title: typeof item.title === "string" ? item.title : "",
      lastVisitTime: item.lastVisitTime
    }));
}

async function loadFavoriteSiteHistory() {
  const loadVersion = ++favoriteSiteHistoryLoadVersion;
  favoriteSiteHistoryReady = false;
  favoriteSiteStatus.textContent = "Reading history from bookmarked sites…";
  if (favoriteBookmarkedSites.size === 0) {
    favoriteSiteHistoryItems = [];
  } else {
    const items = await browser.history.search({
      text: "",
      startTime: 0,
      maxResults: MAX_HISTORY_RESULTS
    });
    if (loadVersion !== favoriteSiteHistoryLoadVersion) {
      return;
    }
    favoriteSiteHistoryItems = normalizeHistorySnapshotItems(items, favoriteBookmarkedSites);
  }
  if (loadVersion !== favoriteSiteHistoryLoadVersion) {
    return;
  }
  favoriteSiteHistoryReady = true;
  const selectedSite = favoriteBookmarkedSites.get(selectedFavoriteSiteHostname);
  favoriteSiteStatus.textContent = favoriteBookmarkedSites.size === 0
    ? "No bookmarked websites were found."
    : favoriteSiteHistoryItems.length === 0
      ? `No recent history from ${selectedSite?.name ?? "your bookmarked sites"}.`
      : "";
  renderFavoriteSiteVideos();
}

async function loadOlderHistoryPage() {
  if (historyPageLoadPromise) {
    return historyPageLoadPromise;
  }
  if (!historyHasMoreResults || !Number.isFinite(historyOlderEndTime)) {
    return null;
  }
  const pendingLoad = loadOlderHistoryPageData();
  historyPageLoadPromise = pendingLoad;
  try {
    return await pendingLoad;
  } finally {
    if (historyPageLoadPromise === pendingLoad) {
      historyPageLoadPromise = null;
    }
    updateRandomVideoNavigation();
  }
}

async function loadOlderHistoryPageData() {
  const endTime = historyOlderEndTime;
  const items = await browser.history.search({
    text: "",
    startTime: 0,
    endTime,
    maxResults: MAX_HISTORY_RESULTS
  });
  updateHistorySearchCursor(items, endTime);
  const olderPages = [];
  for (const item of items) {
    if (!item || typeof item.url !== "string" || historySeenUrls.has(item.url)) {
      continue;
    }
    historySeenUrls.add(item.url);
    if (isBookmarkedWebsite(item.url)) {
      olderPages.push(item);
    }
  }
  olderPages.sort((a, b) => (b.lastVisitTime ?? 0) - (a.lastVisitTime ?? 0));
  historyItems.push(...olderPages);
  if (favoriteSiteHistoryReady) {
    const knownFavoriteUrls = new Set(favoriteSiteHistoryItems.map((item) => item.url));
    for (const item of normalizeHistorySnapshotItems(items, favoriteBookmarkedSites)) {
      if (!knownFavoriteUrls.has(item.url)) {
        knownFavoriteUrls.add(item.url);
        favoriteSiteHistoryItems.push(item);
      }
    }
    favoriteSiteHistoryItems.sort((first, second) => second.lastVisitTime - first.lastVisitTime);
  }
  updateHistoryFilterOptions();
  updateHistoryFilterStatus();
  updateLoadMoreHistoryButton();
  renderFavoriteSiteVideos();
  renderRandomVideoSection();
  renderFavoriteHistory(historyItems);
  return {
    items,
    historyItems: olderPages
  };
}

async function loadRecentHistory() {
  if (historyLoadInProgress) {
    historyLoadRequested = true;
    return;
  }
  historyLoadInProgress = true;
  try {
    do {
      historyLoadRequested = false;
      await loadRecentHistoryData();
      if (historyLoadRequested) {
        historySnapshotNeedsRefresh = true;
      }
    } while (historyLoadRequested);
  } finally {
    historyLoadInProgress = false;
  }
}

async function loadRecentHistoryData() {
  historyStatus.textContent = "Checking recent history…";
  historyInfoStatus.textContent = "";
  loadPreviewsButton.disabled = true;
  historyHasMoreResults = false;
  historyOlderEndTime = null;
  historySeenUrls = new Set();
  randomVideoExploredUrls.clear();
  const saved = await browser.storage.local.get([
    "historySnapshot",
    "historySnapshotNeedsRefresh",
    "previewCache",
    "previewMetadataCache",
    "historyTags"
  ]);
  let storageWarning = "";
  if (saved.historyTags !== undefined) {
    try {
      await browser.storage.local.remove("historyTags");
    } catch (error) {
      storageWarning = `Could not remove old personal tags from this device: ${error.message}`;
    }
  }
  const snapshotKey = getHistorySnapshotKey();
  const savedSnapshot = saved.historySnapshot;
  const now = Date.now();
  const cachedSnapshotItems = savedSnapshot && Array.isArray(savedSnapshot.items)
    ? normalizeHistorySnapshotItems(savedSnapshot.items)
    : [];
  const canIncrementallyUpdate = !historySnapshotNeedsRefresh &&
    saved.historySnapshotNeedsRefresh !== true &&
    savedSnapshot &&
    savedSnapshot.folderKey === snapshotKey &&
    Array.isArray(savedSnapshot.items) &&
    Number.isFinite(savedSnapshot.syncedAt) &&
    savedSnapshot.syncedAt <= now &&
    Number.isFinite(savedSnapshot.lastFullSyncAt) &&
    savedSnapshot.lastFullSyncAt <= now &&
    now - savedSnapshot.lastFullSyncAt < HISTORY_SNAPSHOT_REFRESH_MS;
  const savedCache = saved.previewCache && typeof saved.previewCache === "object" && !Array.isArray(saved.previewCache)
    ? saved.previewCache
    : {};
  const validCache = {};
  for (const [url, entry] of Object.entries(savedCache)) {
    if (entry &&
        typeof entry.dataUrl === "string" &&
        entry.dataUrl.startsWith("data:image/jpeg;base64,") &&
        entry.dataUrl.length <= MAX_POSTER_DATA_URL_LENGTH &&
        typeof entry.imageHost === "string" &&
        entry.videoPage === true) {
      validCache[url] = entry;
    }
  }
  previewCache = trimPreviewCache(validCache, cachedSnapshotItems);
  const cacheWasPruned = Object.keys(savedCache).length !== Object.keys(previewCache).length;
  const savedMetadataCache = saved.previewMetadataCache &&
    typeof saved.previewMetadataCache === "object" &&
    !Array.isArray(saved.previewMetadataCache)
    ? saved.previewMetadataCache
    : {};
  const validMetadataCache = {};
  for (const [url, entry] of Object.entries(savedMetadataCache)) {
    if (isValidPreviewMetadata(url, entry, now)) {
      const metadata = {
        videoPage: entry.videoPage,
        imageUrl: entry.imageUrl,
        checkedAt: entry.checkedAt
      };
      if (entry.classificationVersion === PREVIEW_CLASSIFICATION_VERSION) {
        metadata.classificationVersion = entry.classificationVersion;
      }
      if (Number.isFinite(entry.videoCheckedAt)) {
        metadata.videoUrl = entry.videoUrl ?? null;
        metadata.videoCheckedAt = entry.videoCheckedAt;
      }
      validMetadataCache[url] = metadata;
    }
  }
  previewMetadataCache = validMetadataCache;
  trimPreviewMetadataCache();
  const metadataCacheWasPruned =
    Object.keys(savedMetadataCache).length !== Object.keys(previewMetadataCache).length ||
    Object.values(savedMetadataCache).some((entry) =>
      entry && Object.keys(entry).some((key) =>
        !["videoPage", "imageUrl", "checkedAt", "classificationVersion", "videoUrl", "videoCheckedAt"].includes(key)
      )
    );

  let queryStartedAt = Date.now();
  let completedFullSync = !canIncrementallyUpdate;
  let items;
  let recentPages;
  if (canIncrementallyUpdate) {
    items = await browser.history.search({
      text: "",
      startTime: Math.max(0, savedSnapshot.syncedAt - HISTORY_SYNC_OVERLAP_MS),
      maxResults: MAX_HISTORY_RESULTS
    });
    const previousItems = new Map(cachedSnapshotItems.map((item) => [item.url, item]));
    historySeenUrls = new Set(previousItems.keys());
    for (const item of items) {
      if (typeof item?.url === "string") {
        historySeenUrls.add(item.url);
      }
      if (!item || typeof item.url !== "string" || !isBookmarkedWebsite(item.url)) {
        continue;
      }
      const currentItem = previousItems.get(item.url);
      if (!currentItem || (item.lastVisitTime ?? 0) >= currentItem.lastVisitTime) {
        previousItems.set(item.url, item);
      }
    }
    if (items.length >= MAX_HISTORY_RESULTS) {
      queryStartedAt = Date.now();
      items = await browser.history.search({
        text: "",
        startTime: 0,
        maxResults: MAX_HISTORY_RESULTS
      });
      completedFullSync = true;
      historySeenUrls = new Set(items
        .map((item) => item?.url)
        .filter((url) => typeof url === "string"));
      updateHistorySearchCursor(items);
      recentPages = normalizeHistorySnapshotItems(items)
        .sort((a, b) => (b.lastVisitTime ?? 0) - (a.lastVisitTime ?? 0))
        .slice(0, MAX_HISTORY_RESULTS);
    } else {
      historyHasMoreResults = savedSnapshot.hasMoreResults === true &&
        Number.isFinite(savedSnapshot.olderEndTime);
      historyOlderEndTime = historyHasMoreResults ? savedSnapshot.olderEndTime : null;
      recentPages = normalizeHistorySnapshotItems([...previousItems.values()])
        .sort((a, b) => (b.lastVisitTime ?? 0) - (a.lastVisitTime ?? 0))
        .slice(0, MAX_HISTORY_RESULTS);
    }
  } else {
    items = await browser.history.search({
      text: "",
      startTime: 0,
      maxResults: MAX_HISTORY_RESULTS
    });
    historySeenUrls = new Set(items
      .map((item) => item?.url)
      .filter((url) => typeof url === "string"));
    updateHistorySearchCursor(items);
    recentPages = normalizeHistorySnapshotItems(items)
      .sort((a, b) => (b.lastVisitTime ?? 0) - (a.lastVisitTime ?? 0))
      .slice(0, MAX_HISTORY_RESULTS);
  }
  historySnapshot = {
    folderKey: snapshotKey,
    syncedAt: queryStartedAt,
    lastFullSyncAt: completedFullSync ? queryStartedAt : savedSnapshot.lastFullSyncAt,
    items: normalizeHistorySnapshotItems(recentPages),
    hasMoreResults: historyHasMoreResults,
    olderEndTime: historyOlderEndTime
  };
  const storageUpdates = {
    historySnapshot,
    historySnapshotNeedsRefresh: false
  };
  if (cacheWasPruned) {
    storageUpdates.previewCache = previewCache;
  }
  if (metadataCacheWasPruned) {
    storageUpdates.previewMetadataCache = previewMetadataCache;
  }
  try {
    await browser.storage.local.set(storageUpdates);
    historySnapshotNeedsRefresh = false;
  } catch (error) {
    storageWarning = [
      storageWarning,
      `Could not save local reload data: ${error.message}`
    ].filter(Boolean).join(" ");
  }
  historyInitialBatchLoading = true;
  renderHistory(recentPages);
  loadBookmarkFavicons().catch((error) => {
    bookmarkStatus.textContent = `Could not load bookmark icons: ${error.message}`;
  });
  historyStatus.textContent = storageWarning;
  try {
    await fillHistoryBatch(getHistoryBatchSize(), true);
  } finally {
    historyInitialBatchLoading = false;
    updateVisibleHistory();
    renderFavoriteSiteVideos();
    renderFavoriteHistory(historyItems);
    if (storageWarning) {
      historyStatus.textContent = storageWarning;
    }
  }
}

function loadHistoryAfterBookmarks() {
  favoriteSiteHistoryReady = false;
  return loadRecentHistory()
    .catch((error) => {
      historyStatus.textContent = `Could not read recent history: ${error.message}`;
      loadPreviewsButton.disabled = true;
    })
    .then(() => loadFavoriteSiteHistory())
    .catch((error) => {
      favoriteSiteHistoryReady = true;
      favoriteSiteStatus.textContent = `Could not read favorite-site history: ${error.message}`;
      renderFavoriteSiteVideos();
    });
}

async function readLimitedResponse(response, maxBytes) {
  if (!response.body) {
    throw new Error("The site did not return a readable preview.");
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const remaining = maxBytes - total;
    const chunk = value.subarray(0, remaining);
    chunks.push(chunk);
    total += chunk.byteLength;
    if (value.byteLength > remaining || total === maxBytes) {
      await reader.cancel();
      break;
    }
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function fetchPreviewResponse(url, maxBytes, expectedType) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`The site returned HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    if (!contentType.startsWith(expectedType)) {
      throw new Error(`The site did not provide a ${expectedType} preview.`);
    }
    const bytes = await readLimitedResponse(response, maxBytes);
    return { bytes, contentType, responseUrl: response.url };
  } finally {
    clearTimeout(timeout);
  }
}

async function forEachWithConcurrency(items, concurrency, callback) {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        await callback(items[index]);
      }
    }
  );
  await Promise.all(workers);
}

function hasVideoObject(value) {
  if (Array.isArray(value)) {
    return value.some(hasVideoObject);
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  if (types.some((type) => typeof type === "string" && /(?:^|[/#])videoobject$/i.test(type))) {
    return true;
  }
  return Object.values(value).some(hasVideoObject);
}

function getVideoObjectThumbnailUrls(value, thumbnails = []) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      getVideoObjectThumbnailUrls(entry, thumbnails);
    }
    return thumbnails;
  }
  if (!value || typeof value !== "object") {
    return thumbnails;
  }
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  if (types.some((type) => typeof type === "string" && /(?:^|[/#])videoobject$/i.test(type))) {
    const values = Array.isArray(value.thumbnailUrl) ? value.thumbnailUrl : [value.thumbnailUrl];
    for (const thumbnail of values) {
      if (typeof thumbnail === "string") {
        thumbnails.push(thumbnail);
      } else if (thumbnail && typeof thumbnail.url === "string") {
        thumbnails.push(thumbnail.url);
      }
    }
  }
  for (const entry of Object.values(value)) {
    getVideoObjectThumbnailUrls(entry, thumbnails);
  }
  return thumbnails;
}

function isIndividualVideoPage(document, pageUrl) {
  const openGraphType = document
    .querySelector('meta[property="og:type"]')
    ?.getAttribute("content")
    ?.trim()
    .toLowerCase();
  if (openGraphType?.startsWith("video.") || openGraphType === "video") {
    return true;
  }
  if (document.querySelector(
    'meta[property^="og:video"], meta[name="twitter:player"], meta[name="twitter:player:stream"]'
  )) {
    return true;
  }
  for (const script of document.querySelectorAll?.('script[type="application/ld+json"]') ?? []) {
    try {
      if (hasVideoObject(JSON.parse(script.textContent))) {
        return true;
      }
    } catch {
      continue;
    }
  }

  const url = new URL(pageUrl);
  const path = url.pathname.toLowerCase();
  const query = url.search.toLowerCase();
  const categorySegments = new Set([
    "categories", "category", "channels", "channel", "latest",
    "popular", "trending", "search", "tags", "tag", "hot", "top",
    "new", "recent", "featured", "recommended", "all", "browse"
  ]);
  if (/(?:^|\/)video-[a-z0-9_-]{4,}(?:\/|$)/i.test(path)) {
    return true;
  }
  if (/(?:^|\/)[a-z0-9_-]{5,}\/video\/?$/i.test(path)) {
    return true;
  }
  const videoRoute = path.match(/\/(?:watch|video|clip|movie)\/([^/]+)/i);
  if (videoRoute && videoRoute[1].length >= 5 && !categorySegments.has(videoRoute[1])) {
    return true;
  }
  const pluralVideoRoute = path.match(/\/(?:videos|clips|movies)\/([^/]+)/i);
  if (pluralVideoRoute &&
      pluralVideoRoute[1].length >= 8 &&
      /\d/.test(pluralVideoRoute[1]) &&
      !categorySegments.has(pluralVideoRoute[1])) {
    return true;
  }
  return /\/(?:video|clip|movie)[._-]?\d{4,}(?:\/|$)/i.test(path) ||
    /[?&](?:viewkey|video_id|videoid|watch|v)=([^&]{3,})/i.test(query) ||
    Boolean(document.querySelector(
      "video[src], video[poster], video[data-src], video source[src], video source[data-src]"
    ));
}

function findPageImageUrl(document, baseUrl) {
  const imageMetadata = [
    {
      selector: 'meta[property="og:image"], meta[property="og:image:url"], meta[property="og:image:secure_url"]',
      widthSelector: 'meta[property="og:image:width"]',
      heightSelector: 'meta[property="og:image:height"]'
    },
    {
      selector: 'meta[name="twitter:image"], meta[name="twitter:image:src"]',
      widthSelector: 'meta[name="twitter:image:width"]',
      heightSelector: 'meta[name="twitter:image:height"]'
    },
    {
      selector: 'meta[itemprop="thumbnailUrl"], meta[name="thumbnail"]',
      widthSelector: "",
      heightSelector: ""
    }
  ];
  const candidates = [];
  const addCandidate = (value, score = 0) => {
    if (!value) {
      return;
    }
    try {
      const imageUrl = getHistoryUrl(new URL(value, baseUrl).href);
      if (imageUrl) {
        candidates.push({ url: imageUrl.href, score });
      }
    } catch {
      return;
    }
  };
  for (const metadata of imageMetadata) {
    const width = Number(metadata.widthSelector
      ? document.querySelector(metadata.widthSelector)?.getAttribute("content")
      : 0);
    const height = Number(metadata.heightSelector
      ? document.querySelector(metadata.heightSelector)?.getAttribute("content")
      : 0);
    const declaredSize = Number.isFinite(width) && width > 0
      ? width * (Number.isFinite(height) && height > 0 ? height : 1)
      : 0;
    for (const meta of document.querySelectorAll(metadata.selector)) {
      const content = meta.getAttribute("content")?.trim();
      addCandidate(content, declaredSize);
    }
  }
  for (const video of document.querySelectorAll("video[poster]")) {
    addCandidate(video.getAttribute("poster"));
  }
  for (const link of document.querySelectorAll(
    'link[rel="image_src"][href], link[itemprop="thumbnailUrl"][href]'
  )) {
    addCandidate(link.getAttribute("href"));
  }
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      for (const thumbnail of getVideoObjectThumbnailUrls(JSON.parse(script.textContent))) {
        addCandidate(thumbnail);
      }
    } catch {
      continue;
    }
  }
  candidates.sort((left, right) => right.score - left.score);
  if (candidates.length > 0) {
    return candidates[0].url;
  }
  throw new Error("This page does not expose a supported preview image.");
}

function findPagePreviewImageUrl(html, baseUrl) {
  const document = new DOMParser().parseFromString(html, "text/html");
  return findPageImageUrl(document, baseUrl);
}

function findDirectVideoUrl(document, baseUrl) {
  const sources = document.querySelectorAll(
    "video[src], video source[src], video[data-src], video source[data-src]"
  );
  for (const source of sources) {
    const sourceValue = source.getAttribute("src") || source.getAttribute("data-src");
    if (!sourceValue) {
      continue;
    }
    try {
      const videoUrl = getHistoryUrl(new URL(sourceValue, baseUrl).href);
      if (!videoUrl || !isSafeVideoSourceUrl(videoUrl.href)) {
        continue;
      }
      const mediaType = source.getAttribute("type")?.split(";")[0].trim().toLowerCase() || "";
      const hasPlayableType = /^video\/(mp4|webm|ogg|x-m4v)$/.test(mediaType);
      const hasPlayableExtension = /\.(mp4|m4v|webm|ogv|ogg)$/i.test(videoUrl.pathname);
      if (hasPlayableType || hasPlayableExtension) {
        return videoUrl.href;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function findThumbnailUrl(html, baseUrl, onVideoPageDetected) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const isVideoPage = isIndividualVideoPage(document, baseUrl);
  const videoUrl = isVideoPage ? findDirectVideoUrl(document, baseUrl) : null;
  onVideoPageDetected(isVideoPage, videoUrl);
  if (!isVideoPage) {
    throw new Error("This page does not appear to be an individual video.");
  }
  return findPageImageUrl(document, baseUrl);
}

function showThumbnail(card, dataUrl, message) {
  const image = document.createElement("img");
  image.className = "history-thumbnail";
  image.alt = "";
  image.style.animationDelay = `${(Math.max(0, historyCards.indexOf(card)) % 8) * 40}ms`;
  image.src = dataUrl;
  card.imageFrame.replaceChildren(image);
  card.status.textContent = message;
  updateVisibleHistory();
}

function updateVisibleHistory() {
  if (historyVisibilityDeferred) {
    return;
  }
  let visibleCount = 0;
  let featuredCardAssigned = false;
  const filtersActive = hasActiveHistoryFilters();
  for (const card of historyCards) {
    const hasPoster = Boolean(card.imageFrame.querySelector("img"));
    const showPosterlessVideo = card.videoPage === true &&
      historyIncludeNoPreviewFilter.checked;
    const canDisplay = isVideoOnlyFilterEnabled()
      ? card.videoPage === true && (hasPoster || showPosterlessVideo)
      : hasPoster || showPosterlessVideo || (filtersActive && card.videoPage !== true);
    card.element.hidden = historyInitialBatchLoading || !canDisplay || visibleCount >= historyDisplayLimit;
    if (canDisplay && !card.element.hidden) {
      if (hasPoster) {
        card.element.classList.toggle("featured-history-card", !featuredCardAssigned);
        featuredCardAssigned = true;
      } else {
        card.element.classList.remove("featured-history-card");
      }
      visibleCount += 1;
    } else {
      card.element.classList.remove("featured-history-card");
    }
  }
  historyEmpty.hidden = historyInitialBatchLoading || visibleCount > 0;
  if (visibleCount === 0 && !historyInitialBatchLoading) {
    if (filtersActive && getFilteredHistoryItems().length === 0) {
      historyEmpty.textContent = historyHasMoreResults
        ? "No matches in loaded history. Select View more to search further back."
        : "No history matches these filters.";
    } else if (isVideoOnlyFilterEnabled()) {
      const candidates = getFilteredHistoryItems();
      const hasUnclassifiedItems = candidates.some((item) => typeof item.videoPage !== "boolean");
      const hasPosterlessVideo = historyCards.some((card) =>
        card.videoPage === true && !card.imageFrame.querySelector("img")
      );
      historyEmpty.textContent = candidates.length === 0 && !filtersActive
        ? "No recent website pages from your bookmarks were found."
        : hasUnclassifiedItems
          ? "Pages are still being checked for video content. Select Load previews to retry."
          : hasPosterlessVideo && !historyIncludeNoPreviewFilter.checked
            ? 'No previews are available for these videos. Enable "No preview" to include them.'
          : historyVisibleCount < candidates.length || historyHasMoreResults
            ? "No verified videos found yet. Select View more to check further history."
            : "No video pages match these filters.";
    } else {
      historyEmpty.textContent = historyCards.length === 0
        ? "No recent website pages from your bookmarks were found."
        : filtersActive
          ? "No matching pages were available to display."
          : "No recognized video pages with a usable poster were found on bookmarked websites.";
    }
  }
  updateHistoryFilterStatus();
  updateLoadMoreHistoryButton();
}

async function makePosterDataUrl(bytes, contentType) {
  const bitmap = await createImageBitmap(new Blob([bytes], { type: contentType }));
  try {
    if (bitmap.width > 8192 || bitmap.height > 8192) {
      throw new Error("The preview image is too large to resize safely.");
    }
    const scale = Math.min(960 / bitmap.width, 600 / bitmap.height, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Could not prepare the preview image.");
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
    if (dataUrl.length > MAX_POSTER_DATA_URL_LENGTH) {
      throw new Error("The resized preview is too large to save locally.");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

async function fetchPreviewImageDataUrl(imageUrl) {
  const { bytes, contentType } = await fetchPreviewResponse(imageUrl, MAX_IMAGE_BYTES, "image/");
  if (!["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    throw new Error("The preview is not a supported image format.");
  }
  return makePosterDataUrl(bytes, contentType);
}

function setHistoryApprovalStatus(message) {
  const statusMessage = document.createElement("span");
  statusMessage.className = "image-host-approval-status";
  statusMessage.textContent = message;
  historyStatus.replaceChildren(statusMessage);
}

async function loadThumbnail(card) {
  const dataUrl = await fetchPreviewImageDataUrl(card.imageUrl);
  showThumbnail(card, dataUrl, `Preview from ${new URL(card.imageUrl).hostname}.`);
  card.posterDataUrl = dataUrl;
  card.posterVersion = POSTER_QUALITY_VERSION;
}

function needsPagePreviewCheck(card) {
  const hasPoster = Boolean(card.imageFrame.querySelector("img"));
  return card.videoPage !== false &&
    !getFreshPreviewMetadata(card.item.url) &&
    (card.posterVersion < POSTER_QUALITY_VERSION || !hasPoster);
}

function needsThumbnailLoad(card) {
  return card.videoPage === true &&
    Boolean(card.imageUrl) &&
    (card.posterVersion < POSTER_QUALITY_VERSION || !card.imageFrame.querySelector("img"));
}

async function loadPagePreviews(cards = historyCards, prioritizedUrls = []) {
  const cardsToCheck = cards.filter(needsPagePreviewCheck);
  const permittedCards = [];
  let pagesWithoutPermission = 0;
  for (const card of cardsToCheck) {
    if (await hasOriginPermission(card.item.url)) {
      permittedCards.push(card);
    } else {
      pagesWithoutPermission += 1;
    }
  }

  if (permittedCards.length > 0 && !historyFillInProgress) {
    historyStatus.textContent = "Checking recent pages for preview images…";
  }
  let metadataChanged = false;
  await forEachWithConcurrency(permittedCards, 3, async (card) => {
    card.status.textContent = "Checking page…";
    try {
      const response = await fetchPreviewResponse(card.item.url, MAX_HTML_BYTES, "text/html");
      const html = new TextDecoder().decode(response.bytes);
      const imageUrl = findThumbnailUrl(
        html,
        response.responseUrl || card.item.url,
        (isVideoPage, videoUrl) => {
          card.videoPage = isVideoPage;
          card.item.videoPage = isVideoPage;
          card.videoUrl = videoUrl;
          card.metadataCheckedAt = Date.now();
          previewMetadataCache[card.item.url] = {
            videoPage: isVideoPage,
            imageUrl: null,
            checkedAt: card.metadataCheckedAt,
            classificationVersion: PREVIEW_CLASSIFICATION_VERSION,
            videoUrl,
            videoCheckedAt: card.metadataCheckedAt
          };
          metadataChanged = true;
          updateHistoryFilterOptions();
          updateHistoryFilterStatus();
          updateVisibleHistory();
        }
      );
      card.imageUrl = imageUrl;
      const metadata = previewMetadataCache[card.item.url];
      if (metadata?.checkedAt === card.metadataCheckedAt) {
        metadata.imageUrl = card.imageUrl;
      }
      card.status.textContent = "Preview found.";
    } catch (error) {
      card.status.textContent = `No preview: ${error.message}`;
    }
  });
  if (metadataChanged) {
    await savePreviewMetadataCache();
  }

  const availableCards = cards.filter(needsThumbnailLoad);
  const permittedImageCards = [];
  let imagesWithoutPermission = 0;
  for (const card of availableCards) {
    if (new URL(card.imageUrl).origin === new URL(card.item.url).origin ||
        await hasOriginPermission(card.imageUrl)) {
      permittedImageCards.push(card);
    } else {
      imagesWithoutPermission += 1;
    }
  }
  if (permittedImageCards.length > 0) {
    await loadAvailableThumbnails(permittedImageCards, prioritizedUrls);
  }
  renderFavoriteSiteVideos();
  renderRandomVideoSection();

  const permissionNeeded = pagesWithoutPermission > 0 || imagesWithoutPermission > 0;
  if (permissionNeeded) {
    previewPhase = "pages";
    loadPreviewsButton.disabled = false;
    loadPreviewsButton.textContent = "Load previews";
    const missingAccess = [];
    if (pagesWithoutPermission > 0) {
      missingAccess.push(`${pagesWithoutPermission} page site${pagesWithoutPermission === 1 ? "" : "s"}`);
    }
    if (imagesWithoutPermission > 0) {
      missingAccess.push(`${imagesWithoutPermission} image host${imagesWithoutPermission === 1 ? "" : "s"}`);
    }
    setHistoryApprovalStatus(
      `${missingAccess.join(" and ")} need access. Select Allow all sites above to load them automatically.`
    );
  } else if (cards.some(needsPagePreviewCheck) || cards.some(needsThumbnailLoad)) {
    previewPhase = "pages";
    loadPreviewsButton.disabled = false;
    loadPreviewsButton.textContent = "Try again";
  } else {
    historyStatus.textContent = "";
    previewPhase = "done";
    updatePreviewLoadButton();
  }
  return !permissionNeeded;
}

async function loadAvailableThumbnails(cards, prioritizedUrls = []) {
  if (!historyFillInProgress) {
    historyStatus.textContent = "Loading available thumbnails…";
  }
  await forEachWithConcurrency(cards, 3, async (card) => {
    card.status.textContent = "Loading preview…";
    try {
      await loadThumbnail(card);
    } catch (error) {
      card.status.textContent = `Could not load image: ${error.message}`;
    }
  });

  const loadedCount = cards.filter((card) => card.posterDataUrl).length;
  const completeCount = cards.filter((card) =>
    card.posterVersion === POSTER_QUALITY_VERSION && card.imageFrame.querySelector("img")
  ).length;
  const nextCache = { ...previewCache };
  for (const card of cards) {
    if (card.posterDataUrl) {
      nextCache[card.item.url] = {
        dataUrl: card.posterDataUrl,
        imageHost: new URL(card.imageUrl).hostname,
        videoPage: true,
        posterVersion: POSTER_QUALITY_VERSION
      };
    }
  }
  const trimmedCache = trimPreviewCache(nextCache, historyItems, prioritizedUrls);
  let savedLocally = true;
  if (loadedCount > 0) {
    previewCache = trimmedCache;
    try {
      await browser.storage.local.set({ previewCache: trimmedCache });
    } catch (error) {
      savedLocally = false;
      historyStatus.textContent = `Previews are showing, but could not save them for next time: ${error.message}`;
    }
  }
  if (completeCount === cards.length && savedLocally) {
    previewPhase = "done";
    loadPreviewsButton.disabled = true;
    loadPreviewsButton.textContent = "Posters saved";
    historyInfoStatus.textContent = `Loaded and saved ${loadedCount} preview${loadedCount === 1 ? "" : "s"}.`;
  } else {
    previewPhase = "pages";
    loadPreviewsButton.disabled = false;
    loadPreviewsButton.textContent = "Retry previews";
    if (savedLocally) {
      historyInfoStatus.textContent = `Loaded ${loadedCount} of ${cards.length} available previews.`;
    }
  }
  if (!historyFillInProgress && historyStatus.textContent === "Loading available thumbnails…") {
    historyStatus.textContent = "";
  }
}

async function loadBookmarks() {
  cancelFavoriteSiteRowTransition();
  bookmarkStatus.textContent = "Reading your Firefox bookmarks…";
  favoriteSiteHistoryReady = false;
  favoriteSiteHistoryLoadVersion += 1;
  const [tree, saved] = await Promise.all([
    withTimeout(
      browser.bookmarks.getTree(),
      BOOKMARKS_TIMEOUT_MS,
      "Firefox bookmarks did not respond within 5 seconds."
    ),
    browser.storage.local.get([
      "bookmarkFolderIds",
      "bookmarkFolderId",
      "favoriteSiteHostname",
      "faviconCache",
      "shortcutPreferences",
      "continueSectionCollapsed",
      "dashboardSectionOrder"
    ])
  ]);
  applyDashboardSectionOrder(saved.dashboardSectionOrder);
  manageDashboardSectionsButton.disabled = false;
  shortcutPreferences = saved.shortcutPreferences &&
    typeof saved.shortcutPreferences === "object" &&
    !Array.isArray(saved.shortcutPreferences)
    ? saved.shortcutPreferences
    : {};
  continueSectionCollapsed = saved.continueSectionCollapsed === true;
  updateContinueSection();
  const savedFavicons = saved.faviconCache && typeof saved.faviconCache === "object" && !Array.isArray(saved.faviconCache)
    ? saved.faviconCache
    : {};
  faviconCache = {};
  for (const [origin, dataUrl] of Object.entries(savedFavicons)) {
    try {
      if (new URL(origin).origin === origin &&
          typeof dataUrl === "string" &&
          dataUrl.startsWith("data:image/png;base64,") &&
          dataUrl.length <= 30_000) {
        faviconCache[origin] = dataUrl;
      }
    } catch {
      continue;
    }
  }
  const savedFaviconOrigins = Object.keys(faviconCache);
  if (savedFaviconOrigins.length > MAX_FAVICON_CACHE) {
    for (const staleOrigin of savedFaviconOrigins.slice(0, savedFaviconOrigins.length - MAX_FAVICON_CACHE)) {
      delete faviconCache[staleOrigin];
    }
  }
  const root = tree[0];
  if (!root || !Array.isArray(root.children)) {
    throw new Error("Firefox did not return a bookmarks folder tree.");
  }

  bookmarkFolders = getBookmarkFolders(root);
  const hasSavedFolderIds = Array.isArray(saved.bookmarkFolderIds);
  const savedFolderIds = hasSavedFolderIds
    ? saved.bookmarkFolderIds
    : typeof saved.bookmarkFolderId === "string" ? [saved.bookmarkFolderId] : [];
  const validSavedFolderIds = [...new Set(savedFolderIds.filter((id) =>
    typeof id === "string" && bookmarkFolders.some((folder) => folder.id === id)
  ))];
  selectedBookmarkFolderId = validSavedFolderIds[validSavedFolderIds.length - 1] ?? "";
  const toolbarRoot = root.children.find((folder) => folder.id === "toolbar_____") ?? root.children[1];
  const defaultFolder = bookmarkFolders.find((folder) => folder.id === toolbarRoot?.id) ?? bookmarkFolders[0];
  if (!selectedBookmarkFolderId && defaultFolder) {
    selectedBookmarkFolderId = defaultFolder.id;
  }
  const selectedFolderIds = selectedBookmarkFolderId ? [selectedBookmarkFolderId] : [];
  if (!hasSavedFolderIds ||
      JSON.stringify(saved.bookmarkFolderIds) !== JSON.stringify(selectedFolderIds)) {
    await browser.storage.local.set({ bookmarkFolderIds: selectedFolderIds });
  }
  renderBookmarkFolders();
  const selectedFolder = selectedBookmarkFolderId
    ? findBookmarkFolder(root, selectedBookmarkFolderId)
    : null;
  bookmarkGroups = selectedFolder ? [getBookmarkGroup(selectedFolder)] : [];
  bookmarkedSites = getBookmarkedSites(bookmarkGroups.flatMap((group) => group.items));
  const allFavoriteBookmarkItems = bookmarkFolders.flatMap((folder) => {
    const node = findBookmarkFolder(root, folder.id);
    return node ? getBookmarkGroup(node).items : [];
  });
  favoriteBookmarkedSites = getBookmarkedSites(allFavoriteBookmarkItems);
  selectedFavoriteSiteHostname = typeof saved.favoriteSiteHostname === "string" &&
    favoriteBookmarkedSites.has(saved.favoriteSiteHostname)
    ? saved.favoriteSiteHostname
    : "";
  if (saved.favoriteSiteHostname !== selectedFavoriteSiteHostname) {
    await browser.storage.local.set({ favoriteSiteHostname: selectedFavoriteSiteHostname });
  }
  renderFavoriteSiteOptions();
  favoriteSiteRowIndex = 0;
  favoriteSiteRows = [];
  favoriteSitePreviewAttempts.clear();
  favoriteSiteHistoryLoadVersion += 1;
  favoriteSiteHistoryItems = [];
  favoriteSiteStatus.textContent = "";
  const allowedHistoryItems = historyItems.filter((item) => isBookmarkedWebsite(item.url));
  const historyItemsChanged = allowedHistoryItems.length !== historyItems.length ||
    allowedHistoryItems.some((item, index) => item.url !== historyItems[index]?.url);
  renderFavoriteHistory(allowedHistoryItems);
  if (historyItemsChanged) {
    renderHistory(allowedHistoryItems);
  }
  renderFavoriteSiteVideos();
  renderBookmarks(bookmarkGroups);
  bookmarkStatus.textContent = "";
}

function scheduleBookmarkRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    loadBookmarks()
      .then(loadHistoryAfterBookmarks)
      .catch((error) => {
        showBookmarkLoadError(error);
      });
  }, 100);
}

function scheduleHistoryReconciliation() {
  historySnapshotNeedsRefresh = true;
  clearTimeout(historyRefreshTimer);
  historyRefreshTimer = setTimeout(() => {
    if (historyInitialBatchLoading || historyFillInProgress) {
      scheduleHistoryReconciliation();
      return;
    }
    browser.storage.local.set({ historySnapshotNeedsRefresh: true })
      .catch((error) => {
        historyStatus.textContent = `Could not mark changed history for refresh: ${error.message}`;
      })
      .then(loadHistoryAfterBookmarks);
  }, 100);
}

discreetModeToggleButton.addEventListener("click", async () => {
  discreetModeToggleButton.disabled = true;
  historyStatus.textContent = "";
  try {
    await setDiscreetCover(true);
  } catch (error) {
    historyStatus.textContent = `Could not cover Joydash: ${error.message}`;
  } finally {
    discreetModeToggleButton.disabled = false;
  }
});

revealDiscreetCoverButton.addEventListener("click", async () => {
  revealDiscreetCoverButton.disabled = true;
  try {
    await setDiscreetCover(false);
  } catch (error) {
    discreetCoverStatus.textContent = `Could not reveal Joydash: ${error.message}`;
  } finally {
    revealDiscreetCoverButton.disabled = false;
  }
});

disableDiscreetModeButton.addEventListener("click", async () => {
  disableDiscreetModeButton.disabled = true;
  try {
    await setDiscreetModeEnabled(false);
    document.querySelector("#discreet-mode-settings summary").focus();
  } catch (error) {
    discreetCoverStatus.textContent = `Could not disable discreet mode: ${error.message}`;
  } finally {
    disableDiscreetModeButton.disabled = false;
  }
});

discreetModeEnabledCheckbox.addEventListener("change", async () => {
  discreetModeEnabledCheckbox.disabled = true;
  try {
    await setDiscreetModeEnabled(discreetModeEnabledCheckbox.checked);
  } catch (error) {
    discreetModeEnabledCheckbox.checked = discreetModeEnabled;
    historyStatus.textContent = `Could not update discreet mode: ${error.message}`;
  } finally {
    discreetModeEnabledCheckbox.disabled = false;
  }
});

bookmarkFolderSelect.addEventListener("change", async () => {
  const folderId = bookmarkFolderSelect.value;
  if (!folderId || folderId === selectedBookmarkFolderId) {
    return;
  }
  bookmarkFolderSelect.disabled = true;
  try {
    await browser.storage.local.set({ bookmarkFolderIds: [folderId] });
    await loadBookmarks();
    await loadHistoryAfterBookmarks();
  } catch (error) {
    bookmarkStatus.textContent = `Could not save folder: ${error.message}`;
    renderBookmarkFolders();
  }
});

favoriteSiteSelect.addEventListener("change", async () => {
  const hostname = favoriteSiteSelect.value;
  if (hostname === selectedFavoriteSiteHostname ||
      (hostname && !favoriteBookmarkedSites.has(hostname))) {
    return;
  }
  cancelFavoriteSiteRowTransition();
  const previousHostname = selectedFavoriteSiteHostname;
  selectedFavoriteSiteHostname = hostname;
  favoriteSiteRowIndex = 0;
  favoriteSiteSelect.disabled = true;
  try {
    await browser.storage.local.set({ favoriteSiteHostname: hostname });
    favoriteSiteStatus.textContent = "";
    renderFavoriteSiteVideos();
  } catch (error) {
    selectedFavoriteSiteHostname = previousHostname;
    favoriteSiteStatus.textContent = `Could not save the selected site: ${error.message}`;
    renderFavoriteSiteOptions();
    renderFavoriteSiteVideos();
  } finally {
    favoriteSiteSelect.disabled = favoriteBookmarkedSites.size === 0;
  }
});

favoriteSitePreviousRowButton.addEventListener("click", () => {
  navigateFavoriteSiteRow(-1);
});

favoriteSiteNextRowButton.addEventListener("click", () => {
  navigateFavoriteSiteRow(1);
});

randomVideoBackButton.addEventListener("click", () => {
  navigateRandomVideo("back");
});

randomVideoForwardButton.addEventListener("click", () => {
  navigateRandomVideo("forward");
});

manageShortcutsButton.addEventListener("click", () => {
  manageShortcuts = !manageShortcuts;
  renderBookmarks(bookmarkGroups);
});

manageDashboardSectionsButton.addEventListener("click", () => {
  const isExpanded = manageDashboardSectionsButton.getAttribute("aria-expanded") === "true";
  manageDashboardSectionsButton.setAttribute("aria-expanded", String(!isExpanded));
  dashboardSectionArranger.hidden = isExpanded;
  if (!isExpanded) {
    dashboardSectionOrderStatus.textContent = hasDashboardSectionOrderChanges()
      ? "Unsaved order changes."
      : "";
    renderDashboardSectionOrderList();
  }
  document.querySelector("#dashboard-settings").open = false;
});

homeButtonEnabledCheckbox.addEventListener("change", async () => {
  const enabled = homeButtonEnabledCheckbox.checked;
  homeButtonEnabledCheckbox.disabled = true;
  try {
    await browser.storage.local.set({ showHomeButton: enabled });
  } catch (error) {
    homeButtonEnabledCheckbox.checked = !enabled;
    historyStatus.textContent = `Could not save Home button setting: ${error.message}`;
  } finally {
    homeButtonEnabledCheckbox.disabled = false;
  }
});

saveDashboardSectionOrderButton.addEventListener("click", async () => {
  const order = [...dashboardSectionOrderList.children]
    .map((item) => item.dataset.dashboardSection);
  await saveDashboardSectionOrder(order);
});

function closeDashboardTabsAfterLinkOpen(event) {
  const isPrimaryClick = event.type === "click" && event.button === 0;
  const isMiddleClick = event.type === "auxclick" && event.button === 1;
  if ((!isPrimaryClick && !isMiddleClick) || event.defaultPrevented) {
    return;
  }
  const link = event.target.closest("a[href]");
  if (!link || link.target.toLowerCase() !== "_blank" || link.hasAttribute("download")) {
    return;
  }
  const url = new URL(link.href);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }
  window.setTimeout(() => {
    browser.runtime.sendMessage({ type: "joydash:close-dashboard-tabs" })
      .catch((error) => console.error("Could not close Joydash tabs:", error));
  }, 0);
}

document.addEventListener("click", closeDashboardTabsAfterLinkOpen);
document.addEventListener("auxclick", closeDashboardTabsAfterLinkOpen);

dashboardSectionOrderList.addEventListener("pointerdown", (event) => {
  const item = event.target.closest(".dashboard-section-order-item");
  if (dashboardSectionOrderSaving ||
      event.button !== 0 ||
      !item ||
      event.target.closest("button")) {
    return;
  }
  dashboardSectionPointerDrag = {
    item,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
  };
  dashboardSectionOrderList.setPointerCapture(event.pointerId);
});

document.addEventListener("pointermove", (event) => {
  const drag = dashboardSectionPointerDrag;
  if (!drag || event.pointerId !== drag.pointerId || dashboardSectionOrderSaving) {
    return;
  }

  if (!drag.active) {
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance < 5) {
      return;
    }
    drag.active = true;
    drag.item.classList.add("is-dragging");
  }

  event.preventDefault();
  const listBounds = dashboardSectionOrderList.getBoundingClientRect();
  if (event.clientY < listBounds.top || event.clientY > listBounds.bottom) {
    return;
  }
  const currentItems = [...dashboardSectionOrderList.children];
  const currentIndex = currentItems.indexOf(drag.item);
  const otherItems = currentItems.filter((item) => item !== drag.item);
  const nextIndex = otherItems.findIndex((item) => {
    const bounds = item.getBoundingClientRect();
    return event.clientY < bounds.top + bounds.height / 2;
  });
  const destinationIndex = nextIndex < 0 ? otherItems.length : nextIndex;
  if (destinationIndex === currentIndex) {
    return;
  }

  const affectedItems = otherItems.slice(
    Math.min(currentIndex, destinationIndex),
    Math.max(currentIndex, destinationIndex)
  );
  for (const sectionItem of affectedItems) {
    for (const animation of sectionItem.getAnimations()) {
      animation.cancel();
    }
  }
  const previousTops = new Map(
    affectedItems.map((sectionItem) => [sectionItem, sectionItem.getBoundingClientRect().top])
  );
  dashboardSectionOrderList.insertBefore(drag.item, otherItems[destinationIndex] ?? null);
  if (reducedMotionPreference.matches) {
    return;
  }
  for (const sectionItem of affectedItems) {
    const offset = previousTops.get(sectionItem) - sectionItem.getBoundingClientRect().top;
    if (offset !== 0) {
      sectionItem.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: "translateY(0)" }],
        { duration: 110, easing: "ease-out" }
      );
    }
  }
});

document.addEventListener("pointerup", (event) => {
  const drag = dashboardSectionPointerDrag;
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }
  dashboardSectionPointerDrag = null;
  if (!drag.active) {
    return;
  }
  event.preventDefault();
  drag.item.classList.remove("is-dragging");
  setDashboardSectionOrderDraft([...dashboardSectionOrderList.children]
    .map((item) => item.dataset.dashboardSection));
});

document.addEventListener("pointercancel", (event) => {
  const drag = dashboardSectionPointerDrag;
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }
  dashboardSectionPointerDrag = null;
  drag.item.classList.remove("is-dragging");
  if (drag.active) {
    renderDashboardSectionOrderList();
  }
});

toggleContinueSectionButton.addEventListener("click", async () => {
  const nextCollapsed = !continueSectionCollapsed;
  toggleContinueSectionButton.disabled = true;
  try {
    await browser.storage.local.set({ continueSectionCollapsed: nextCollapsed });
    continueSectionCollapsed = nextCollapsed;
    updateContinueSection();
  } catch (error) {
    historyStatus.textContent = `Could not save dashboard layout: ${error.message}`;
  } finally {
    toggleContinueSectionButton.disabled = false;
  }
});

enableAutomaticPreviewsButton.addEventListener("click", async () => {
  enableAutomaticPreviewsButton.disabled = true;
  try {
    historyStatus.textContent = "Requesting access to all websites…";
    const granted = await browser.permissions.request({
      origins: ["<all_urls>"]
    });
    if (!granted) {
      historyStatus.textContent = "All-sites access was not granted; no new previews were requested.";
      return;
    }
    allSitesPermissionGranted = true;
    enableAutomaticPreviewsButton.hidden = true;
    await loadHistoryAfterBookmarks();
  } catch (error) {
    historyStatus.textContent = `Could not enable automatic previews: ${error.message}`;
  } finally {
    enableAutomaticPreviewsButton.disabled = enableAutomaticPreviewsButton.hidden;
  }
});

clearPreviewsButton.addEventListener("click", async () => {
  const savedPreviewCount = Object.keys(previewCache).length;
  if (savedPreviewCount === 0) {
    historyStatus.textContent = "There is no saved poster art to clear.";
    return;
  }
  const confirmed = window.confirm(
    `Clear ${savedPreviewCount} saved poster${savedPreviewCount === 1 ? "" : "s"} from this device?`
  );
  if (!confirmed) {
    return;
  }
  clearPreviewsButton.disabled = true;
  try {
    await browser.storage.local.set({ previewCache: {} });
    previewCache = {};
    randomVideoExploredUrls.clear();
    for (const card of historyCards) {
      card.posterDataUrl = null;
      card.posterVersion = 0;
      card.status.textContent = "";
      card.element.hidden = true;
      setHistoryPlaceholder(
        card.imageFrame,
        hasActiveHistoryFilters() || isVideoOnlyFilterEnabled() ? "Preview not loaded" : "Your next favorite"
      );
    }
    updateVisibleHistory();
    renderFavoriteSiteVideos();
    renderRandomVideoSection();
    historyStatus.textContent = "Saved poster art cleared from this device.";
    updatePreviewLoadButton();
    previewPhase = loadPreviewsButton.disabled ? "done" : "pages";
  } catch (error) {
    historyStatus.textContent = `Could not clear saved poster art: ${error.message}`;
  } finally {
    clearPreviewsButton.disabled = false;
  }
});

historySearchInput.addEventListener("input", scheduleHistoryFilterApply);
clearHistorySearchButton.addEventListener("click", () => {
  historySearchInput.value = "";
  scheduleHistoryFilterApply();
  historySearchInput.focus();
});
historySiteFilter.addEventListener("change", scheduleHistoryFilterApply);
historyDateFilter.addEventListener("change", scheduleHistoryFilterApply);
historyVideoOnlyFilter.addEventListener("change", scheduleHistoryFilterApply);
historyIncludeNoPreviewFilter.addEventListener("change", scheduleHistoryFilterApply);
resetHistoryFiltersButton.addEventListener("click", () => {
  historySearchInput.value = "";
  historySiteFilter.value = "";
  historyDateFilter.value = "";
  historyVideoOnlyFilter.checked = true;
  historyIncludeNoPreviewFilter.checked = false;
  scheduleHistoryFilterApply();
});
updateHistoryFilterControls();

loadMoreHistoryButton.addEventListener("click", async () => {
  if (historyFillInProgress || loadMoreHistoryButton.hidden) {
    return;
  }
  const wasVisibilityDeferred = historyVisibilityDeferred;
  historyVisibilityDeferred = true;
  document.documentElement.classList.add("history-pagination-loading");
  loadMoreHistoryButton.disabled = true;
  historyDisplayLimit += getMoreHistoryBatchSize();
  try {
    await fillHistoryBatch(historyDisplayLimit);
  } catch (error) {
    historyStatus.textContent = `Could not load previews: ${error.message}`;
  } finally {
    historyVisibilityDeferred = wasVisibilityDeferred;
    document.documentElement.classList.remove("history-pagination-loading");
    if (!historyVisibilityDeferred) {
      updateVisibleHistory();
    }
    updateLoadMoreHistoryButton();
  }
});

showLessHistoryButton.addEventListener("click", () => {
  if (historyFillInProgress || historyDisplayLimit <= getHistoryBatchSize()) {
    return;
  }
  historyDisplayLimit = getHistoryBatchSize();
  updateVisibleHistory();
});

loadPreviewsButton.addEventListener("click", async () => {
  if (historyFillInProgress) {
    return;
  }
  const wasVisibilityDeferred = historyVisibilityDeferred;
  historyVisibilityDeferred = true;
  historyFilterControlsBusy = true;
  updateHistoryFilterControls();
  loadPreviewsButton.disabled = true;
  try {
    await loadPagePreviews();
    await fillHistoryBatch(historyDisplayLimit);
  } catch (error) {
    historyStatus.textContent = `Could not load previews: ${error.message}`;
  } finally {
    historyVisibilityDeferred = wasVisibilityDeferred;
    historyFilterControlsBusy = false;
    updateHistoryFilterControls();
    if (!historyVisibilityDeferred) {
      updateVisibleHistory();
    }
    if (previewPhase !== "done") {
      loadPreviewsButton.disabled = historyCards.length === 0;
    }
  }
});

browser.permissions?.onAdded?.addListener(refreshAutomaticPreviewsButton);
browser.permissions?.onRemoved?.addListener(refreshAutomaticPreviewsButton);
document.addEventListener("visibilitychange", () => {
  updateRandomVideoVisibility();
  if (!document.hidden && !favoriteSiteVideosSection.hidden) {
    observeFavoriteSiteVideoSection();
    if (favoriteSiteVideosAreVisible) {
      void scanFavoriteSitePreviews();
    }
  }
});
reducedMotionPreference.addEventListener("change", handleReducedMotionChange);
updateHistoryRailDateTime();
refreshAutomaticPreviewsButton();
browser.bookmarks?.onCreated?.addListener(scheduleBookmarkRefresh);
browser.bookmarks?.onChanged?.addListener(scheduleBookmarkRefresh);
browser.bookmarks?.onMoved?.addListener(scheduleBookmarkRefresh);
browser.bookmarks?.onRemoved?.addListener(scheduleBookmarkRefresh);
browser.bookmarks?.onChildrenReordered?.addListener(scheduleBookmarkRefresh);
browser.history?.onVisitRemoved?.addListener(scheduleHistoryReconciliation);
initializeDiscreetMode()
  .then(loadBookmarks)
  .then(loadHistoryAfterBookmarks)
  .catch((error) => {
    if (!discreetModeInitialized) {
      discreetCoverStatus.textContent = `Could not initialize discreet mode: ${error.message}`;
      revealDiscreetCoverButton.hidden = false;
      return;
    }
    showBookmarkLoadError(error);
    if (discreetCoverActive) {
      discreetCoverStatus.textContent = `Bookmarks unavailable: ${error.message}`;
    }
  });
