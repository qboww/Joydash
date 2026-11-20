import { createDiscreetModeController } from "./controllers/discreetModeController.js";
import { createDashboardSectionController } from "./controllers/dashboardSectionController.js";
import { createHistoryFilterController } from "./controllers/historyFilterController.js";
import { createHistoryHoverPreviewController } from "./controllers/historyHoverPreviewController.js";
import { createPreviewPageParser } from "./services/previewPageParser.js";
import {
  fetchPreviewResponse,
  forEachWithConcurrency
} from "./services/previewRequests.js";

const { findPagePreviewImageUrl, findDirectVideoUrl, findThumbnailUrl } =
  createPreviewPageParser({ getHistoryUrl, isSafeVideoSourceUrl });

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const bookmarkFolderSelect = document.querySelector("#bookmark-folder");
const bookmarkStatus = document.querySelector("#bookmark-status");
const bookmarkGrid = document.querySelector("#bookmark-grid");
const bookmarkEmpty = document.querySelector("#bookmark-empty");
const manageShortcutsButton = document.querySelector("#manage-shortcuts");
const manageShortcutsLabel = manageShortcutsButton.querySelector("[data-shortcut-label]");
const manageShortcutsIcon = manageShortcutsButton.querySelector(".ui-icon");
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
const homeButtonEnabledCheckbox = document.querySelector("#show-home-button");
const dashboardSectionStack = document.querySelector("#dashboard-section-stack");
const randomVideoSection = document.querySelector("#random-video-section");
const randomVideoBackButton = document.querySelector("#random-video-back");
const randomVideoForwardButton = document.querySelector("#random-video-forward");
const videoPlaylistsSection = document.querySelector("#video-playlists-section");
const videoPlaylistSelect = document.querySelector("#video-playlist-select");
const createVideoPlaylistForm = document.querySelector("#create-video-playlist-form");
const newVideoPlaylistNameInput = document.querySelector("#new-video-playlist-name");
const deleteVideoPlaylistButton = document.querySelector("#delete-video-playlist");
const videoPlaylistStatus = document.querySelector("#video-playlist-status");
const videoPlaylistGrid = document.querySelector("#video-playlist-grid");
const videoPlaylistEmpty = document.querySelector("#video-playlist-empty");
const loadMissingVideoPlaylistPreviewsButton = document.querySelector(
  "#load-missing-video-playlist-previews"
);
const loadMoreVideoPlaylistButton = document.querySelector("#load-more-video-playlist");
const showLessVideoPlaylistButton = document.querySelector("#show-less-video-playlist");
const addToPlaylistDialog = document.querySelector("#add-to-playlist-dialog");
const addToPlaylistForm = document.querySelector("#add-to-playlist-form");
const addToPlaylistItemTitle = document.querySelector("#add-to-playlist-item-title");
const addToPlaylistSelect = document.querySelector("#add-to-playlist-select");
const addToPlaylistStatus = document.querySelector("#add-to-playlist-status");
const cancelAddToPlaylistButton = document.querySelector("#cancel-add-to-playlist");
const randomVideoSlots = [1, 2].map((slotNumber) => {
  const player = document.querySelector(`#random-video-player-${slotNumber}`);
  const element = player.closest(".random-video-slot");
  return {
    element,
    link: element.querySelector(".random-video-slot-link"),
    addButton: element.querySelector(".random-video-playlist-add"),
    deleteButton: element.querySelector(".random-video-history-delete"),
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
const historyHoverPreviewSaveButton = document.querySelector("#history-hover-preview-save");
const historyHoverPreviewDeleteButton = document.querySelector("#history-hover-preview-delete");
const clearPreviewsButton = document.querySelector("#clear-previews");
const loadPreviewsButton = document.querySelector("#load-previews");

let bookmarkFolders = [];
let selectedBookmarkFolderId = "";
let allSitesPermissionGranted = false;
let bookmarkGroups = [];
let bookmarkedSites = new Map();
let bookmarkRedirectAliases = {};
const redirectRepairPromises = new Map();
const redirectedBookmarkIds = new Set();
let bookmarkAliasUpdateQueue = Promise.resolve();
let automaticSectionsDataReady = false;
let automaticSectionsInitialRevealComplete = false;
let automaticSectionRevealInProgress = false;
let automaticSectionsRevealed = new Set();
let shortcutPreferences = {};
let manageShortcuts = false;
let draggedShortcut = null;
let continueSectionCollapsed = false;
let historyGroupLimits = new Map();
let bookmarkIconsLoading = false;
let faviconCache = {};
let historyCards = [];
let historyCardAnimationStartIndex = null;
let historyItems = [];
let historyVisibleCount = 0;
let historyDisplayLimit = 0;
let historyFilterControlsBusy = false;
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
const DEFAULT_VIDEO_PLAYLIST_ID = "watch-later";
let videoPlaylists = [{ id: DEFAULT_VIDEO_PLAYLIST_ID, name: "Watch later", items: [] }];
let selectedVideoPlaylistId = DEFAULT_VIDEO_PLAYLIST_ID;
let videoPlaylistDisplayLimit = 0;
let videoPlaylistAnimationStartIndex = null;
let videoPlaylistStatusTimer = null;
let videoPlaylistPosterRecoveryInProgress = false;
let videoPlaylistPreviewDataReady = false;
let videoPlaylistSectionVisible = false;
let videoPlaylistObserver = null;
let videoPlaylistAutoRecoveryKey = "";
let videoPlaylistAutoRecoveryAttemptedUrls = new Set();
let videoPlaylistSessionPosters = new Map();
let previewCacheClearVersion = 0;
let previewCacheClearedByUser = false;
let pendingVideoPlaylistItem = null;
let historySnapshot = null;
let historySnapshotNeedsRefresh = false;
const pendingHistoryDeleteUrls = new Set();
const pendingHistoryDeleteTimers = new Map();
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
let randomVideoBackHistory = [];
let randomVideoForwardHistory = [];
let randomVideoClickedUrls = new Set();
const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let previewPhase = "pages";
let refreshTimer;
let historyRefreshTimer;
const MAX_HISTORY_RESULTS = 500;
const MAX_REDIRECT_HISTORY_CANDIDATES = 12;
const MAX_REDIRECT_HISTORY_SEARCH_RESULTS = 5_000;
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
const SECTION_LOADING_STATUS_DELAY_MS = 2_000;
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

const discreetMode = createDiscreetModeController({
  browser,
  document,
  dashboardPage: document.querySelector(".page"),
  historyHoverPreview,
  toggleButton: document.querySelector("#toggle-discreet-mode"),
  enabledCheckbox: document.querySelector("#discreet-mode-enabled"),
  favoritePagesCheckbox: document.querySelector("#cover-favorite-pages-enabled"),
  contextSelect: document.querySelector("#discreet-mode-context"),
  cover: document.querySelector("#discreet-cover"),
  status: document.querySelector("#discreet-cover-status"),
  homeButtonCheckbox: homeButtonEnabledCheckbox,
  historyStatus,
  onCoverChange: updateRandomVideoPlayback
});

const dashboardSections = createDashboardSectionController({
  browser,
  document,
  stack: dashboardSectionStack,
  arranger: document.querySelector("#dashboard-section-arranger"),
  list: document.querySelector("#dashboard-section-order-list"),
  status: document.querySelector("#dashboard-section-order-status"),
  manageButton: document.querySelector("#manage-dashboard-sections"),
  closeButton: document.querySelector("#close-dashboard-section-arranger"),
  saveButton: document.querySelector("#save-dashboard-section-order"),
  settings: document.querySelector("#dashboard-settings"),
  reducedMotionPreference
});

const historyFilters = createHistoryFilterController({
  document,
  searchInput: historySearchInput,
  clearSearchButton: clearHistorySearchButton,
  siteFilter: historySiteFilter,
  dateFilter: historyDateFilter,
  videoOnlyFilter: historyVideoOnlyFilter,
  includeNoPreviewFilter: historyIncludeNoPreviewFilter,
  resetButton: resetHistoryFiltersButton,
  status: historyFilterStatus,
  getItems: () => historyItems,
  getHistoryUrl,
  getVisibleCount: () => historyVisibleCount,
  hasMoreResults: () => historyHasMoreResults,
  isBusy: () => historyFilterControlsBusy || historyFillInProgress || historyInitialBatchLoading,
  applyFilters: applyHistoryFilters,
  loadFilteredPreviews: loadFilteredHistoryPreviews,
  debounceMs: HISTORY_FILTER_DEBOUNCE_MS
});

const historyHoverPreviews = createHistoryHoverPreviewController({
  document,
  window,
  preview: historyHoverPreview,
  image: historyHoverPreviewImage,
  title: historyHoverPreviewTitle,
  message: historyHoverPreviewMessage,
  saveButton: historyHoverPreviewSaveButton,
  deleteButton: historyHoverPreviewDeleteButton,
  getCachedPosterForUrl,
  getHistoryCards: () => historyCards,
  getVideoPlaylistPreviewMetadata,
  getHistoryUrl,
  hasOriginPermission,
  fetchPreviewResponse,
  findPagePreviewImageUrl,
  fetchPreviewImageDataUrl,
  maxHtmlBytes: MAX_HTML_BYTES,
  maxCachedPreviews: MAX_HISTORY_HOVER_PREVIEWS,
  delayMs: HISTORY_HOVER_PREVIEW_DELAY_MS
});

function hasActiveHistoryFilters() {
  return historyFilters.hasActiveFilters();
}

function isVideoOnlyFilterEnabled() {
  return historyFilters.isVideoOnly();
}

function getFilteredHistoryItems(items) {
  return historyFilters.getFilteredItems(items);
}

function updateHistoryFilterOptions() {
  historyFilters.updateOptions();
}

function updateHistoryFilterStatus(items) {
  historyFilters.updateStatus(items);
}

function updateHistoryFilterControls() {
  historyFilters.updateControls();
}

for (const slot of randomVideoSlots) {
  slot.link.addEventListener("click", handleRandomVideoSlotClick);
  slot.addButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (slot.currentItem) {
      openAddToPlaylistDialog({ ...slot.currentItem, videoPage: true });
    }
  });
  slot.deleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (slot.currentItem) {
      void deleteHistoryEntry(slot.currentItem.url, slot.deleteButton);
    }
  });
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
  randomVideoSection.hidden = true;
  videoPlaylistsSection.hidden = false;
  stopRandomVideoPlayback();
  for (const slot of randomVideoSlots) {
    slot.currentItem = null;
    slot.deleteButton.hidden = true;
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

function shouldShowDashboardSection(sectionId) {
  if (sectionId === "recent-history") {
    return true;
  }
  if (sectionId === "random-previews") {
    return getAutomaticVideoItems().length > 0;
  }
  return sectionId === videoPlaylistsSection.dataset.dashboardSection;
}

function updateAutomaticSectionVisibility() {
  if (!automaticSectionsDataReady && !automaticSectionsInitialRevealComplete) {
    return;
  }
  if (automaticSectionRevealInProgress) {
    return;
  }
  const automaticSections = dashboardSections.getSections().filter((section) =>
    section.dataset.dashboardSection !== "recent-history"
  );
  if (automaticSectionsInitialRevealComplete) {
    for (const section of automaticSections) {
      const shouldShow = shouldShowDashboardSection(section.dataset.dashboardSection);
      if (!shouldShow) {
        section.hidden = true;
        continue;
      }
      if (!section.hidden) {
        continue;
      }
      automaticSectionRevealInProgress = true;
      section.hidden = false;
      if (section === videoPlaylistsSection && videoPlaylistDisplayLimit === 0) {
        renderVideoPlaylists();
      }
      animateAutomaticHistorySection(section, () => {
        automaticSectionRevealInProgress = false;
        updateAutomaticSectionVisibility();
      });
      return;
    }
    observeVideoPlaylistSection();
    return;
  }
  dashboardSectionStack.hidden = false;
  for (const section of dashboardSections.getSections()) {
    const sectionId = section.dataset.dashboardSection;
    if (automaticSectionsRevealed.has(sectionId)) {
      continue;
    }
    const shouldShow = shouldShowDashboardSection(sectionId);
    if (!shouldShow) {
      automaticSectionsRevealed.add(sectionId);
      continue;
    }
    section.hidden = false;
    if (section === videoPlaylistsSection) {
      if (videoPlaylistDisplayLimit === 0) {
        renderVideoPlaylists();
      } else {
        observeVideoPlaylistSection();
      }
    }
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
  if (!continueSectionCollapsed) {
    observeVideoPlaylistSection();
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
            origins: new Set([url.origin]),
            bookmarks: [node]
          });
        } else {
          site.origins.add(url.origin);
          site.bookmarks.push(node);
          if (isRootPage && name && !site.nameIsRootPage) {
            site.name = name;
            site.nameIsRootPage = true;
          }
        }
      }
    }
  }
  for (const node of bookmarks) {
    const url = getHistoryUrl(node.url);
    const site = url ? sites.get(url.hostname.replace(/^www\./i, "")) : null;
    if (!site) {
      continue;
    }
    for (const origin of bookmarkRedirectAliases[node.id] ?? []) {
      const aliasUrl = getHistoryUrl(origin);
      if (!aliasUrl) {
        continue;
      }
      const aliasHostname = aliasUrl.hostname.replace(/^www\./i, "");
      if (!sites.has(aliasHostname)) {
        sites.set(aliasHostname, site);
      }
    }
  }
  return sites;
}

