# Joydash

Joydash is a Firefox home-page dashboard for bookmarks, recent history, and video or page previews from bookmarked sites.

## Features

- Arrange and hide shortcuts from the selected Firefox bookmark folder.
- Collapse the recent activity section; layout preferences stay on this device.
- Browse recent pages from sites bookmarked in a selected folder.
- Search and filter history by site and date.
- Browse preview rows from all bookmarked sites or focus on one site at a time.
- Rotate two random saved posters with smooth transitions, hover feedback, and short back/forward history; play muted direct clips when available and reduced motion is off.
- Cover the dashboard for the current Firefox session with discreet mode.
- See video previews and open recent pages from the history panel.
- Keep favorite bookmarks in a compact, scrollable shelf.
- Cache history and preview data locally in Firefox.

## Try it in Firefox

Firefox 140 or later is required.

1. Open `about:debugging#/runtime/this-firefox`.
2. Select **Load Temporary Add-on...** and choose this folder's `manifest.json`.
3. Approve the bookmarks and history permissions.
4. Open Firefox's home page and choose a bookmark folder.
5. Grant site access when prompted to load previews and favicons. **Allow all sites** grants broad optional host access; you can also grant access site by site.

Temporary add-ons are removed when Firefox closes. Install a signed add-on to keep Joydash installed across restarts. Joydash sets the home page; it does not replace new tabs.

## Privacy

Bookmarks and history are read locally. When you allow site access, Joydash may request page and image URLs from bookmarked sites for previews and favicons, and may stream a direct video URL for a muted preview. Page and image requests omit cookies and referrers; clip playback uses anonymous CORS and no referrer. Sites can see your IP address and the requested URLs. The developer does not receive this data.

For details on filtering, caching, permissions, and request limits, see [Behavior, caching, and privacy](docs/behavior-and-privacy.md).

## Credits

The Joydash monkey icon is from [Icons8](https://icons8.com/).
