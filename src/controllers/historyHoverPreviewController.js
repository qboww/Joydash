export function createHistoryHoverPreviewController({
  document,
  window,
  preview,
  image,
  title,
  message,
  saveButton,
  deleteButton,
  getCachedPosterForUrl,
  getHistoryCards,
  getVideoPlaylistPreviewMetadata,
  getHistoryUrl,
  hasOriginPermission,
  fetchPreviewResponse,
  findPagePreviewImageUrl,
  fetchPreviewImageDataUrl,
  maxHtmlBytes,
  maxCachedPreviews,
  delayMs
}) {
  let activeEntry = null;
  let activeItem = null;
  let showTimer;
  let hideTimer;
  const previewCache = new Map();
  const previewRequests = new Map();

  function hide() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    showTimer = null;
    hideTimer = null;
    activeEntry = null;
    activeItem = null;
    preview.classList.remove("is-visible");
    preview.setAttribute("aria-hidden", "true");
    image.removeAttribute("src");
    image.style.display = "";
    title.textContent = "";
    message.textContent = "";
    saveButton.hidden = true;
    deleteButton.hidden = true;
  }

  function isActive(link) {
    return activeEntry === link &&
      (link.matches(":hover") ||
        link === document.activeElement ||
        preview.matches(":hover") ||
        preview.contains(document.activeElement));
  }

  function hideFor(link) {
    if (activeEntry !== link ||
        link.matches(":hover") ||
        link === document.activeElement ||
        preview.matches(":hover") ||
        preview.contains(document.activeElement)) {
      return;
    }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (activeEntry === link && !isActive(link)) {
        hide();
      }
    }, 250);
  }

  function update(link, item, dataUrl, statusMessage) {
    if (activeEntry !== link) {
      return;
    }
    const rect = link.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 24);
    const actionButtonsHeight = saveButton.hidden && deleteButton.hidden ? 0 : 44;
    const height = (dataUrl ? width * 0.5625 + 48 : 104) + actionButtonsHeight;
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
      image.src = dataUrl;
      image.style.display = "";
    } else {
      image.removeAttribute("src");
      image.style.display = "none";
    }
    title.textContent =
      link.querySelector(".favorite-history-title")?.textContent ||
      getHistoryUrl(item.url)?.hostname ||
      "";
    message.textContent = statusMessage;
    preview.style.width = `${width}px`;
    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;
    preview.setAttribute("aria-hidden", "false");
    preview.classList.add("is-visible");
  }

  function rememberPreview(url, dataUrl) {
    previewCache.delete(url);
    previewCache.set(url, dataUrl);
    while (previewCache.size > maxCachedPreviews) {
      previewCache.delete(previewCache.keys().next().value);
    }
  }

  class UnapprovedPreviewHostError extends Error {
    constructor(url, hostType) {
      super(`${hostType === "image" ? "Image host" : "Page site"} access is not approved.`);
      this.name = "UnapprovedHistoryPreviewHostError";
      this.url = url;
      this.hostType = hostType;
    }
  }

  async function fetchGenericPreview(pageUrl) {
    if (!await hasOriginPermission(pageUrl)) {
      throw new UnapprovedPreviewHostError(pageUrl, "page");
    }
    const response = await fetchPreviewResponse(pageUrl, maxHtmlBytes, "text/html");
    const html = new TextDecoder().decode(response.bytes);
    const imageUrl = findPagePreviewImageUrl(html, response.responseUrl || pageUrl);
    if (!await hasOriginPermission(imageUrl)) {
      throw new UnapprovedPreviewHostError(imageUrl, "image");
    }
    return fetchPreviewImageDataUrl(imageUrl);
  }

  function showPermissionError(link, item, error) {
    const hostType = error.hostType === "image" ? "image host" : "page site";
    update(
      link,
      item,
      null,
      `This ${hostType} needs access. Select Allow all sites above to load this preview.`
    );
  }

  async function loadGenericPreview(link, item) {
    if (!isActive(link)) {
      return;
    }
    update(link, item, null, "Checking site access…");
    let request = previewRequests.get(item.url);
    if (!request) {
      request = fetchGenericPreview(item.url);
      previewRequests.set(item.url, request);
    }
    try {
      const dataUrl = await request;
      rememberPreview(item.url, dataUrl);
      if (isActive(link)) {
        update(link, item, dataUrl, "");
      }
    } catch (error) {
      if (isActive(link)) {
        if (error instanceof UnapprovedPreviewHostError) {
          showPermissionError(link, item, error);
        } else {
          update(link, item, null, `Preview unavailable: ${error.message}`);
        }
      }
    } finally {
      if (previewRequests.get(item.url) === request) {
        previewRequests.delete(item.url);
      }
    }
  }

  function show(link, item) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    activeEntry = link;
    activeItem = item;
    const cached = getCachedPosterForUrl(item.url);
    const loadedCard = getHistoryCards().find((card) => card.item.url === item.url);
    const isVideoPage = item.videoPage === true ||
      cached?.videoPage === true ||
      loadedCard?.videoPage === true ||
      getVideoPlaylistPreviewMetadata(item)?.videoPage === true;
    saveButton.hidden = !isVideoPage;
    saveButton.setAttribute(
      "aria-label",
      `Add ${item.title?.trim() || getHistoryUrl(item.url)?.hostname || "video"} to a playlist`
    );
    const itemLabel = item.title?.trim() || getHistoryUrl(item.url)?.hostname || "page";
    deleteButton.hidden = false;
    deleteButton.setAttribute(
      "aria-label",
      `Delete all visits to ${itemLabel} from Firefox history`
    );
    const posterDataUrl = cached?.videoPage === true && cached.dataUrl
      ? cached.dataUrl
      : loadedCard?.posterDataUrl;
    if (typeof posterDataUrl === "string" &&
        posterDataUrl.startsWith("data:image/jpeg;base64,")) {
      update(link, item, posterDataUrl, "");
      return;
    }

    const genericPreview = previewCache.get(item.url);
    if (genericPreview) {
      update(link, item, genericPreview, "");
      return;
    }
    update(link, item, null, "Checking site access…");
    showTimer = setTimeout(() => {
      if (isActive(link)) {
        void loadGenericPreview(link, item);
      }
    }, delayMs);
  }

  preview.addEventListener("pointerenter", () => {
    clearTimeout(hideTimer);
  });
  preview.addEventListener("pointerleave", () => {
    if (activeEntry) {
      hideFor(activeEntry);
    }
  });
  preview.addEventListener("focusout", () => {
    const link = activeEntry;
    if (!link) {
      return;
    }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (activeEntry === link && !isActive(link)) {
        hide();
      }
    }, 0);
  });
  window.addEventListener("scroll", hide, true);
  window.addEventListener("resize", hide);

  return {
    hide,
    hideFor,
    show,
    getActiveItem: () => activeItem
  };
}
