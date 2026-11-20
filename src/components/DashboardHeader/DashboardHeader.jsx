export default function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <h1 id="dashboard-title" className="dashboard-title">Joydash</h1>
      <div className="history-actions" role="group" aria-label="Dashboard controls">
        <button id="toggle-discreet-mode" className="text-button" type="button" aria-pressed="false" hidden>
          Cover Joydash
        </button>
        <button id="toggle-continue-section" className="text-button" type="button" aria-expanded="true">
          Hide previews
        </button>
        <button id="load-previews" className="text-button preview-load-button" type="button">
          Load previews
        </button>
        <div className="bookmark-actions">
          <button
            id="enable-automatic-previews"
            className="text-button"
            type="button"
            title="Grants Joydash optional access to all websites so it can show the Home button and cover favorite pages; preview requests remain limited to your selected bookmark folder."
          >
            Allow all sites
          </button>
          <label className="folder-picker">
            <select id="bookmark-folder" aria-label="Choose a Firefox folder" disabled>
              <option>Loading folders...</option>
            </select>
          </label>
        </div>
        <details id="dashboard-settings" className="dashboard-settings">
          <summary aria-label="Dashboard settings" title="Dashboard settings">
            <img className="ui-icon" src="icons/ui/settings.svg" alt="" />
          </summary>
          <div className="dashboard-settings-popover">
            <label>
              <input id="show-home-button" type="checkbox" defaultChecked />
              <span>Show floating Home button</span>
            </label>
            <p className="dashboard-settings-description">
              With Allow all sites enabled, the Home button appears only in F11 full-screen mode. Covering favorite pages also requires Allow all sites.
            </p>
            <details id="discreet-mode-settings" className="discreet-mode-settings">
              <summary className="text-button">Discreet settings</summary>
              <div className="discreet-mode-popover">
                <label>
                  <input id="discreet-mode-enabled" type="checkbox" defaultChecked />
                  <span>Enable discreet mode</span>
                </label>
                <label>
                  <input id="cover-favorite-pages-enabled" type="checkbox" defaultChecked />
                  <span>Cover favorite website pages too</span>
                </label>
                <label className="discreet-mode-context-picker">
                  <span>Apply discreet mode in</span>
                  <select id="discreet-mode-context">
                    <option value="both">Both modes</option>
                    <option value="fullscreen">F11 full-screen only</option>
                    <option value="windowed">Windowed mode only</option>
                  </select>
                </label>
                <p>
                  Joydash opens covered the first time it loads each Firefox session. The cover and favorite-page controls are active only in the selected window mode. Reveal it to use the dashboard; it stays revealed until Firefox closes.
                </p>
              </div>
            </details>
            <button
              id="manage-dashboard-sections"
              className="text-button button-with-icon"
              type="button"
              aria-expanded="false"
              aria-controls="dashboard-section-arranger"
            >
              <img className="ui-icon" src="icons/ui/edit-pencil.svg" alt="" />
              <span>Arrange sections</span>
            </button>
            <button id="clear-previews" className="text-button button-with-icon" type="button">
              <img className="ui-icon" src="icons/ui/trash-can.svg" alt="" />
              <span>Clear saved art</span>
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
