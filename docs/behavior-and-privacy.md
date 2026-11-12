# Behavior, caching, and privacy

## What Joydash shows

The selected Firefox bookmark folder controls both the shortcuts shelf and the history results. Joydash shows recent pages only from hosts bookmarked directly in that folder. The shelf contains direct website bookmarks as icon-only tiles in one horizontally scrollable row. Choose **Arrange** to drag shortcuts into a new order, hide shortcuts, or restore hidden shortcuts. This only changes the local shelf layout; it does not change which bookmarked sites are included in history. Add or remove bookmarks in Firefox, or choose another folder, to change the available shortcuts.

The **Continue where you left off** section can be collapsed; its visibility preference is stored locally. The history grid and side History list share search, site, and date filters. **Videos only** and **No preview** affect the grid only: video-only mode is on by default, and video pages without a usable poster are hidden unless **No preview** is enabled. The History list shows matching pages from bookmarked sites. **Clear** removes the text query; **Reset filters** restores the default filters. **View more** searches farther back in history, and newly loaded poster thumbnails fade in smoothly as they appear.

Below the recent-video grid, **From your favorite sites** groups saved video posters under bookmarked site names. Its selector shows all bookmarked sites by default or focuses the section on one site. The arrows move through preview rows, with a previous-row button available after moving forward. When the section becomes visible, Joydash checks up to two recent history pages per bookmarked site for usable posters; the all-sites scan is capped at 16 checks, while focusing one site prioritizes checks there. It does not request new permissions. Sites with no recent page, no existing permission, or no usable video image may remain empty. **Random previews** selects from saved posters across the full loaded history range, rather than limiting the slideshow to a day, and advances to new pairs every five seconds with a slow crossfade. The top arrows can revisit up to three previous pairs; opening a preview removes any pair containing it from that short history. When a direct clip is available and reduced motion is off, it plays muted for that interval. Both cards pause when the section is off-screen, the document is hidden, or the dashboard is covered. Reduced-motion mode keeps the slow opacity fades but disables clips and scaling motion. Cards use the same hover and keyboard-focus highlight as other previews. If a clip cannot be played, Joydash shows that page's saved poster instead.

**Cover Joydash** replaces the dashboard with a neutral screen until you reveal it or close Firefox; the random reel pauses while covered. **Discreet settings** can disable the feature across browser restarts. Neither control requires additional permissions.

The side panel groups entries by site, newest first. It starts with five entries per site; **Load more** and **Show less** expand or collapse a site's list in groups of five. Hover or keyboard-focus an entry to see its saved poster or request a generic page image. Generic hover images are cached in memory only.

## Permissions and network requests

Joydash reads bookmarks and browsing history locally. Firefox 140 or later is required for its built-in data-consent prompt. The extension declares bookmark information, browsing activity, and website content because it reads this data locally and requests pages and preview images from approved origins.

Optional host permissions are requested as needed. An **Allow** button can open Firefox's permission prompt for a page or image host; permission is never requested automatically just because you hover. **Allow all sites** requests broad `<all_urls>` access. Even with that permission, Joydash limits preview requests to bookmarked sites in the selected history folder or shown in the favorite-sites section and their discovered image hosts, and requests favicons only from bookmarked origins. Third-party favicon services are not used. You can revoke permissions in Firefox's Add-ons Manager.

Page and image requests omit cookies and referrers, reject redirects, and are limited to 512 KB per page and 5 MB per image. Requests disclose your IP address and requested URL to the contacted site. No data is sent to the developer. Joydash does not request tab or cookie access.

The reel recognizes direct MP4, WebM, and Ogg sources exposed by a page's `<video>` or `<source>` elements; embedded players, encrypted streams, and script-only media URLs are not supported. Source checks are deferred until the reel is visible, check at most eight saved-video pages at a time, and skip pages with a recent check. Playback is attempted only if the media host already has permission; Joydash never requests new host permissions for a clip. The video element is muted, uses anonymous CORS and a no-referrer policy, and is unloaded after each five-second interval. The browser may buffer more data than is displayed during that interval, and some hosts may block playback; in either case the poster remains the fallback.

## Local history and preview cache

Joydash stores a local snapshot of up to 500 recent pages from bookmarked sites in the selected history folder. The favorite-sites section separately reads up to 500 recent browser history entries and locally filters them to bookmarked sites. On reload, the history snapshot normally checks Firefox for newer visits; it fully reconciles history at least daily and after folder/site changes or history removals.

The favorite-site selection and discreet-mode opt-out are stored locally in Firefox; the active cover and preview-row navigation history are kept only for the current browser session. Joydash does not track time spent on pages or video playback.

Video classifications, preview-image URLs, and detected direct video URLs are cached for up to seven days, with up to 250 entries. Up to 16 resized posters are retained locally, with available posters sampled across the loaded history range and bookmarked sites where possible. **Clear saved art** removes poster images but keeps history and preview metadata. Older posters may refresh from approved sites while the saved copy remains visible.

Image candidates with larger declared dimensions are preferred. Images are resized to at most 960 × 600, and each saved poster is capped at 400 KB. A site may not provide a usable or high-resolution image, and a poster is not guaranteed to be an actual video frame.
