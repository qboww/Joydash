# Behavior, caching, and privacy

## What Joydash shows

The selected Firefox bookmark folder controls both the favorites shelf and the history results. Joydash shows recent pages only from hosts bookmarked directly in that folder. The favorites shelf contains direct website bookmarks as icon-only tiles in one horizontally scrollable row.

The history grid and side History list share search, site, and date filters. **Videos only** and **No preview** affect the grid only: video-only mode is on by default, and video pages without a usable poster are hidden unless **No preview** is enabled. The History list shows matching pages from bookmarked sites. **Clear** removes the text query; **Reset filters** restores the default filters. **View more** searches farther back in history.

The side panel groups entries by site, newest first. It starts with five entries per site; **Load more** and **Show less** expand or collapse a site's list in groups of five. Hover or keyboard-focus an entry to see its saved poster or request a generic page image. Generic hover images are cached in memory only.

## Permissions and network requests

Joydash reads bookmarks and browsing history locally. Firefox 140 or later is required for its built-in data-consent prompt. The extension declares bookmark information, browsing activity, and website content because it reads this data locally and requests pages and preview images from approved origins.

Optional host permissions are requested as needed. An **Allow** button can open Firefox's permission prompt for a page or image host; permission is never requested automatically just because you hover. **Allow all sites** requests broad `<all_urls>` access. Even with that permission, Joydash limits preview requests to bookmarked sites in the selected folder and their discovered image hosts, and requests favicons only from bookmarked origins. Third-party favicon services are not used. You can revoke permissions in Firefox's Add-ons Manager.

Requests omit cookies and referrers, reject redirects, and are limited to 512 KB per page and 5 MB per image. Requests disclose your IP address and requested URL to the contacted site. No data is sent to the developer. Joydash does not request tab or cookie access.

## Local history and preview cache

Joydash stores a local snapshot of up to 500 recent pages from bookmarked sites in the selected folder. On reload, it normally checks Firefox for newer visits; it fully reconciles history at least daily and after folder/site changes or history removals.

Video classifications and preview-image URLs are cached for up to seven days, with up to 250 entries. Up to 16 resized posters are retained locally. **Clear saved art** removes poster images but keeps history and preview metadata. Older posters may refresh from approved sites while the saved copy remains visible.

Image candidates with larger declared dimensions are preferred. Images are resized to at most 960 × 600, and each saved poster is capped at 400 KB. A site may not provide a usable or high-resolution image, and a poster is not guaranteed to be an actual video frame.
