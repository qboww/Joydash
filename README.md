# Joydash

Joydash is a React-based Firefox home-page extension for bookmarks, recent history, and video or page previews from bookmarked sites.

## Features

- Arrange and hide shortcuts from the selected Firefox bookmark folder.
- Collapse the recent activity section; layout preferences stay on this device.
- Browse recent pages from sites bookmarked in a selected folder.
- Search and filter history by site and date.
- Browse preview rows from all bookmarked sites or focus on one site at a time.
- Rotate two random saved posters with smooth transitions, hover feedback, and short back/forward history; play muted direct clips when available and reduced motion is off.
- Save video previews from dashboard sections into Watch later or custom playlists.
- Start the dashboard covered on its first opening each Firefox session when discreet mode is enabled.
- See video previews and open recent pages from the history panel.
- Keep favorite bookmarks in a compact, scrollable shelf.
- Cache history and preview data locally in Firefox.
- Support Firefox for Android with a responsive dashboard layout.

## Frontend structure

- React components live in feature folders under `src/components/`; component-owned styles use a colocated CSS Module.
- `src/styles/dashboard.css` holds shared theme tokens, resets, controls, and styles that still serve the legacy dashboard/controller.
- Move styles into a component module as that component is migrated; keep shared styles in one place rather than copying them or creating empty modules.
- `src/legacyController.js` still renders some dynamic cards and expects stable DOM IDs, so keep its markup hooks unchanged until those features are migrated.

## Build and try it in Firefox for desktop

Node.js 20.19 or later and Firefox 140 or later are required.

1. Run `npm install`.
2. Run `npm run build`.
3. Open `about:debugging#/runtime/this-firefox`.
4. Select **Load Temporary Add-on...** and choose `dist/manifest.json`. After building, the root `manifest.json` also works and loads the built page from `dist`.
5. Approve the bookmarks and history permissions.
6. Open Firefox's home page and choose a bookmark folder.
7. Grant site access when prompted to load previews and favicons. **Allow all sites** grants broad optional host access; you can also grant access site by site.

Temporary add-ons are removed when Firefox closes. Install a signed add-on to keep Joydash installed across restarts. Joydash sets the home page; it does not replace new tabs.

To create the Mozilla Add-ons upload package, run `npm run package:amo` and upload the generated ZIP from `web-ext-artifacts/public/`. This uses Mozilla's `web-ext` packager; do not create the upload ZIP with Windows `Compress-Archive`, which may put backslashes in ZIP paths that AMO rejects.

## Use Joydash in Firefox for Android

Firefox for Android 142 or later is required.

1. Install the Android-compatible signed release from its Mozilla Add-ons page in Firefox for Android.
2. Open Firefox's home page and choose a bookmark folder.
3. Approve the bookmarks and history permissions.
4. Grant site access when prompted to load previews and favicons. You can allow access site by site.

Joydash is designed for the browser home page, not new tabs. Its layout adapts to narrow screens; browser-specific controls such as the desktop window fullscreen Home button are not part of the Android workflow.

To temporarily run the extension from source while developing, use Mozilla's [Firefox for Android extension guide](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/), which covers `web-ext run -t firefox-android` and device setup.

## Privacy

Bookmarks and history are read locally. When you allow site access, Joydash may request page and image URLs from bookmarked sites for previews and favicons, and may stream a direct video URL for a muted preview. Page and image requests omit cookies and referrers; clip playback uses anonymous CORS and no referrer. Sites can see your IP address and the requested URLs. The developer does not receive this data.

For details on filtering, caching, permissions, and request limits, see [Behavior, caching, and privacy](docs/behavior-and-privacy.md).

## Credits

The Joydash monkey and interface icons are from [Icons8](https://icons8.com/).
