function RandomVideoSlot({ number }) {
  return (
    <div className="random-video-slot">
      <a className="random-video-slot-link" href="#" target="_blank" rel="noopener noreferrer">
        <img
          id={`random-video-previous-poster-${number}`}
          className="random-video-previous-poster"
          alt=""
          aria-hidden="true"
          hidden
        />
        <img id={`random-video-poster-${number}`} className="random-video-poster" alt="" hidden />
        <video
          id={`random-video-player-${number}`}
          className="random-video-player"
          muted
          playsInline
          preload="metadata"
          aria-label={`Muted five-second video preview, ${number === 1 ? "first" : "second"} slot`}
          hidden
        />
        <div className="random-video-caption">
          <span id={`random-video-title-${number}`} className="random-video-title" />
          <span id={`random-video-site-${number}`} className="random-video-site" />
        </div>
      </a>
      <button
        className="preview-playlist-add preview-icon-link random-video-playlist-add"
        type="button"
        aria-label={`Add ${number === 1 ? "first" : "second"} random preview to a playlist`}
        title="Add to playlist"
      >
        <img className="ui-icon preview-action-icon" src="icons/ui/bookmark.svg" alt="" />
      </button>
      <button
        className="preview-playlist-add preview-icon-link random-video-history-delete"
        type="button"
        aria-label={`Delete ${number === 1 ? "first" : "second"} random preview from Firefox history`}
        title="Delete from Firefox history"
        hidden
      >
        <img className="ui-icon preview-action-icon" src="icons/ui/trash-can.svg" alt="" />
      </button>
    </div>
  );
}

export default function RandomVideoSection() {
  return (
    <section
      id="random-video-section"
      className="automatic-history-section random-video-section"
      data-dashboard-section="random-previews"
      data-dashboard-section-label="Random previews"
      aria-labelledby="random-video-heading"
      hidden
    >
      <div className="automatic-history-heading random-video-heading-row">
        <div>
          <h3 id="random-video-heading">Random previews</h3>
          <p id="random-video-description" className="section-description">
            <span className="section-description-default">
              Two previews rotate every five seconds; muted clips play when available. Use the top arrows to revisit up to three pairs you haven't opened.
            </span>
            <span
              id="random-video-status"
              className="section-description-status"
              role="status"
              aria-live="polite"
            />
          </p>
        </div>
        <div className="random-video-heading-controls">
          <button
            id="random-video-back"
            className="random-video-nav"
            type="button"
            aria-label="Go back to previous previews"
            title="Previous previews"
            disabled
          >
            ‹
          </button>
          <button
            id="random-video-forward"
            className="random-video-nav"
            type="button"
            aria-label="Show next previews"
            title="Next previews"
            disabled
          >
            ›
          </button>
        </div>
      </div>
      <div className="random-video-carousel">
        <div className="random-video-stage">
          <RandomVideoSlot number={1} />
          <RandomVideoSlot number={2} />
        </div>
      </div>
    </section>
  );
}