function normalizeBookmarkRedirectAliases(savedAliases, validBookmarkIds = null) {
  if (!savedAliases || typeof savedAliases !== "object" || Array.isArray(savedAliases)) {
    return {};
  }
  const aliases = {};
  for (const [bookmarkId, savedOrigins] of Object.entries(savedAliases)) {
    if ((validBookmarkIds && !validBookmarkIds.has(bookmarkId)) ||
        !Array.isArray(savedOrigins)) {
      continue;
    }
    const origins = [];
    for (const origin of savedOrigins.slice(-10)) {
      if (typeof origin !== "string" || origin.length > 2048) {
        continue;
      }
      try {
        const url = new URL(origin);
        if (url.origin === origin &&
            (url.protocol === "http:" || url.protocol === "https:") &&
            !url.username &&
            !url.password &&
            !origins.includes(origin)) {
          origins.push(origin);
        }
      } catch {
        continue;
      }
    }
    if (origins.length > 0) {
      aliases[bookmarkId] = origins;
    }
  }
  return aliases;
}

function updateBookmarkWithRedirectAlias(bookmark, destination) {
  const operation = bookmarkAliasUpdateQueue.then(async () => {
    const saved = await browser.storage.local.get("bookmarkRedirectAliases");
    const previousAliases = normalizeBookmarkRedirectAliases(saved.bookmarkRedirectAliases);
    const sourceOrigin = new URL(bookmark.url).origin;
    const origins = previousAliases[bookmark.id] ?? [];
    const nextAliases = {
      ...previousAliases,
      [bookmark.id]: [...new Set([...origins, sourceOrigin])].slice(-10)
    };
    await browser.storage.local.set({ bookmarkRedirectAliases: nextAliases });
    try {
      const [currentBookmark] = await browser.bookmarks.get(bookmark.id);
      if (currentBookmark?.url !== bookmark.url) {
        await browser.storage.local.set({ bookmarkRedirectAliases: previousAliases });
        return false;
      }
      await browser.bookmarks.update(bookmark.id, { url: destination.href });
    } catch (error) {
      try {
        await browser.storage.local.set({ bookmarkRedirectAliases: previousAliases });
      } catch (restoreError) {
        throw new Error(
          `Could not update the bookmark: ${error.message}. Its previous-domain history alias could not be restored: ${restoreError.message}`
        );
      }
      throw error;
    }
    bookmarkRedirectAliases = nextAliases;
    return true;
  });
  bookmarkAliasUpdateQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function addBookmarkRedirectAlias(bookmark, origin) {
  const operation = bookmarkAliasUpdateQueue.then(async () => {
    const [currentBookmark] = await browser.bookmarks.get(bookmark.id);
    if (currentBookmark?.url !== bookmark.url) {
      return false;
    }
    const saved = await browser.storage.local.get("bookmarkRedirectAliases");
    const previousAliases = normalizeBookmarkRedirectAliases(saved.bookmarkRedirectAliases);
    const sourceOrigin = new URL(origin).origin;
    const origins = previousAliases[bookmark.id] ?? [];
    if (origins.includes(sourceOrigin)) {
      return false;
    }
    const nextAliases = {
      ...previousAliases,
      [bookmark.id]: [...origins, sourceOrigin].slice(-10)
    };
    const nextMetadata = { ...previewMetadataCache };
    let metadataChanged = false;
    for (const url of Object.keys(nextMetadata)) {
      if (getHistoryUrl(url)?.origin === sourceOrigin) {
        delete nextMetadata[url];
        metadataChanged = true;
      }
    }
    const updates = { bookmarkRedirectAliases: nextAliases };
    if (metadataChanged) {
      updates.previewMetadataCache = nextMetadata;
    }
    await browser.storage.local.set(updates);
    bookmarkRedirectAliases = nextAliases;
    if (metadataChanged) {
      previewMetadataCache = nextMetadata;
    }
    return true;
  });
  bookmarkAliasUpdateQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function getFavoriteHistorySearchTerms(site) {
  const ignoredLabels = new Set([
    "amp", "biz", "com", "co", "de", "edu", "gov", "info", "m", "me",
    "mobile", "net", "org", "ru", "uk", "us", "www"
  ]);
  const hostnameLabels = site.hostname.split(".").slice(0, -1);
  const nameLabels = site.name.toLowerCase().split(/[^a-z0-9]+/);
  return [...new Set([...hostnameLabels, ...nameLabels]
    .map((label) => label.replace(/[^a-z0-9]/g, ""))
    .filter((label) => label.length >= 4 && !ignoredLabels.has(label)))]
    .slice(0, 3);
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
  manageShortcutsLabel.textContent = manageShortcuts ? "Done" : "Arrange";
  manageShortcutsIcon.hidden = manageShortcuts;
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

  manageShortcutsLabel.textContent = manageShortcuts ? "Done" : "Arrange";
  manageShortcutsIcon.hidden = manageShortcuts;
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
      bookmarkStatus.textContent = `${failedCount} favorite site icon${failedCount === 1 ? "" : "s"} could not be loaded; Continue history is separate. Update a bookmark if that site changed domains.`;
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

function normalizeVideoPlaylists(savedPlaylists) {
  const playlists = [];
  const playlistIds = new Set();
  const playlistNames = new Set();
  for (const savedPlaylist of Array.isArray(savedPlaylists) ? savedPlaylists : []) {
    if (!savedPlaylist ||
        typeof savedPlaylist.id !== "string" ||
        typeof savedPlaylist.name !== "string") {
      continue;
    }
    const id = savedPlaylist.id.trim();
    const name = id === DEFAULT_VIDEO_PLAYLIST_ID
      ? "Watch later"
      : savedPlaylist.name.trim().slice(0, 60);
    const normalizedName = name.toLocaleLowerCase();
    if (!id ||
        id.length > 100 ||
        !name ||
        (id !== DEFAULT_VIDEO_PLAYLIST_ID && normalizedName === "watch later") ||
        playlistIds.has(id) ||
        playlistNames.has(normalizedName)) {
      continue;
    }
    const itemUrls = new Set();
    const items = [];
    for (const savedItem of Array.isArray(savedPlaylist.items) ? savedPlaylist.items : []) {
      const url = getHistoryUrl(savedItem?.url);
      if (!url ||
          url.username ||
          url.password ||
          url.href.length > 4096 ||
          itemUrls.has(url.href)) {
        continue;
      }
      itemUrls.add(url.href);
      const item = {
        url: url.href,
        title: typeof savedItem.title === "string" ? savedItem.title.trim().slice(0, 250) : "",
        addedAt: Number.isFinite(savedItem.addedAt) ? savedItem.addedAt : 0
      };
      if (isSafeVideoSourceUrl(savedItem.previewCacheKey)) {
        item.previewCacheKey = savedItem.previewCacheKey;
      }
      items.push(item);
    }
    playlists.push({ id, name, items });
    playlistIds.add(id);
    playlistNames.add(normalizedName);
  }
  if (!playlistIds.has(DEFAULT_VIDEO_PLAYLIST_ID)) {
    playlists.unshift({ id: DEFAULT_VIDEO_PLAYLIST_ID, name: "Watch later", items: [] });
  }
  return playlists;
}

function getSelectedVideoPlaylist() {
  return videoPlaylists.find((playlist) => playlist.id === selectedVideoPlaylistId) ??
    videoPlaylists[0];
}

function setVideoPlaylistStatus(message, clearAfterMs = 0) {
  clearTimeout(videoPlaylistStatusTimer);
  videoPlaylistStatusTimer = null;
  videoPlaylistStatus.textContent = message;
  if (message && clearAfterMs > 0) {
    videoPlaylistStatusTimer = window.setTimeout(() => {
      if (videoPlaylistStatus.textContent === message) {
        videoPlaylistStatus.textContent = "";
      }
      videoPlaylistStatusTimer = null;
    }, clearAfterMs);
  }
}

function scheduleSectionLoadingStatus(element, message, isLoading) {
  element.textContent = "";
  return window.setTimeout(() => {
    if (isLoading() && !element.textContent) {
      element.textContent = message;
    }
  }, SECTION_LOADING_STATUS_DELAY_MS);
}

function getVideoPlaylistItemUrls(item) {
  return new Set([item.url, item.previewCacheKey]
    .map((url) => getHistoryUrl(url)?.href)
    .filter(Boolean));
}

function getCachedPosterForUrl(value) {
  const normalizedUrl = getHistoryUrl(value)?.href;
  if (!normalizedUrl) {
    return null;
  }
  const direct = previewCache[value] ?? previewCache[normalizedUrl];
  if (typeof direct?.dataUrl === "string") {
    return direct;
  }
  for (const [cacheUrl, entry] of Object.entries(previewCache)) {
    if (getHistoryUrl(cacheUrl)?.href === normalizedUrl &&
        typeof entry?.dataUrl === "string") {
      return entry;
    }
  }
  return null;
}

function getVideoPlaylistPreviewMetadata(item) {
  const itemUrls = getVideoPlaylistItemUrls(item);
  for (const [url, metadata] of Object.entries(previewMetadataCache)) {
    if (itemUrls.has(getHistoryUrl(url)?.href) &&
        isValidPreviewMetadata(url, metadata)) {
      return metadata;
    }
  }
  return null;
}

function getVideoPlaylistPreview(item) {
  const itemUrls = getVideoPlaylistItemUrls(item);
  for (const url of itemUrls) {
    const sessionPreview = videoPlaylistSessionPosters.get(url);
    if (typeof sessionPreview?.dataUrl === "string") {
      return sessionPreview;
    }
  }
  const cachedPreview = getCachedPosterForUrl(item.previewCacheKey) ??
    getCachedPosterForUrl(item.url);
  if (typeof cachedPreview?.dataUrl === "string") {
    return cachedPreview;
  }
  if (itemUrls.size === 0) {
    return null;
  }
  const loadedCard = historyCards.find((card) =>
    itemUrls.has(getHistoryUrl(card.item.url)?.href) &&
    typeof card.posterDataUrl === "string"
  );
  if (loadedCard) {
    return { dataUrl: loadedCard.posterDataUrl };
  }
  return null;
}

function markHistoryCardForAddition(container, itemIndex, startIndex) {
  if (startIndex === null || itemIndex < startIndex) {
    return;
  }
  container.classList.add("is-adding");
  container.style.setProperty(
    "--card-add-animation-delay",
    `${Math.min(itemIndex - startIndex, 8) * 28}ms`
  );
}

function renderVideoPlaylists() {
  videoPlaylistSelect.replaceChildren();
  for (const playlist of videoPlaylists) {
    const option = document.createElement("option");
    option.value = playlist.id;
    option.textContent = `${playlist.name} (${playlist.items.length})`;
    videoPlaylistSelect.append(option);
  }
  videoPlaylistSelect.value = selectedVideoPlaylistId;
  const selectedPlaylist = getSelectedVideoPlaylist();
  if (videoPlaylistDisplayLimit === 0 && !videoPlaylistsSection.hidden) {
    videoPlaylistDisplayLimit = getVideoPlaylistBatchSize();
  }
  deleteVideoPlaylistButton.disabled = selectedPlaylist.id === DEFAULT_VIDEO_PLAYLIST_ID;
  videoPlaylistGrid.replaceChildren();
  videoPlaylistEmpty.hidden = selectedPlaylist.items.length > 0;
  videoPlaylistEmpty.textContent = selectedPlaylist.items.length > 0
    ? ""
    : "This playlist is empty. Use Save on a video preview to add one.";
  const animationStartIndex = videoPlaylistAnimationStartIndex;
  videoPlaylistAnimationStartIndex = null;
  for (const [index, item] of selectedPlaylist.items
    .slice(0, videoPlaylistDisplayLimit)
    .entries()) {
    const url = getHistoryUrl(item.url);
    if (!url) {
      continue;
    }
    const container = document.createElement("div");
    container.className = "history-card-container video-playlist-card-container";
    markHistoryCardForAddition(container, index, animationStartIndex);
    const card = document.createElement("a");
    card.className = "history-card video-playlist-card";
    card.href = url.href;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `Open saved video: ${item.title || url.hostname}`);
    const imageFrame = document.createElement("div");
    imageFrame.className = "history-image";
    const poster = getVideoPlaylistPreview(item)?.dataUrl;
    const posterMetadata = getVideoPlaylistPreviewMetadata(item);
    if (typeof poster === "string") {
      const image = document.createElement("img");
      image.className = "history-thumbnail";
      image.alt = "";
      image.src = poster;
      imageFrame.append(image);
    } else {
      setHistoryPlaceholder(
        imageFrame,
        posterMetadata && (posterMetadata.videoPage !== true || !posterMetadata.imageUrl)
          ? "No preview available"
          : "Preview not loaded"
      );
    }
    const content = document.createElement("div");
    content.className = "history-content";
    const title = document.createElement("span");
    title.className = "history-title";
    title.textContent = item.title || url.hostname;
    const details = document.createElement("p");
    details.className = "history-details";
    details.textContent = url.hostname;
    content.append(title, details);
    card.append(imageFrame, content);
    const removeButton = document.createElement("button");
    removeButton.className = "preview-playlist-add preview-icon-link remove-video-from-playlist";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove ${item.title || url.hostname} from ${selectedPlaylist.name}`);
    const icon = document.createElement("img");
    icon.className = "ui-icon preview-action-icon";
    icon.src = browser.runtime.getURL("icons/ui/trash-can.svg");
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    removeButton.title = `Remove from ${selectedPlaylist.name}`;
    removeButton.append(icon);
    removeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeButton.disabled = true;
      container.classList.add("is-removing");
      void removeVideoFromPlaylist(item.url, selectedPlaylist.id, container, removeButton);
    });
    container.append(card, removeButton);
    videoPlaylistGrid.append(container);
  }
  updateVideoPlaylistRecoveryButton();
  updateVideoPlaylistPagination();
  observeVideoPlaylistSection();
  maybeLoadMissingVideoPlaylistPreviews();
}

function updateVideoPlaylistRecoveryButton() {
  const recoverableItems = getVideoPlaylistPreviewRecoveryCandidates().length > 0;
  loadMissingVideoPlaylistPreviewsButton.hidden = !recoverableItems;
  loadMissingVideoPlaylistPreviewsButton.disabled = videoPlaylistPosterRecoveryInProgress;
  loadMissingVideoPlaylistPreviewsButton.textContent = videoPlaylistPosterRecoveryInProgress
    ? "Loading previews…"
    : "Load missing previews";
}

function needsVideoPlaylistPreviewRecovery(item) {
  if (getVideoPlaylistPreview(item)?.dataUrl) {
    return false;
  }
  const metadata = getVideoPlaylistPreviewMetadata(item);
  return !metadata || (metadata.videoPage === true && Boolean(metadata.imageUrl));
}

function getVideoPlaylistPreviewRecoveryCandidates(excludeAutoAttempted = false) {
  const selectedPlaylist = getSelectedVideoPlaylist();
  const candidates = selectedPlaylist.items
    .slice(0, videoPlaylistDisplayLimit)
    .filter(needsVideoPlaylistPreviewRecovery)
    .filter((item) =>
      !excludeAutoAttempted || !videoPlaylistAutoRecoveryAttemptedUrls.has(item.url)
    );
  return candidates.slice(0, MAX_SAVED_POSTERS);
}

function getVideoPlaylistPreviewRecoveryKey(candidates = getVideoPlaylistPreviewRecoveryCandidates()) {
  return candidates.length > 0
    ? `${selectedVideoPlaylistId}:${candidates.map((item) => item.url).join("|")}`
    : "";
}

function observeVideoPlaylistSection() {
  if (videoPlaylistsSection.hidden) {
    videoPlaylistSectionVisible = false;
    return;
  }
  if ("IntersectionObserver" in window) {
    if (!videoPlaylistObserver) {
      videoPlaylistObserver = new IntersectionObserver((entries) => {
        videoPlaylistSectionVisible = entries.some((entry) =>
          entry.target === videoPlaylistsSection && entry.isIntersecting
        );
        if (videoPlaylistSectionVisible) {
          maybeLoadMissingVideoPlaylistPreviews();
        }
      }, { threshold: 0 });
    }
    videoPlaylistObserver.observe(videoPlaylistsSection);
    return;
  }
  const bounds = videoPlaylistsSection.getBoundingClientRect();
  videoPlaylistSectionVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
  if (videoPlaylistSectionVisible) {
    maybeLoadMissingVideoPlaylistPreviews();
  }
}

function maybeLoadMissingVideoPlaylistPreviews() {
  if (!videoPlaylistPreviewDataReady ||
      previewCacheClearedByUser ||
      !videoPlaylistSectionVisible ||
      videoPlaylistsSection.hidden ||
      document.hidden ||
      continueSectionCollapsed ||
      discreetMode.isCoverVisible() ||
      historyLoadInProgress ||
      historyInitialBatchLoading ||
      historyFillInProgress ||
      videoPlaylistPosterRecoveryInProgress) {
    return;
  }
  const candidates = getVideoPlaylistPreviewRecoveryCandidates(true);
  const recoveryKey = getVideoPlaylistPreviewRecoveryKey(candidates);
  if (!recoveryKey) {
    videoPlaylistAutoRecoveryKey = "";
    return;
  }
  if (recoveryKey === videoPlaylistAutoRecoveryKey) {
    return;
  }
  videoPlaylistAutoRecoveryKey = recoveryKey;
  for (const item of candidates) {
    videoPlaylistAutoRecoveryAttemptedUrls.add(item.url);
  }
  void loadMissingVideoPlaylistPreviews({ automatic: true, candidates });
}

async function loadMissingVideoPlaylistPreviews({
  automatic = false,
  candidates: requestedCandidates
} = {}) {
  if (automatic && previewCacheClearedByUser) {
    return;
  }
  if (videoPlaylistPosterRecoveryInProgress) {
    return;
  }
  const selectedPlaylist = getSelectedVideoPlaylist();
  const candidates = requestedCandidates ?? getVideoPlaylistPreviewRecoveryCandidates();
  if (candidates.length === 0) {
    updateVideoPlaylistRecoveryButton();
    return;
  }

  videoPlaylistPosterRecoveryInProgress = true;
  updateVideoPlaylistRecoveryButton();
  const loadingMessage = "Looking for saved preview data…";
  const statusTimer = scheduleSectionLoadingStatus(
    videoPlaylistStatus,
    loadingMessage,
    () => videoPlaylistPosterRecoveryInProgress
  );
  const cacheClearVersion = previewCacheClearVersion;
  const recoveredPosters = {};
  let loadedCount = 0;
  let unavailableCount = 0;
  let permissionCount = 0;
  const failures = [];
  let metadataChanged = false;

  try {
    if (!automatic && previewCacheClearedByUser) {
      await browser.storage.local.set({ previewCacheClearedByUser: false });
      previewCacheClearedByUser = false;
    }
    await forEachWithConcurrency(candidates, 3, async (item) => {
      try {
        const pageUrl = getHistoryUrl(item.url);
        if (!pageUrl) {
          unavailableCount += 1;
          return;
        }

        let metadata = getVideoPlaylistPreviewMetadata(item);
        if (metadata && metadata.videoPage !== true) {
          unavailableCount += 1;
          return;
        }
        if (metadata && !metadata.imageUrl) {
          unavailableCount += 1;
          return;
        }
        if (!metadata) {
          if (!await hasOriginPermission(pageUrl.href)) {
            permissionCount += 1;
            return;
          }
          const response = await fetchPreviewResponse(
            pageUrl.href,
            MAX_HTML_BYTES,
            "text/html"
          );
          const html = new TextDecoder().decode(response.bytes);
          let discoveredMetadata = null;
          let imageUrl;
          try {
            imageUrl = findThumbnailUrl(
              html,
              response.responseUrl || pageUrl.href,
              (videoPage, videoUrl) => {
                discoveredMetadata = {
                  videoPage,
                  imageUrl: null,
                  checkedAt: Date.now(),
                  classificationVersion: PREVIEW_CLASSIFICATION_VERSION,
                  videoUrl,
                  videoCheckedAt: Date.now()
                };
                previewMetadataCache[pageUrl.href] = discoveredMetadata;
                metadataChanged = true;
              }
            );
          } catch (error) {
            if (discoveredMetadata?.videoPage === false) {
              unavailableCount += 1;
              return;
            }
            throw error;
          }
          if (!discoveredMetadata?.videoPage || !imageUrl) {
            unavailableCount += 1;
            return;
          }
          discoveredMetadata.imageUrl = imageUrl;
          metadata = discoveredMetadata;
        }

        const imageUrl = getHistoryUrl(metadata.imageUrl);
        if (!imageUrl) {
          unavailableCount += 1;
          return;
        }
        if (!await hasOriginPermission(imageUrl.href)) {
          permissionCount += 1;
          return;
        }

        const dataUrl = await fetchPreviewImageDataUrl(imageUrl.href);
        recoveredPosters[item.url] = {
          dataUrl,
          imageHost: imageUrl.hostname,
          videoPage: true,
          posterVersion: POSTER_QUALITY_VERSION
        };
        loadedCount += 1;
      } catch (error) {
        failures.push(error.message);
      }
    });

    if (cacheClearVersion !== previewCacheClearVersion) {
      setVideoPlaylistStatus("Saved poster art was cleared while previews were loading.");
      return;
    }
    if (selectedVideoPlaylistId !== selectedPlaylist.id) {
      setVideoPlaylistStatus("Playlist changed while previews were loading. Try again.");
      return;
    }

    if (loadedCount > 0) {
      previewCache = trimPreviewCache(
        { ...previewCache, ...recoveredPosters },
        historyItems,
        candidates.map((item) => item.url)
      );
      for (const [url, poster] of Object.entries(recoveredPosters)) {
        if (!getCachedPosterForUrl(url)) {
          const normalizedUrl = getHistoryUrl(url)?.href;
          if (normalizedUrl) {
            videoPlaylistSessionPosters.set(normalizedUrl, poster);
          }
        }
      }
    }
    if (metadataChanged) {
      trimPreviewMetadataCache();
    }

    let storageError = "";
    if (loadedCount > 0 || metadataChanged) {
      renderVideoPlaylists();
      renderRandomVideoSection();
      try {
        await browser.storage.local.set({
          previewCache,
          previewMetadataCache
        });
      } catch (error) {
        storageError = error.message;
      }
    }
    if (storageError) {
      setVideoPlaylistStatus(loadedCount > 0
        ? `Loaded ${loadedCount} preview${loadedCount === 1 ? "" : "s"}, but could not save them: ${storageError}`
        : `Could not save preview metadata: ${storageError}`);
    } else if (loadedCount > 0 || unavailableCount > 0 || permissionCount > 0 || failures.length > 0) {
      const details = [];
      if (permissionCount > 0) {
        details.push(`${permissionCount} need site access`);
      }
      if (unavailableCount > 0) {
        details.push(`${unavailableCount} had no usable preview`);
      }
      if (failures.length > 0) {
        details.push(`${failures.length} could not be loaded`);
      }
      if (failures.length > 0) {
        details.push(`First error: ${failures[0]}`);
      }
      setVideoPlaylistStatus(
        `Loaded ${loadedCount} of ${candidates.length} missing preview${candidates.length === 1 ? "" : "s"}` +
          (details.length > 0 ? `. ${details.join("; ")}.` : ".")
      );
    }
  } catch (error) {
    setVideoPlaylistStatus(`Could not load missing previews: ${error.message}`);
  } finally {
    clearTimeout(statusTimer);
    if (videoPlaylistStatus.textContent === loadingMessage) {
      videoPlaylistStatus.textContent = "";
    }
    videoPlaylistPosterRecoveryInProgress = false;
    updateVideoPlaylistRecoveryButton();
    if (selectedVideoPlaylistId !== selectedPlaylist.id) {
      videoPlaylistAutoRecoveryKey = "";
    }
    maybeLoadMissingVideoPlaylistPreviews();
  }
}

function updateVideoPlaylistPagination() {
  const batchSize = getVideoPlaylistBatchSize();
  const selectedPlaylist = getSelectedVideoPlaylist();
  const canLoadMore = selectedPlaylist.items.length > videoPlaylistDisplayLimit;
  const canShowLess = videoPlaylistDisplayLimit > batchSize;
  loadMoreVideoPlaylistButton.hidden = !canLoadMore;
  loadMoreVideoPlaylistButton.disabled = !canLoadMore;
  showLessVideoPlaylistButton.hidden = !canShowLess;
  showLessVideoPlaylistButton.disabled = !canShowLess;
}

function createUiIcon(name) {
  const icon = document.createElement("img");
  icon.className = "ui-icon preview-action-icon";
  icon.src = browser.runtime.getURL(`icons/ui/${name}.svg`);
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function createPlaylistActionButton(item) {
  const button = document.createElement("button");
  button.className = "preview-playlist-add preview-icon-link";
  button.type = "button";
  button.title = "Add to playlist";
  button.append(createUiIcon("bookmark"));
  const url = getHistoryUrl(item.url);
  button.setAttribute(
    "aria-label",
    `Add ${item.title?.trim() || url?.hostname || "video"} to a playlist`
  );
  button.hidden = item.videoPage !== true;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openAddToPlaylistDialog(item);
  });
  return button;
}

function openAddToPlaylistDialog(item) {
  const url = getHistoryUrl(item?.url);
  if (!url || !isSafeVideoSourceUrl(url.href) || item.videoPage !== true) {
    return;
  }
  const cacheKey = typeof item.url === "string" && isSafeVideoSourceUrl(item.url)
    ? item.url
    : url.href;
  pendingVideoPlaylistItem = {
    url: url.href,
    title: item.title?.trim().slice(0, 250) || url.hostname,
    previewCacheKey: cacheKey
  };
  addToPlaylistItemTitle.textContent = pendingVideoPlaylistItem.title;
  addToPlaylistSelect.replaceChildren();
  for (const playlist of videoPlaylists) {
    const option = document.createElement("option");
    option.value = playlist.id;
    option.textContent = playlist.name;
    addToPlaylistSelect.append(option);
  }
  addToPlaylistSelect.value = selectedVideoPlaylistId;
  addToPlaylistStatus.textContent = "";
  addToPlaylistDialog.showModal();
}

async function persistVideoPlaylists(nextPlaylists, nextSelectedId = selectedVideoPlaylistId) {
  const selectedId = nextPlaylists.some((playlist) => playlist.id === nextSelectedId)
    ? nextSelectedId
    : DEFAULT_VIDEO_PLAYLIST_ID;
  const selectionChanged = selectedVideoPlaylistId !== selectedId;
  await browser.storage.local.set({
    videoPlaylists: nextPlaylists,
    selectedVideoPlaylistId: selectedId
  });
  videoPlaylists = nextPlaylists;
  selectedVideoPlaylistId = selectedId;
  if (selectionChanged) {
    videoPlaylistDisplayLimit = getVideoPlaylistBatchSize();
  }
  renderVideoPlaylists();
}

async function addPendingVideoToPlaylist() {
  const pendingItem = pendingVideoPlaylistItem;
  const playlist = videoPlaylists.find((entry) => entry.id === addToPlaylistSelect.value);
  if (!pendingItem || !playlist) {
    addToPlaylistStatus.textContent = "Choose a playlist before saving.";
    return;
  }
  if (playlist.items.some((item) => item.url === pendingItem.url)) {
    addToPlaylistStatus.textContent = `Already saved in ${playlist.name}.`;
    return;
  }
  const nextPlaylists = videoPlaylists.map((entry) => entry.id === playlist.id
    ? { ...entry, items: [{ ...pendingItem, addedAt: Date.now() }, ...entry.items] }
    : entry);
  await persistVideoPlaylists(nextPlaylists, playlist.id);
  setVideoPlaylistStatus(`Saved to ${playlist.name}.`, 4000);
  addToPlaylistStatus.textContent = `Saved to ${playlist.name}.`;
  addToPlaylistDialog.close();
}

async function createVideoPlaylist(name) {
  const trimmedName = name.trim().slice(0, 60);
  if (!trimmedName) {
    setVideoPlaylistStatus("Enter a name for the playlist.");
    newVideoPlaylistNameInput.focus();
    return false;
  }
  if (videoPlaylists.some((playlist) =>
    playlist.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
  )) {
    setVideoPlaylistStatus(`A playlist named ${trimmedName} already exists.`);
    newVideoPlaylistNameInput.focus();
    return false;
  }
  const id = crypto.randomUUID();
  await persistVideoPlaylists(
    [...videoPlaylists, { id, name: trimmedName, items: [] }],
    id
  );
  newVideoPlaylistNameInput.value = "";
  setVideoPlaylistStatus(`Created ${trimmedName}.`, 4000);
  return true;
}

async function removeVideoFromPlaylist(url, playlistId, container, button) {
  await new Promise((resolve) => setTimeout(resolve, 180));
  const playlist = videoPlaylists.find((entry) => entry.id === playlistId);
  if (!playlist) {
    return;
  }
  const nextPlaylists = videoPlaylists.map((entry) => entry.id === playlist.id
    ? { ...entry, items: entry.items.filter((item) => item.url !== url) }
    : entry);
  try {
    await persistVideoPlaylists(nextPlaylists);
    setVideoPlaylistStatus(`Removed from ${playlist.name}.`, 4000);
  } catch (error) {
    container.classList.remove("is-removing");
    button.disabled = false;
    setVideoPlaylistStatus(`Could not update playlist: ${error.message}`);
  }
}

async function deleteSelectedVideoPlaylist() {
  const playlist = getSelectedVideoPlaylist();
  if (playlist.id === DEFAULT_VIDEO_PLAYLIST_ID) {
    return;
  }
  const confirmed = window.confirm(
    `Delete "${playlist.name}" and its ${playlist.items.length} saved video${playlist.items.length === 1 ? "" : "s"}?`
  );
  if (!confirmed) {
    return;
  }
  const nextPlaylists = videoPlaylists.filter((entry) => entry.id !== playlist.id);
  try {
    await persistVideoPlaylists(nextPlaylists, DEFAULT_VIDEO_PLAYLIST_ID);
    setVideoPlaylistStatus(`Deleted ${playlist.name}.`, 4000);
  } catch (error) {
    setVideoPlaylistStatus(`Could not delete playlist: ${error.message}`);
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
  allSitesPermissionGranted = await browser.permissions.contains({
    origins: ["<all_urls>"]
  });
  enableAutomaticPreviewsButton.hidden = allSitesPermissionGranted;
  enableAutomaticPreviewsButton.disabled = allSitesPermissionGranted;
  updateRandomVideoPlayback();
  videoPlaylistAutoRecoveryKey = "";
  videoPlaylistAutoRecoveryAttemptedUrls.clear();
  observeVideoPlaylistSection();
  maybeLoadMissingVideoPlaylistPreviews();
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

  const container = document.createElement("div");
  container.className = "history-card-container";
  container.hidden = true;
  markHistoryCardForAddition(container, historyCards.length, historyCardAnimationStartIndex);
  const card = document.createElement("a");
  card.className = "history-card";
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

  const cached = getCachedPosterForUrl(item.url);
  const cachedMetadata = getVideoPlaylistPreviewMetadata(item);
  if (cachedMetadata) {
    item.videoPage = cachedMetadata.videoPage;
  } else if (typeof item.videoPage !== "boolean" && cached?.videoPage === true) {
    item.videoPage = true;
  }
  const cardState = {
    item,
    element: card,
    container,
    imageFrame,
    status,
    playlistButton: createPlaylistActionButton(item),
    deleteButton: createHistoryDeleteButton(item),
    imageUrl: cachedMetadata?.imageUrl ?? null,
    metadataCheckedAt: cachedMetadata?.checkedAt ?? 0,
    videoUrl: isFreshVideoSourceCheck(cachedMetadata) ? cachedMetadata.videoUrl : null,
    posterVersion: 0,
    videoPage: typeof item.videoPage === "boolean" ? item.videoPage : null
  };
  cardState.playlistButton.hidden = cardState.videoPage !== true;
  cardState.deleteButton.classList.toggle("delete-history-entry--solo", cardState.playlistButton.hidden);
  historyCards.push(cardState);
  if (cached?.videoPage === true && cached.dataUrl) {
    cardState.posterVersion = cached.posterVersion === POSTER_QUALITY_VERSION ? POSTER_QUALITY_VERSION : 1;
    showThumbnail(cardState, cached.dataUrl, `Saved poster from ${cached.imageHost}.`);
  }
  content.append(title, details, status);
  card.append(imageFrame, content);
  container.append(card, cardState.playlistButton, cardState.deleteButton);
  return container;
}

function setHistoryPlaceholder(imageFrame, message = "Your next favorite") {
  const placeholder = document.createElement("span");
  placeholder.className = "history-placeholder";
  placeholder.textContent = message;
  imageFrame.replaceChildren(placeholder);
}

function renderFilteredHistory() {
  historyGrid.replaceChildren();
  historyCards = [];
  historyVisibleCount = 0;
  historyDisplayLimit = getHistoryBatchSize();
  previewPhase = "pages";
  historyFilters.updateStatus();
  appendNextHistoryBatch();
  renderFavoriteHistory(historyItems);
}

function applyHistoryFilters() {
  if (historyFilters.isBusy()) {
    return;
  }
  renderFilteredHistory();
}

async function loadFilteredHistoryPreviews() {
  if (historyFilters.isBusy()) {
    return;
  }
  const cardsToLoad = historyCards.filter((card) =>
    card.videoPage !== false &&
    (card.posterVersion < POSTER_QUALITY_VERSION || !card.imageFrame.querySelector("img"))
  );
  const wasVisibilityDeferred = historyVisibilityDeferred;
  historyVisibilityDeferred = true;
  historyFilterControlsBusy = true;
  historyFilters.updateControls();
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
    historyFilters.updateControls();
    if (!historyVisibilityDeferred) {
      updateVisibleHistory();
    }
    historyFilters.updateStatus();
    updatePreviewLoadButton();
  }
}

function getHistoryColumnCount() {
  const columns = getGridColumnCount(historyGrid);
  return columns || 4;
}

function getGridColumnCount(grid) {
  const template = getComputedStyle(grid).gridTemplateColumns;
  return template === "none"
    ? 0
    : template.trim().split(/\s+/).filter(Boolean).length;
}

function getVideoPlaylistBatchSize() {
  const columns = getGridColumnCount(videoPlaylistGrid) || getHistoryColumnCount();
  return columns * 2;
}

function getMoreVideoPlaylistBatchSize() {
  return getVideoPlaylistBatchSize();
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
  const hasFavoriteSitesWithoutHistory = [...bookmarkedSites.values()].some((site) =>
    !historyItems.some((item) => getBookmarkedSiteHostname(item.url) === site.hostname)
  );
  const hasFavoriteSites = new Set(bookmarkedSites.values()).size > 0;
  loadPreviewsButton.disabled = !hasUncachedPages &&
    !hasFavoriteSitesWithoutHistory &&
    !hasFavoriteSites;
  loadPreviewsButton.textContent = hasUncachedPages
    ? "Load previews"
    : hasFavoriteSitesWithoutHistory || hasFavoriteSites
      ? "Check favorite redirects"
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
          if (!await loadPagePreviews(nextCards)) {
            return;
          }
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
    renderRandomVideoSection();
  }
}

function renderHistory(items) {
  historyItems = items;
  updateHistoryFilterOptions();
  renderFilteredHistory();
  renderRandomVideoSection();
}

function getAutomaticVideoItems(items = historyItems) {
  return items.filter((item) => {
    const savedPoster = getCachedPosterForUrl(item.url);
    const isVideoPage = getVideoPlaylistPreviewMetadata(item)?.videoPage === true ||
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
      normalizedUrl: getHistoryUrl(entry[0])?.href,
      hostname: getBookmarkedSiteHostname(entry[0]) ||
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
  const playlistPriorityUrls = [];
  const playlistUrlSet = new Set();
  const prioritizedPlaylists = [
    getSelectedVideoPlaylist(),
    ...videoPlaylists.filter((playlist) => playlist.id !== selectedVideoPlaylistId)
  ];
  for (const playlist of prioritizedPlaylists) {
    for (const item of playlist.items) {
      for (const url of [item.previewCacheKey, item.url]) {
        const normalizedUrl = getHistoryUrl(url)?.href;
        if (normalizedUrl && !playlistUrlSet.has(normalizedUrl)) {
          playlistUrlSet.add(normalizedUrl);
          playlistPriorityUrls.push(normalizedUrl);
        }
      }
    }
  }
  const entriesByUrl = new Map();
  for (const item of entries) {
    if (item.normalizedUrl && !entriesByUrl.has(item.normalizedUrl)) {
      entriesByUrl.set(item.normalizedUrl, item);
    }
  }
  for (const normalizedUrl of playlistPriorityUrls) {
    if (selected.length >= MAX_SAVED_POSTERS) {
      break;
    }
    const item = entriesByUrl.get(normalizedUrl);
    if (item && !selectedUrls.has(item.entry[0])) {
      selectEntry(item);
    }
  }
  const prioritySet = new Set(prioritizedUrls);
  for (const item of entries.filter((entry) => prioritySet.has(entry.entry[0]))) {
    if (selected.length >= MAX_SAVED_POSTERS) {
      break;
    }
    if (selectedUrls.has(item.entry[0])) {
      continue;
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

function animateAutomaticHistorySection(section, onComplete) {
  section.classList.add("is-revealing");
  window.setTimeout(() => {
    section.classList.remove("is-revealing");
    if (onComplete) {
      onComplete();
    }
  }, AUTOMATIC_SECTION_REVEAL_MS);
}

async function scanRandomHistoryPreviews(items) {
  const candidates = items
    .filter((item) =>
      item.randomPreviewChecked !== true &&
      !getCachedPosterForUrl(item.url)?.dataUrl &&
      getVideoPlaylistPreviewMetadata(item)?.videoPage !== false
    )
    .sort((first, second) => {
      const firstIsKnownVideo = getVideoPlaylistPreviewMetadata(first)?.videoPage === true;
      const secondIsKnownVideo = getVideoPlaylistPreviewMetadata(second)?.videoPage === true;
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
      slot.deleteButton.hidden = true;
      slot.previousPoster.removeAttribute("src");
      slot.previousPoster.hidden = true;
      slot.poster.removeAttribute("src");
      slot.title.textContent = "";
      slot.site.textContent = "";
      slot.link.removeAttribute("href");
      slot.addButton.hidden = true;
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
    !getCachedPosterForUrl(item.url)?.dataUrl &&
    getVideoPlaylistPreviewMetadata(item)?.videoPage !== false
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
      typeof getCachedPosterForUrl(item.url)?.dataUrl === "string"
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
  const slot = randomVideoSlots.find((candidate) => candidate.link === event.currentTarget);
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
      const loadingMessage = "Searching older history for previews…";
      const statusTimer = scheduleSectionLoadingStatus(
        randomVideoStatus,
        loadingMessage,
        () => randomVideoHistoryLoadInProgress
      );
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
        clearTimeout(statusTimer);
        if (randomVideoStatus.textContent === loadingMessage) {
          randomVideoStatus.textContent = "";
        }
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
  const previousPoster = previousItem ? getCachedPosterForUrl(previousItem.url)?.dataUrl : null;
  const shouldTransition = previousItem?.url !== item.url && Boolean(previousPoster);
  if (shouldTransition) {
    slot.previousPoster.src = previousPoster;
    slot.previousPoster.hidden = false;
  }
  slot.currentItem = item;
  const url = getHistoryUrl(item.url);
  slot.link.href = url.href;
  slot.link.setAttribute("aria-label", `Open video preview: ${item.title?.trim() || url.hostname}`);
  slot.addButton.setAttribute(
    "aria-label",
    `Add ${item.title?.trim() || url.hostname} to a playlist`
  );
  slot.addButton.hidden = false;
  slot.deleteButton.setAttribute(
    "aria-label",
    `Delete all visits to ${item.title?.trim() || url.hostname} from Firefox history`
  );
  slot.deleteButton.hidden = false;
  slot.poster.src = getCachedPosterForUrl(item.url).dataUrl;
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
  const loadingMessage = "Checking bookmarked pages for direct video clips…";
  const statusTimer = scheduleSectionLoadingStatus(
    randomVideoStatus,
    loadingMessage,
    () => randomVideoSourceScanInProgress
  );
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
    clearTimeout(statusTimer);
    if (randomVideoStatus.textContent === loadingMessage) {
      randomVideoStatus.textContent = "";
    }
    randomVideoSourceScanInProgress = false;
    updateRandomVideoPlayback();
  }
}

function canPlayRandomVideo() {
  return randomVideoIsVisible &&
    !document.hidden &&
    !randomVideoHistoryLoadInProgress &&
    !discreetMode.isCoverVisible() &&
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
    if (slot.currentItem && getCachedPosterForUrl(slot.currentItem.url)?.dataUrl) {
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
  historyHoverPreviews.hide();
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
      link.addEventListener("pointerenter", () => historyHoverPreviews.show(link, item));
      link.addEventListener("pointerleave", () => historyHoverPreviews.hideFor(link));
      link.addEventListener("focus", () => historyHoverPreviews.show(link, item));
      link.addEventListener("blur", () => historyHoverPreviews.hideFor(link));
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
  const cursor = getHistorySearchCursor(items, previousEndTime);
  historyHasMoreResults = cursor.hasMoreResults;
  historyOlderEndTime = cursor.olderEndTime;
}

function getHistorySearchCursor(items, previousEndTime = null) {
  let oldestVisitTime = Infinity;
  for (const item of items) {
    if (Number.isFinite(item?.lastVisitTime)) {
      oldestVisitTime = Math.min(oldestVisitTime, item.lastVisitTime);
    }
  }
  const hasMoreResults = items.length >= MAX_HISTORY_RESULTS &&
    Number.isFinite(oldestVisitTime) &&
    (previousEndTime === null || oldestVisitTime + 1 < previousEndTime);
  return {
    hasMoreResults,
    olderEndTime: hasMoreResults ? oldestVisitTime + 1 : null
  };
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

async function includeRedirectAliasHistory(items) {
  const aliasOrigins = new Set();
  for (const site of new Set(bookmarkedSites.values())) {
    for (const bookmark of site.bookmarks) {
      for (const origin of bookmarkRedirectAliases[bookmark.id] ?? []) {
        aliasOrigins.add(origin);
      }
    }
  }
  if (aliasOrigins.size === 0) {
    return items;
  }

  const aliasHistoryItems = [];
  await forEachWithConcurrency([...aliasOrigins], 3, async (origin) => {
    const hostname = new URL(origin).hostname;
    const results = await browser.history.search({
      text: hostname,
      startTime: 0,
      maxResults: MAX_REDIRECT_HISTORY_SEARCH_RESULTS
    });
    for (const item of results) {
      const url = getHistoryUrl(item?.url);
      if (url &&
          (url.hostname === hostname || url.hostname.endsWith(`.${hostname}`))) {
        aliasHistoryItems.push(item);
      }
    }
  });

  const mergedItems = new Map(items.map((item) => [item.url, item]));
  const supplementalItems = normalizeHistorySnapshotItems(aliasHistoryItems)
    .filter((item) => !mergedItems.has(item.url))
    .sort((first, second) => second.lastVisitTime - first.lastVisitTime)
  const visibleSupplementalItems = supplementalItems.slice(0, MAX_HISTORY_RESULTS);
  for (const item of visibleSupplementalItems) {
    mergedItems.set(item.url, item);
    historySeenUrls.add(item.url);
  }
  if (supplementalItems.length > visibleSupplementalItems.length) {
    const nextEndTime =
      visibleSupplementalItems[visibleSupplementalItems.length - 1].lastVisitTime + 1;
    historyOlderEndTime = historyHasMoreResults && Number.isFinite(historyOlderEndTime)
      ? Math.min(historyOlderEndTime, nextEndTime)
      : nextEndTime;
    historyHasMoreResults = true;
  }
  return [...mergedItems.values()]
    .sort((first, second) => second.lastVisitTime - first.lastVisitTime);
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
  updateHistoryFilterOptions();
  updateHistoryFilterStatus();
  updateLoadMoreHistoryButton();
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
  const loadingMessage = "Checking recent history…";
  const statusTimer = scheduleSectionLoadingStatus(
    historyStatus,
    loadingMessage,
    () => historyLoadInProgress && !historyInitialBatchLoading
  );
  try {
    do {
      historyLoadRequested = false;
      await loadRecentHistoryData();
      if (historyLoadRequested) {
        historySnapshotNeedsRefresh = true;
      }
    } while (historyLoadRequested);
  } finally {
      clearTimeout(statusTimer);
      if (historyStatus.textContent === loadingMessage) {
        historyStatus.textContent = "";
      }
    historyLoadInProgress = false;
      automaticSectionsDataReady = true;
      updateAutomaticSectionVisibility();
      maybeLoadMissingVideoPlaylistPreviews();
  }
}

async function loadRecentHistoryData() {
    historyStatus.textContent = "";
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
    "previewCacheClearedByUser",
    "historyTags"
  ]);
  previewCacheClearedByUser = saved.previewCacheClearedByUser === true;
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
  renderVideoPlaylists();
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
  videoPlaylistPreviewDataReady = true;
  renderVideoPlaylists();
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
  recentPages = await includeRedirectAliasHistory(recentPages);
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
  renderFavoriteHistory(historyItems);
  loadBookmarkFavicons().catch((error) => {
    bookmarkStatus.textContent = `Could not load bookmark icons: ${error.message}`;
  });
  historyStatus.textContent = storageWarning;
  const finishInitialHistoryBatch = (error = null) => {
    historyInitialBatchLoading = false;
    updateVisibleHistory();
    updateAutomaticSectionVisibility();
    renderFavoriteHistory(historyItems);
    if (error) {
      historyStatus.textContent = `Could not load initial previews: ${error.message}`;
    } else if (storageWarning) {
      historyStatus.textContent = storageWarning;
    }
  };
  void fillHistoryBatch(getHistoryBatchSize(), true)
    .then(() => finishInitialHistoryBatch())
    .catch(finishInitialHistoryBatch);
}

function loadHistoryAfterBookmarks() {
  automaticSectionsDataReady = false;
  return loadRecentHistory()
    .catch((error) => {
      historyStatus.textContent = `Could not read recent history: ${error.message}`;
      loadPreviewsButton.disabled = true;
    });
}

function createHistoryDeleteButton(item) {
  const button = document.createElement("button");
  button.className = "preview-playlist-add preview-icon-link delete-history-entry";
  button.type = "button";
  const url = getHistoryUrl(item.url);
  const label = item.title?.trim() || url?.hostname || "page";
  button.title = "Delete from Firefox history";
  button.setAttribute("aria-label", `Delete all visits to ${label} from Firefox history`);
  button.append(createUiIcon("trash-can"));
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void deleteHistoryEntry(item.url, button);
  });
  return button;
}

async function fetchFavoritePreviewResponse(url) {
  let originalError;
  try {
    return await fetchPreviewResponse(url, MAX_HTML_BYTES, "text/html");
  } catch (error) {
    originalError = error;
  }

  const sourceHostname = getBookmarkedSiteHostname(url);
  const sourceSite = sourceHostname ? bookmarkedSites.get(sourceHostname) : null;
  if (!sourceSite) {
    throw originalError;
  }

  let destination;
  try {
    destination = await getBookmarkRedirectDestination(url);
  } catch {
    throw originalError;
  }
  if (!destination) {
    throw originalError;
  }
  const destinationHostname = getBookmarkedSiteHostname(destination.href);
  const destinationSite = destinationHostname ? bookmarkedSites.get(destinationHostname) : null;
  if (destinationSite !== sourceSite) {
    throw originalError;
  }
  if (!await hasOriginPermission(destination.href)) {
    throw new Error(
      `The redirected favorite site ${destination.hostname} needs access. Select Allow all sites to load its preview.`
    );
  }
  const response = await fetchPreviewResponse(destination.href, MAX_HTML_BYTES, "text/html");
  return { ...response, redirectedFrom: url };
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
    card.container.hidden = historyInitialBatchLoading || !canDisplay || visibleCount >= historyDisplayLimit;
    card.playlistButton.hidden = card.videoPage !== true;
    card.deleteButton.classList.toggle("delete-history-entry--solo", card.playlistButton.hidden);
    if (canDisplay && !card.container.hidden) {
      if (hasPoster) {
        card.container.classList.toggle("featured-history-card", !featuredCardAssigned);
        featuredCardAssigned = true;
      } else {
        card.container.classList.remove("featured-history-card");
      }
      visibleCount += 1;
    } else {
      card.container.classList.remove("featured-history-card");
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

async function getBookmarkRedirectDestination(bookmarkUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let response;
  try {
    response = await fetch(bookmarkUrl, {
      headers: { Range: "bytes=0-0" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal
    });
    const result = {
      redirected: response.redirected,
      status: response.status,
      url: response.url
    };
    if (response.body) {
      response.body.cancel().catch((error) => {
        console.error("Could not stop the Joydash bookmark redirect check:", error);
      });
    }
    response = result;
  } finally {
    clearTimeout(timeout);
  }
  if (!response.redirected || !response.status || response.status < 200 || response.status >= 300) {
    return null;
  }
  const destination = getHistoryUrl(response.url);
  if (!destination ||
      destination.username ||
      destination.password ||
      destination.href.length > 4096 ||
      destination.hostname.toLowerCase() === new URL(bookmarkUrl).hostname.toLowerCase() ||
      (new URL(bookmarkUrl).protocol === "https:" && destination.protocol !== "https:")) {
    return null;
  }
  return destination;
}

async function repairRedirectedFavoriteBookmark(pageUrl) {
  const hostname = getBookmarkedSiteHostname(pageUrl);
  const site = hostname ? bookmarkedSites.get(hostname) : null;
  if (!site) {
    return false;
  }
  const existingRepair = redirectRepairPromises.get(hostname);
  if (existingRepair) {
    return existingRepair;
  }

  const repair = (async () => {
    const candidates = [...site.bookmarks]
      .filter((bookmark) => !redirectedBookmarkIds.has(bookmark.id))
      .sort((first, second) => {
        const firstUrl = getHistoryUrl(first.url);
        const secondUrl = getHistoryUrl(second.url);
        const firstIsRoot = firstUrl?.pathname === "/" && !firstUrl.search;
        const secondIsRoot = secondUrl?.pathname === "/" && !secondUrl.search;
        return Number(secondIsRoot) - Number(firstIsRoot);
      });
    let permissionMissing = false;
    for (const bookmark of candidates) {
      const source = getHistoryUrl(bookmark.url);
      if (!source || source.username || source.password) {
        continue;
      }
      if (!await hasOriginPermission(source.href)) {
        permissionMissing = true;
        continue;
      }
      let destination;
      try {
        destination = await getBookmarkRedirectDestination(source.href);
      } catch {
        continue;
      }
      if (!destination) {
        continue;
      }
      if (!await hasOriginPermission(destination.href)) {
        bookmarkStatus.textContent =
          `The redirected site ${destination.hostname} needs access. Select Allow all sites to update this bookmark.`;
        return false;
      }
      if (!await updateBookmarkWithRedirectAlias(bookmark, destination)) {
        continue;
      }
      redirectedBookmarkIds.add(bookmark.id);
      bookmarkStatus.textContent =
        `Updated "${bookmark.title || site.name}" to its redirected address; refreshing Continue history…`;
      return true;
    }
    if (permissionMissing) {
      bookmarkStatus.textContent =
        "Redirect checks need site access. Select Allow all sites to check these bookmarks.";
    }
    return false;
  })();
  redirectRepairPromises.set(hostname, repair);
  try {
    return await repair;
  } finally {
    if (redirectRepairPromises.get(hostname) === repair) {
      redirectRepairPromises.delete(hostname);
    }
  }
}

async function repairFavoriteBookmarksWithoutHistory() {
  const sitesWithHistory = new Set(historyItems
    .map((item) => getBookmarkedSiteHostname(item.url))
    .filter(Boolean));
  const sitesWithoutHistory = [...bookmarkedSites.values()]
    .filter((site) => !sitesWithHistory.has(site.hostname));
  let updated = false;
  await forEachWithConcurrency(sitesWithoutHistory, 2, async (site) => {
    const bookmark = site.bookmarks[0];
    if (bookmark) {
      updated = await repairRedirectedFavoriteBookmark(bookmark.url) || updated;
    }
  });
  updated = await restoreFavoriteHistoryAliases() || updated;
  return updated;
}

async function restoreFavoriteHistoryAliases() {
  const historySearch = browser.history.search({
    text: "",
    startTime: 0,
    maxResults: MAX_HISTORY_RESULTS
  });
  const savedHistory = browser.storage.local.get("historySnapshot");
  const [recentItems, saved] = await Promise.all([historySearch, savedHistory]);
  const savedItems = Array.isArray(saved.historySnapshot?.items)
    ? saved.historySnapshot.items
    : [];
  const candidatesByOrigin = new Map();
  const addHistoryCandidate = (item, expectedSite = null) => {
    const url = getHistoryUrl(item?.url);
    if (!url || url.username || url.password || getBookmarkedSiteHostname(url.href)) {
      return;
    }
    const existingCandidate = candidatesByOrigin.get(url.origin);
    let candidate = existingCandidate;
    if (!candidate) {
      candidate = {
        url: url.href,
        origin: url.origin,
        lastVisitTime: Number.isFinite(item.lastVisitTime) ? item.lastVisitTime : 0,
        isRootPage: url.pathname === "/" && !url.search,
        expectedSites: new Set()
      };
      candidatesByOrigin.set(url.origin, candidate);
    }
    if (expectedSite) {
      candidate.expectedSites.add(expectedSite);
    }
    if (!existingCandidate ||
        (url.pathname === "/" && !url.search && !candidate.isRootPage) ||
        ((url.pathname === "/" && !url.search) === candidate.isRootPage &&
          (Number.isFinite(item.lastVisitTime) ? item.lastVisitTime : 0) > candidate.lastVisitTime)) {
      candidate.url = url.href;
      candidate.lastVisitTime = Number.isFinite(item.lastVisitTime) ? item.lastVisitTime : 0;
      candidate.isRootPage = url.pathname === "/" && !url.search;
    }
  };
  for (const item of [...recentItems, ...savedItems]) {
    addHistoryCandidate(item);
  }
  const sitesWithHistory = [...new Set(bookmarkedSites.values())].filter((site) =>
    historyItems.some((item) => getBookmarkedSiteHostname(item.url) === site.hostname)
  );
  const targetedSearches = sitesWithHistory.flatMap((site) =>
    getFavoriteHistorySearchTerms(site).map((text) => ({ site, text }))
  );
  await forEachWithConcurrency(targetedSearches, 3, async ({ site, text }) => {
    const items = await browser.history.search({
      text,
      startTime: 0,
      maxResults: MAX_REDIRECT_HISTORY_SEARCH_RESULTS
    });
    for (const item of items) {
      addHistoryCandidate(item, site);
    }
  });
  const candidates = [...candidatesByOrigin.values()]
    .sort((first, second) =>
      Number(second.expectedSites.size > 0) - Number(first.expectedSites.size > 0) ||
      second.lastVisitTime - first.lastVisitTime
    )
    .slice(0, MAX_REDIRECT_HISTORY_CANDIDATES);
  if (candidates.length === 0) {
    return false;
  }

  let aliasAdded = false;
  await forEachWithConcurrency(candidates, 3, async (candidate) => {
    if (!await hasOriginPermission(candidate.url)) {
      return;
    }
    let destination;
    try {
      destination = await getBookmarkRedirectDestination(candidate.url);
    } catch {
      return;
    }
    if (!destination || !await hasOriginPermission(destination.href)) {
      return;
    }
    const destinationHostname = getBookmarkedSiteHostname(destination.href);
    const site = destinationHostname ? bookmarkedSites.get(destinationHostname) : null;
    const bookmark = site?.bookmarks[0];
    if (!bookmark ||
        (candidate.expectedSites.size > 0 && !candidate.expectedSites.has(site))) {
      return;
    }
    const added = await addBookmarkRedirectAlias(bookmark, candidate.origin);
    aliasAdded = added || aliasAdded;
    if (added) {
      bookmarkStatus.textContent =
        `Recovered previous-domain history for "${site.name}"; refreshing Continue history…`;
    }
  });
  return aliasAdded;
}

async function loadPagePreviews(
  cards = historyCards,
  prioritizedUrls = [],
  checkMissingFavoriteRedirects = false
) {
  const checkingMessage = "Checking recent pages for preview images…";
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

  let pageChecksComplete = false;
  const checkingStatusTimer = permittedCards.length > 0 && !historyFillInProgress
    ? scheduleSectionLoadingStatus(
      historyStatus,
      checkingMessage,
      () => !pageChecksComplete && !historyFillInProgress
    )
    : null;
  let metadataChanged = false;
  let redirectedBookmarkUpdated = false;
  await forEachWithConcurrency(permittedCards, 3, async (card) => {
    card.status.textContent = "Checking page…";
    try {
      const response = await fetchFavoritePreviewResponse(card.item.url);
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
      card.status.textContent = response.redirectedFrom
        ? `Preview found on ${new URL(response.responseUrl).hostname}.`
        : "Preview found.";
    } catch (error) {
      try {
        const bookmarkUpdated = await repairRedirectedFavoriteBookmark(card.item.url);
        redirectedBookmarkUpdated = bookmarkUpdated || redirectedBookmarkUpdated;
        card.status.textContent = bookmarkUpdated
          ? "Favorite bookmark updated after redirect; refreshing history…"
          : `No preview: ${error.message}`;
      } catch (repairError) {
        card.status.textContent =
          `No preview: ${error.message}. Could not update its bookmark: ${repairError.message}`;
      }
    }
  });
  if (checkMissingFavoriteRedirects) {
    redirectedBookmarkUpdated =
      await repairFavoriteBookmarksWithoutHistory() || redirectedBookmarkUpdated;
  }
  pageChecksComplete = true;
  if (checkingStatusTimer !== null) {
    clearTimeout(checkingStatusTimer);
    if (historyStatus.textContent === checkingMessage) {
      historyStatus.textContent = "";
    }
  }
  if (metadataChanged) {
    await savePreviewMetadataCache();
  }
  if (redirectedBookmarkUpdated) {
    scheduleBookmarkRefresh();
    return false;
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
  renderRandomVideoSection();

  const permissionNeeded = pagesWithoutPermission > 0 || imagesWithoutPermission > 0;
  if (permissionNeeded) {
    const missingAccess = [];
    if (pagesWithoutPermission > 0) {
      missingAccess.push(`${pagesWithoutPermission} page site${pagesWithoutPermission === 1 ? "" : "s"}`);
    }
    if (imagesWithoutPermission > 0) {
      missingAccess.push(`${imagesWithoutPermission} image host${imagesWithoutPermission === 1 ? "" : "s"}`);
    }
    const message = `${missingAccess.join(" and ")} need access. Select Allow all sites above to load them automatically.`;
    previewPhase = "pages";
    loadPreviewsButton.disabled = false;
    loadPreviewsButton.textContent = "Load previews";
    setHistoryApprovalStatus(message);
  } else if (cards.some(needsPagePreviewCheck) || cards.some(needsThumbnailLoad)) {
    previewPhase = "pages";
    loadPreviewsButton.disabled = false;
    loadPreviewsButton.textContent = "Try again";
    if (historyStatus.textContent === checkingMessage) {
      historyStatus.textContent = "";
    }
  } else {
    historyStatus.textContent = "";
    previewPhase = "done";
    updatePreviewLoadButton();
  }
  return !permissionNeeded;
}

async function loadAvailableThumbnails(cards, prioritizedUrls = []) {
  const loadingMessage = "Loading available thumbnails…";
  let thumbnailLoadComplete = false;
  const loadingStatusTimer = !historyFillInProgress
    ? scheduleSectionLoadingStatus(
      historyStatus,
      loadingMessage,
      () => !thumbnailLoadComplete && !historyFillInProgress
    )
    : null;
  await forEachWithConcurrency(cards, 3, async (card) => {
    card.status.textContent = "Loading preview…";
    try {
      await loadThumbnail(card);
    } catch (error) {
      card.status.textContent = `Could not load image: ${error.message}`;
    }
  });
  thumbnailLoadComplete = true;
  if (loadingStatusTimer !== null) {
    clearTimeout(loadingStatusTimer);
  }

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
    renderVideoPlaylists();
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
  if (historyStatus.textContent === loadingMessage) {
    historyStatus.textContent = "";
  }
}

async function loadBookmarks() {
  automaticSectionsDataReady = false;
  bookmarkStatus.textContent = "Reading your Firefox bookmarks…";
  const treePromise = withTimeout(
    browser.bookmarks.getTree(),
    BOOKMARKS_TIMEOUT_MS,
    "Firefox bookmarks did not respond within 5 seconds."
  ).then(
    (tree) => ({ ok: true, tree }),
    (error) => ({ ok: false, error })
  );
  let saved;
  try {
    saved = await browser.storage.local.get([
      "bookmarkFolderIds",
      "bookmarkFolderId",
      "bookmarkRedirectAliases",
      "faviconCache",
      "shortcutPreferences",
      "continueSectionCollapsed",
      "dashboardSectionOrder",
      "videoPlaylists",
      "selectedVideoPlaylistId"
    ]);
  } catch (error) {
    dashboardSections.applyOrder([]);
    throw error;
  }
  dashboardSections.applyOrder(saved.dashboardSectionOrder);
  videoPlaylists = normalizeVideoPlaylists(saved.videoPlaylists);
  selectedVideoPlaylistId = videoPlaylists.some((playlist) =>
    playlist.id === saved.selectedVideoPlaylistId
  )
    ? saved.selectedVideoPlaylistId
    : DEFAULT_VIDEO_PLAYLIST_ID;
  renderVideoPlaylists();
  const treeResult = await treePromise;
  if (!treeResult.ok) {
    throw treeResult.error;
  }
  const tree = treeResult.tree;
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
  const bookmarkIds = new Set();
  const collectBookmarkIds = (node) => {
    if (typeof node.url === "string") {
      bookmarkIds.add(node.id);
    }
    for (const child of node.children ?? []) {
      collectBookmarkIds(child);
    }
  };
  collectBookmarkIds(root);
  bookmarkRedirectAliases = normalizeBookmarkRedirectAliases(
    saved.bookmarkRedirectAliases,
    bookmarkIds
  );
  if (JSON.stringify(saved.bookmarkRedirectAliases ?? {}) !==
      JSON.stringify(bookmarkRedirectAliases)) {
    await browser.storage.local.set({ bookmarkRedirectAliases });
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
  const allowedHistoryItems = historyItems.filter((item) => isBookmarkedWebsite(item.url));
  const historyItemsChanged = allowedHistoryItems.length !== historyItems.length ||
    allowedHistoryItems.some((item, index) => item.url !== historyItems[index]?.url);
  renderFavoriteHistory(allowedHistoryItems);
  if (historyItemsChanged) {
    renderHistory(allowedHistoryItems);
  }
  renderBookmarks(bookmarkGroups);
  bookmarkStatus.textContent = "";
}

function scheduleBookmarkRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    if (historyFillInProgress || historyInitialBatchLoading || historyLoadInProgress) {
      scheduleBookmarkRefresh();
      return;
    }
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

function handleHistoryVisitsRemoved({ allHistory, urls }) {
  if (allHistory) {
    for (const timer of pendingHistoryDeleteTimers.values()) {
      clearTimeout(timer);
    }
    pendingHistoryDeleteTimers.clear();
    pendingHistoryDeleteUrls.clear();
    scheduleHistoryReconciliation();
    return;
  }
  const removedUrls = Array.isArray(urls) ? urls : [];
  let hasExternalRemoval = removedUrls.length === 0;
  for (const url of removedUrls) {
    if (!pendingHistoryDeleteUrls.has(url)) {
      hasExternalRemoval = true;
      continue;
    }
    clearTimeout(pendingHistoryDeleteTimers.get(url));
    pendingHistoryDeleteTimers.delete(url);
    pendingHistoryDeleteUrls.delete(url);
  }
  if (hasExternalRemoval) {
    scheduleHistoryReconciliation();
  }
}

async function deleteHistoryEntry(value, button) {
  const url = getHistoryUrl(value);
  if (!url) {
    historyStatus.textContent = "Could not delete this page: its history URL is invalid.";
    return;
  }
  if (pendingHistoryDeleteUrls.has(value)) {
    return;
  }
  button.disabled = true;
  pendingHistoryDeleteUrls.add(value);
  try {
    await browser.history.deleteUrl({ url: value });
  } catch (error) {
    pendingHistoryDeleteUrls.delete(value);
    clearTimeout(pendingHistoryDeleteTimers.get(value));
    pendingHistoryDeleteTimers.delete(value);
    historyStatus.textContent = `Could not delete this page from Firefox history: ${error.message}`;
    if (button.isConnected) {
      button.disabled = false;
    }
    return;
  }

  let localUpdateError = null;
  try {
    const removedCards = historyCards.filter((card) => card.item.url === value);
    for (const card of removedCards) {
      card.container.remove();
    }
    historyCards = historyCards.filter((card) => card.item.url !== value);
    historyVisibleCount = Math.max(0, historyVisibleCount - removedCards.length);
    historyItems = historyItems.filter((item) => item.url !== value);
    historySeenUrls.delete(value);
    if (historySnapshot) {
      historySnapshot = {
        ...historySnapshot,
        items: (Array.isArray(historySnapshot.items) ? historySnapshot.items : [])
          .filter((item) => item.url !== value)
      };
      try {
        await browser.storage.local.set({ historySnapshot });
      } catch (error) {
        localUpdateError = error;
        scheduleHistoryReconciliation();
      }
    }
    updateHistoryFilterOptions();
    updateHistoryFilterStatus();
    updateVisibleHistory();
    updateLoadMoreHistoryButton();
    renderFavoriteHistory(historyItems);
    renderRandomVideoSection();
    updatePreviewLoadButton();
  } catch (error) {
    localUpdateError = error;
    scheduleHistoryReconciliation();
  }
  historyStatus.textContent = localUpdateError
    ? `Deleted visits from Firefox, but Joydash could not fully update its local history: ${localUpdateError.message}`
    : `Deleted all visits to ${url.hostname} from Firefox history.`;
  if (pendingHistoryDeleteUrls.has(value)) {
    const timer = window.setTimeout(() => {
      pendingHistoryDeleteUrls.delete(value);
      pendingHistoryDeleteTimers.delete(value);
    }, 5_000);
    pendingHistoryDeleteTimers.set(value, timer);
  }
  if (button.isConnected) {
    button.disabled = false;
  }
}

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

videoPlaylistSelect.addEventListener("change", async () => {
  setVideoPlaylistStatus("");
  const previousPlaylistId = selectedVideoPlaylistId;
  const previousDisplayLimit = videoPlaylistDisplayLimit;
  selectedVideoPlaylistId = videoPlaylistSelect.value;
  videoPlaylistDisplayLimit = getVideoPlaylistBatchSize();
  renderVideoPlaylists();
  try {
    await browser.storage.local.set({ selectedVideoPlaylistId });
  } catch (error) {
    selectedVideoPlaylistId = previousPlaylistId;
    videoPlaylistDisplayLimit = previousDisplayLimit;
    renderVideoPlaylists();
    setVideoPlaylistStatus(`Could not save playlist selection: ${error.message}`);
  }
});

loadMissingVideoPlaylistPreviewsButton.addEventListener("click", () => {
  const candidates = getVideoPlaylistPreviewRecoveryCandidates();
  for (const item of candidates) {
    videoPlaylistAutoRecoveryAttemptedUrls.add(item.url);
  }
  void loadMissingVideoPlaylistPreviews({ candidates });
});

createVideoPlaylistForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createVideoPlaylist(newVideoPlaylistNameInput.value);
  } catch (error) {
    setVideoPlaylistStatus(`Could not create playlist: ${error.message}`);
  }
});

deleteVideoPlaylistButton.addEventListener("click", () => {
  void deleteSelectedVideoPlaylist();
});

addToPlaylistForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await addPendingVideoToPlaylist();
  } catch (error) {
    addToPlaylistStatus.textContent = `Could not save video: ${error.message}`;
  }
});

cancelAddToPlaylistButton.addEventListener("click", () => {
  addToPlaylistDialog.close();
});

addToPlaylistDialog.addEventListener("close", () => {
  pendingVideoPlaylistItem = null;
});

addToPlaylistDialog.addEventListener("click", (event) => {
  if (event.target === addToPlaylistDialog) {
    addToPlaylistDialog.close();
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  for (const popup of document.querySelectorAll("details[open]")) {
    if (!popup.contains(target)) {
      popup.open = false;
    }
  }
});

loadMoreVideoPlaylistButton.addEventListener("click", () => {
  if (loadMoreVideoPlaylistButton.hidden) {
    return;
  }
  videoPlaylistAnimationStartIndex = videoPlaylistDisplayLimit;
  videoPlaylistDisplayLimit += getMoreVideoPlaylistBatchSize();
  renderVideoPlaylists();
});

showLessVideoPlaylistButton.addEventListener("click", () => {
  if (videoPlaylistDisplayLimit <= getVideoPlaylistBatchSize()) {
    return;
  }
  videoPlaylistDisplayLimit = getVideoPlaylistBatchSize();
  renderVideoPlaylists();
});

historyHoverPreviewSaveButton.addEventListener("click", () => {
  const activeItem = historyHoverPreviews.getActiveItem();
  if (activeItem) {
    openAddToPlaylistDialog({ ...activeItem, videoPage: true });
  }
});
historyHoverPreviewDeleteButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const activeItem = historyHoverPreviews.getActiveItem();
  if (activeItem) {
    void deleteHistoryEntry(activeItem.url, historyHoverPreviewDeleteButton);
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
  const previewUrls = new Set(videoPlaylistSessionPosters.keys());
  for (const url of Object.keys(previewCache)) {
    previewUrls.add(getHistoryUrl(url)?.href ?? url);
  }
  const savedPreviewCount = previewUrls.size;
  if (savedPreviewCount === 0) {
    historyStatus.textContent = "There is no saved poster art to clear.";
    return;
  }
  const confirmed = window.confirm(
    `Clear ${savedPreviewCount} preview${savedPreviewCount === 1 ? "" : "s"} from this device?`
  );
  if (!confirmed) {
    return;
  }
  clearPreviewsButton.disabled = true;
  previewCacheClearVersion += 1;
  try {
    await browser.storage.local.set({
      previewCache: {},
      previewCacheClearedByUser: true
    });
    previewCache = {};
    videoPlaylistSessionPosters.clear();
    previewCacheClearedByUser = true;
    renderVideoPlaylists();
    randomVideoExploredUrls.clear();
    for (const card of historyCards) {
      card.posterDataUrl = null;
      card.posterVersion = 0;
      card.status.textContent = "";
      card.container.hidden = true;
      setHistoryPlaceholder(
        card.imageFrame,
        hasActiveHistoryFilters() || isVideoOnlyFilterEnabled() ? "Preview not loaded" : "Your next favorite"
      );
    }
    updateVisibleHistory();
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

loadMoreHistoryButton.addEventListener("click", async () => {
  if (historyFillInProgress || loadMoreHistoryButton.hidden) {
    return;
  }
  const wasVisibilityDeferred = historyVisibilityDeferred;
  historyVisibilityDeferred = true;
  document.documentElement.classList.add("history-pagination-loading");
  loadMoreHistoryButton.disabled = true;
  historyCardAnimationStartIndex = historyCards.length;
  historyDisplayLimit += getMoreHistoryBatchSize();
  try {
    await fillHistoryBatch(historyDisplayLimit);
  } catch (error) {
    historyStatus.textContent = `Could not load previews: ${error.message}`;
  } finally {
    historyCardAnimationStartIndex = null;
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
    const previewsLoaded = await loadPagePreviews(historyCards, [], true);
    if (previewsLoaded) {
      await fillHistoryBatch(historyDisplayLimit);
    }
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
  if (!document.hidden) {
    observeVideoPlaylistSection();
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
browser.history?.onVisitRemoved?.addListener(handleHistoryVisitsRemoved);
discreetMode.initialize()
  .then(loadBookmarks)
  .then(loadHistoryAfterBookmarks)
  .catch((error) => {
    if (!discreetMode.isInitialized()) {
      discreetMode.showInitializationError(error);
      return;
    }
    dashboardSectionStack.hidden = false;
    const recentHistorySection = dashboardSections.getSections().find((section) =>
      section.dataset.dashboardSection === "recent-history"
    );
    if (recentHistorySection) {
      recentHistorySection.hidden = false;
    }
    showBookmarkLoadError(error);
    if (discreetMode.isCoverActive()) {
      discreetMode.setStatus(`Bookmarks unavailable: ${error.message}`);
    }
  });
