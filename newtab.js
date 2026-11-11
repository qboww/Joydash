const bookmarkFolderSelect = document.querySelector("#bookmark-folder");
const bookmarkStatus = document.querySelector("#bookmark-status");
const bookmarkGrid = document.querySelector("#bookmark-grid");
const bookmarkEmpty = document.querySelector("#bookmark-empty");
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
const favoriteHistoryList = document.querySelector("#favorite-history-list");
const favoriteHistoryEmpty = document.querySelector("#favorite-history-empty");
const favoriteHistoryCount = document.querySelector("#favorite-history-count");
const historyHoverPreview = document.querySelector("#history-hover-preview");
const historyHoverPreviewImage = document.querySelector("#history-hover-preview-image");
const historyHoverPreviewTitle = document.querySelector("#history-hover-preview-title");
const historyHoverPreviewMessage = document.querySelector("#history-hover-preview-message");
const clearPreviewsButton = document.querySelector("#clear-previews");
const loadPreviewsButton = document.querySelector("#load-previews");

let bookmarkFolders = [];
let selectedBookmarkFolderId = "";
let allSitesPermissionGranted = false;
let bookmarkGroups = [];
let bookmarkedSites = new Map();
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
let historyFillInProgress = false;
let historyInitialBatchLoading = false;
let historyVisibilityDeferred = false;
let historyLoadInProgress = false;
let historyLoadRequested = false;
let previewCache = {};
let previewMetadataCache = {};
let historySnapshot = null;
let historySnapshotNeedsRefresh = false;
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
const MAX_POSTER_DATA_URL_LENGTH = 400_000;
const POSTER_QUALITY_VERSION = 2;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_FAVICON_BYTES = 256 * 1024;
const MAX_FAVICON_CACHE = 64;
const BOOKMARKS_TIMEOUT_MS = 5_000;

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
  favoriteHistoryList.replaceChildren();
  favoriteHistoryCount.textContent = "";
  favoriteHistoryEmpty.hidden = false;
  favoriteHistoryEmpty.textContent = "History is hidden until Firefox bookmarks are available.";
  loadPreviewsButton.disabled = true;
  loadMoreHistoryButton.hidden = true;
  showLessHistoryButton.hidden = true;
}

