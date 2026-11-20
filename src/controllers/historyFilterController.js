export function createHistoryFilterController({
  document,
  searchInput,
  clearSearchButton,
  siteFilter,
  dateFilter,
  videoOnlyFilter,
  includeNoPreviewFilter,
  resetButton,
  status,
  getItems,
  getHistoryUrl,
  getVisibleCount,
  hasMoreResults,
  isBusy,
  applyFilters,
  loadFilteredPreviews,
  debounceMs
}) {
  let debounceTimer;

  function hasActiveFilters() {
    return Boolean(searchInput.value.trim() || siteFilter.value || dateFilter.value);
  }

  function isVideoOnly() {
    return videoOnlyFilter.checked;
  }

  function getFilteredItems(items = getItems()) {
    const query = searchInput.value.trim().toLowerCase();
    const selectedSite = siteFilter.value;
    const dateFilterValue = dateFilter.value;
    const now = Date.now();
    const dateLimits = {
      "3h": now - 3 * 60 * 60 * 1000,
      "8h": now - 8 * 60 * 60 * 1000,
      "24h": now - 24 * 60 * 60 * 1000,
      "7d": now - 7 * 24 * 60 * 60 * 1000,
      "30d": now - 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = dateLimits[dateFilterValue] ?? null;

    return items.filter((item) => {
      const url = getHistoryUrl(item.url);
      if (!url || (selectedSite && url.hostname !== selectedSite)) {
        return false;
      }
      if (query &&
          !`${item.title ?? ""} ${item.url} ${url.hostname}`.toLowerCase().includes(query)) {
        return false;
      }
      return cutoff === null ||
        (Number.isFinite(item.lastVisitTime) && item.lastVisitTime >= cutoff);
    });
  }

  function updateOptions() {
    const selectedSite = siteFilter.value;
    const sites = [...new Set(getItems()
      .map((item) => getHistoryUrl(item.url)?.hostname)
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const allSitesOption = document.createElement("option");
    allSitesOption.value = "";
    allSitesOption.textContent = "All bookmarked sites";
    siteFilter.replaceChildren(allSitesOption);
    for (const site of sites) {
      const option = document.createElement("option");
      option.value = site;
      option.textContent = site;
      siteFilter.append(option);
    }
    if (sites.includes(selectedSite)) {
      siteFilter.value = selectedSite;
    }
  }

  function updateStatus(items = getFilteredItems()) {
    const videosOnly = isVideoOnly();
    const includeNoPreviewVideos = includeNoPreviewFilter.checked;
    if (!hasActiveFilters() && !videosOnly && !includeNoPreviewVideos) {
      status.textContent = "";
      return;
    }
    const verifiedVideos = videosOnly
      ? items.filter((item) => item.videoPage === true).length
      : items.length;
    const countLabel = videosOnly
      ? `${verifiedVideos} verified video page${verifiedVideos === 1 ? "" : "s"} in loaded history.`
      : `${items.length} matching page${items.length === 1 ? "" : "s"} in loaded history.`;
    const hasMoreToCheck = getVisibleCount() < items.length || hasMoreResults();
    const hasUnclassifiedItems = videosOnly &&
      items.some((item) => typeof item.videoPage !== "boolean");
    status.textContent = hasMoreToCheck
      ? `${countLabel} Select View more to check further history.`
      : hasUnclassifiedItems
        ? `${countLabel} Select Load previews to check remaining pages.`
        : countLabel;
  }

  function updateControls() {
    const disabled = isBusy();
    searchInput.disabled = disabled;
    clearSearchButton.disabled = disabled;
    clearSearchButton.hidden = !searchInput.value;
    siteFilter.disabled = disabled;
    dateFilter.disabled = disabled;
    videoOnlyFilter.disabled = disabled;
    includeNoPreviewFilter.disabled = disabled;
    resetButton.disabled = disabled ||
      (!hasActiveFilters() && isVideoOnly() && !includeNoPreviewFilter.checked);
  }

  function scheduleApply() {
    clearTimeout(debounceTimer);
    updateControls();
    debounceTimer = setTimeout(() => {
      if (isBusy()) {
        scheduleApply();
        return;
      }
      applyFilters();
      if (hasActiveFilters() || isVideoOnly() || includeNoPreviewFilter.checked) {
        void loadFilteredPreviews();
      }
    }, debounceMs);
  }

  searchInput.addEventListener("input", scheduleApply);
  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    scheduleApply();
    searchInput.focus();
  });
  siteFilter.addEventListener("change", scheduleApply);
  dateFilter.addEventListener("change", scheduleApply);
  videoOnlyFilter.addEventListener("change", scheduleApply);
  includeNoPreviewFilter.addEventListener("change", scheduleApply);
  resetButton.addEventListener("click", () => {
    searchInput.value = "";
    siteFilter.value = "";
    dateFilter.value = "";
    videoOnlyFilter.checked = true;
    includeNoPreviewFilter.checked = false;
    scheduleApply();
  });
  updateControls();

  return {
    hasActiveFilters,
    isVideoOnly,
    getFilteredItems,
    updateOptions,
    updateStatus,
    updateControls,
    isBusy
  };
}
