export default function RecentHistorySection() {
  return (
    <section
      id="recent-history-section"
      className="automatic-history-section dashboard-content-section"
      data-dashboard-section="recent-history"
      data-dashboard-section-label="Recent history"
      aria-labelledby="history-heading"
      hidden
    >
      <div className="section-heading recent-history-heading">
        <div className="recent-history-copy">
          <div className="history-heading-title">
            <h2 id="history-heading">Continue where you left off</h2>
            <details className="history-info">
              <summary aria-label="Preview information" title="Preview information">
                <img className="ui-icon" src="icons/ui/info.svg" alt="" />
              </summary>
              <div className="history-info-popover">
                <p className="history-info-heading">Preview details</p>
                <p id="history-info-status" className="history-info-status" role="status" aria-live="polite" />
                <p className="history-info-description">
                  Counts reflect pages with usable poster images.
                </p>
              </div>
            </details>
          </div>
          <p id="history-section-description" className="section-description">
            <span className="section-description-default">
              Recent pages and video previews from sites in your selected bookmark folder.
            </span>
            <span id="bookmark-status" className="section-description-status" role="status" aria-live="polite" />
            <span id="history-status" className="section-description-status" role="status" aria-live="polite" />
          </p>
        </div>
      </div>
      <div className="history-filters" role="search" aria-label="Filter history">
        <div className="history-search-control">
          <img className="ui-icon history-search-icon" src="icons/ui/search.svg" alt="" />
          <input
            id="history-search"
            type="search"
            placeholder="Search title, site, or URL"
            aria-label="Search history by title, site, or URL"
            autoComplete="off"
          />
          <button
            id="clear-history-search"
            className="text-button history-clear-search"
            type="button"
            aria-label="Clear history search"
            hidden
          >
            Clear
          </button>
        </div>
        <select id="history-site-filter" aria-label="Filter history by site">
          <option value="">All bookmarked sites</option>
        </select>
        <select id="history-date-filter" aria-label="Filter history by date">
          <option value="">Any date</option>
          <option value="3h">Past 3 hours</option>
          <option value="8h">Past 8 hours</option>
          <option value="24h">Past 24 hours</option>
          <option value="7d">Past 7 days</option>
          <option value="30d">Past 30 days</option>
        </select>
        <div className="history-filter-actions">
          <label className="video-only-filter">
            <input id="history-video-only" type="checkbox" defaultChecked />
            <span>Videos only</span>
          </label>
          <label className="video-only-filter" title="Show videos without previews">
            <input
              id="history-include-no-preview"
              type="checkbox"
              aria-label="Show videos without previews"
            />
            <span>No preview</span>
          </label>
          <button id="reset-history-filters" className="text-button history-filter-reset" type="button">
            Reset filters
          </button>
        </div>
      </div>
      <p id="history-filter-status" className="history-filter-status" role="status" aria-live="polite" />
      <div id="history-grid" className="history-grid" />
      <p id="history-empty" className="empty-state" hidden />
      <div className="history-pagination">
        <button id="load-more-history" className="text-button load-more-button" type="button" hidden>
          View more
        </button>
        <button id="show-less-history" className="text-button show-less-button" type="button" hidden>
          Show less
        </button>
      </div>
    </section>
  );
}
