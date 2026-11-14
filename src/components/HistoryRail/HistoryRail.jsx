export default function HistoryRail() {
  return (
    <aside className="history-rail" aria-labelledby="favorite-history-heading">
      <div className="history-rail-heading">
        <div className="history-rail-title">
          <h2 id="favorite-history-heading">History</h2>
          <details className="history-info history-rail-info">
            <summary aria-label="About History" title="About History">
              <img className="ui-icon" src="icons/ui/info.svg" alt="" />
            </summary>
            <div className="history-info-popover">
              <p className="history-info-heading">About History</p>
              <p className="history-info-description">
                This list shows recent visits to sites bookmarked in the folder selected for Continue where you left off. The search, site, and date filters above apply here too. Videos only and No preview affect the preview grid, not this list.
              </p>
            </div>
          </details>
        </div>
        <div className="history-rail-datetime">
          <time id="history-rail-date" className="history-rail-date" />
          <time id="history-rail-clock" className="history-rail-clock" aria-label="Local time" />
        </div>
      </div>
      <div id="favorite-history-list" className="favorite-history-list" />
      <p
        id="favorite-history-empty"
        className="empty-state history-rail-empty"
        role="status"
        aria-live="polite"
        hidden
      />
    </aside>
  );
}