function getBookmarkFolders(root) {
  const folders = [];

  function visit(folder, parentPath) {
    if (!Array.isArray(folder.children)) {
      return;
    }

    const title = folder.title?.trim() || "Bookmarks";
    const path = [...parentPath, title];
    folders.push({ id: folder.id, label: path.join(" / ") });
    for (const child of folder.children) {
      if (Array.isArray(child.children)) {
        visit(child, path);
      }
    }
  }

  for (const child of root.children ?? []) {
    if (Array.isArray(child.children)) {
      visit(child, []);
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
  const url = getHistoryUrl(value);
  if (!url) {
    return null;
  }
  const labels = url.hostname.replace(/^www\./i, "").split(".");
  return labels
    .map((_, index) => labels.slice(index).join("."))
    .find((hostname) => bookmarkedSites.has(hostname)) ?? null;
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
  bookmarkEmpty.hidden = groups.length > 0;
  if (groups.length === 0) {
    bookmarkEmpty.textContent = bookmarkFolders.length === 0
      ? "No Firefox bookmark folders were found."
      : !selectedBookmarkFolderId
        ? "Choose a folder above to see its bookmarks."
        : "The selected Firefox bookmark folder is unavailable.";
    return;
  }

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
    if (group.items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state bookmark-group-empty";
      empty.textContent = "No website bookmarks in this folder.";
      row.append(empty);
      groupElement.append(headingRow, row);
      bookmarkGrid.append(groupElement);
      continue;
    }

    for (const bookmark of group.items) {
      const url = new URL(bookmark.url);
      const bookmarkLabel = bookmark.title?.trim() || url.hostname;
      const tile = document.createElement("article");
      tile.className = "bookmark-icon-tile";
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
      row.append(tile);
    }
    groupElement.append(headingRow, row);
    bookmarkGrid.append(groupElement);
  }

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
    Number.isFinite(entry.checkedAt) &&
    entry.checkedAt <= now &&
    now - entry.checkedAt < PREVIEW_METADATA_TTL_MS &&
    (entry.imageUrl === null ||
      (typeof entry.imageUrl === "string" &&
        entry.imageUrl.length <= 4096 &&
        getHistoryUrl(entry.imageUrl)))
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
  allSitesPermissionGranted = await browser.permissions.contains({
    origins: ["<all_urls>"]
  });
  enableAutomaticPreviewsButton.hidden = allSitesPermissionGranted;
  enableAutomaticPreviewsButton.disabled = allSitesPermissionGranted;
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
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.setAttribute("aria-label", `Open ${item.title?.trim() || url.hostname}`);
  card.hidden = true;
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
          if (!loadedPage) {
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
        if (!loadedPage) {
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
  }
}

function renderHistory(items) {
  historyItems = items;
  updateHistoryFilterOptions();
  renderFilteredHistory();
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
  favoriteHistoryCount.textContent = filteredItems.length > 0 ? `${filteredItems.length} pages` : "";
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
    if (pages.length > HISTORY_GROUP_PAGE_BATCH) {
      const actions = document.createElement("div");
      actions.className = "favorite-history-actions";
      if (visibleLimit < pages.length) {
        const loadMore = document.createElement("button");
        loadMore.className = "text-button favorite-history-action";
        loadMore.type = "button";
        loadMore.textContent = "Load more";
        loadMore.addEventListener("click", () => {
          historyGroupLimits.set(hostname, visibleLimit + HISTORY_GROUP_PAGE_BATCH);
          renderFavoriteHistory(items);
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

function normalizeHistorySnapshotItems(items) {
  return items
    .filter((item) =>
      item &&
      typeof item.url === "string" &&
      getHistoryUrl(item.url) &&
      Number.isFinite(item.lastVisitTime) &&
      isBookmarkedWebsite(item.url)
    )
    .map((item) => ({
      url: item.url,
      title: typeof item.title === "string" ? item.title : "",
      lastVisitTime: item.lastVisitTime
    }));
}

async function loadOlderHistoryPage() {
  if (!historyHasMoreResults || !Number.isFinite(historyOlderEndTime)) {
    return false;
  }
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
  renderFavoriteHistory(historyItems);
  return items.length > 0;
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
  const saved = await browser.storage.local.get([
    "historySnapshot",
    "historySnapshotNeedsRefresh",
    "previewCache",
    "previewMetadataCache"
  ]);
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
  const cachedUrls = Object.keys(validCache);
  if (cachedUrls.length > MAX_SAVED_POSTERS) {
    for (const staleUrl of cachedUrls.slice(0, cachedUrls.length - MAX_SAVED_POSTERS)) {
      delete validCache[staleUrl];
    }
  }
  const cacheWasPruned = Object.keys(savedCache).length !== Object.keys(validCache).length;
  previewCache = validCache;
  const savedMetadataCache = saved.previewMetadataCache &&
    typeof saved.previewMetadataCache === "object" &&
    !Array.isArray(saved.previewMetadataCache)
    ? saved.previewMetadataCache
    : {};
  const validMetadataCache = {};
  for (const [url, entry] of Object.entries(savedMetadataCache)) {
    if (isValidPreviewMetadata(url, entry, now)) {
      validMetadataCache[url] = entry;
    }
  }
  previewMetadataCache = validMetadataCache;
  trimPreviewMetadataCache();
  const metadataCacheWasPruned =
    Object.keys(savedMetadataCache).length !== Object.keys(previewMetadataCache).length;

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
  let storageWarning = "";
  try {
    await browser.storage.local.set(storageUpdates);
    historySnapshotNeedsRefresh = false;
  } catch (error) {
    storageWarning = `Could not save local reload data: ${error.message}`;
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
    renderFavoriteHistory(historyItems);
    if (storageWarning) {
      historyStatus.textContent = storageWarning;
    }
  }
}

function loadHistoryAfterBookmarks() {
  return loadRecentHistory().catch((error) => {
    historyStatus.textContent = `Could not read recent history: ${error.message}`;
    loadPreviewsButton.disabled = true;
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
  return /[?&](?:viewkey|video_id|videoid|watch|v)=([^&]{3,})/i.test(query);
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
    }
  ];
  const candidates = [];
  for (const metadata of imageMetadata) {
    const width = Number(document.querySelector(metadata.widthSelector)?.getAttribute("content"));
    const height = Number(document.querySelector(metadata.heightSelector)?.getAttribute("content"));
    const declaredSize = Number.isFinite(width) && width > 0
      ? width * (Number.isFinite(height) && height > 0 ? height : 1)
      : 0;
    for (const meta of document.querySelectorAll(metadata.selector)) {
      const content = meta.getAttribute("content")?.trim();
      if (!content) {
        continue;
      }
      try {
        const imageUrl = getHistoryUrl(new URL(content, baseUrl).href);
        if (imageUrl) {
          candidates.push({ url: imageUrl.href, score: declaredSize });
        }
      } catch {
        continue;
      }
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

function findThumbnailUrl(html, baseUrl, onVideoPageDetected) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const isVideoPage = isIndividualVideoPage(document, baseUrl);
  onVideoPageDetected(isVideoPage);
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

async function loadPagePreviews(cards = historyCards) {
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
      card.imageUrl = findThumbnailUrl(
        html,
        response.responseUrl || card.item.url,
        (isVideoPage) => {
          card.videoPage = isVideoPage;
          card.item.videoPage = isVideoPage;
          card.metadataCheckedAt = Date.now();
          previewMetadataCache[card.item.url] = {
            videoPage: isVideoPage,
            imageUrl: null,
            checkedAt: card.metadataCheckedAt
          };
          metadataChanged = true;
          updateHistoryFilterStatus();
          updateVisibleHistory();
        }
      );
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
    await loadAvailableThumbnails(permittedImageCards);
  }

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

async function loadAvailableThumbnails(cards) {
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
  const cachedUrls = Object.keys(nextCache);
  if (cachedUrls.length > MAX_SAVED_POSTERS) {
    for (const staleUrl of cachedUrls.slice(0, cachedUrls.length - MAX_SAVED_POSTERS)) {
      delete nextCache[staleUrl];
    }
  }
  let savedLocally = true;
  if (loadedCount > 0) {
    try {
      await browser.storage.local.set({ previewCache: nextCache });
      previewCache = nextCache;
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
  bookmarkStatus.textContent = "Reading your Firefox bookmarks…";
  const [tree, saved] = await Promise.all([
    withTimeout(
      browser.bookmarks.getTree(),
      BOOKMARKS_TIMEOUT_MS,
      "Firefox bookmarks did not respond within 5 seconds."
    ),
    browser.storage.local.get(["bookmarkFolderIds", "bookmarkFolderId", "faviconCache"])
  ]);
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
  clearPreviewsButton.disabled = true;
  try {
    await browser.storage.local.set({ previewCache: {} });
    previewCache = {};
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
refreshAutomaticPreviewsButton();
browser.bookmarks?.onCreated?.addListener(scheduleBookmarkRefresh);
browser.bookmarks?.onChanged?.addListener(scheduleBookmarkRefresh);
browser.bookmarks?.onMoved?.addListener(scheduleBookmarkRefresh);
browser.bookmarks?.onRemoved?.addListener(scheduleBookmarkRefresh);
browser.bookmarks?.onChildrenReordered?.addListener(scheduleBookmarkRefresh);
browser.history?.onVisitRemoved?.addListener(scheduleHistoryReconciliation);
loadBookmarks()
  .then(loadHistoryAfterBookmarks)
  .catch((error) => {
    showBookmarkLoadError(error);
  });
