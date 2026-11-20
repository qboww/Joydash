export function createPreviewPageParser({ getHistoryUrl, isSafeVideoSourceUrl }) {

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

  return {
    findPagePreviewImageUrl,
    findDirectVideoUrl,
    findThumbnailUrl
  };
}
