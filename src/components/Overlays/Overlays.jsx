export default function Overlays() {
  return (
    <>
      <div
        id="history-hover-preview"
        className="history-hover-preview"
        role="group"
        aria-label="History preview"
        aria-hidden="true"
        inert
      >
        <img id="history-hover-preview-image" alt="" />
        <span id="history-hover-preview-title" className="history-hover-preview-title" />
        <span
          id="history-hover-preview-message"
          className="history-hover-preview-message"
          role="status"
          aria-live="polite"
        />
        <button
          id="history-hover-preview-save"
          className="preview-playlist-add preview-icon-link"
          type="button"
          aria-label="Add video to a playlist"
          title="Add to playlist"
          hidden
        >
          <img className="ui-icon preview-action-icon" src="icons/ui/bookmark.svg" alt="" />
        </button>
      </div>
      <dialog
        id="add-to-playlist-dialog"
        className="add-to-playlist-dialog"
        aria-labelledby="add-to-playlist-heading"
      >
        <form id="add-to-playlist-form">
          <h2 id="add-to-playlist-heading">Add to playlist</h2>
          <p id="add-to-playlist-item-title" className="add-to-playlist-item-title" />
          <label htmlFor="add-to-playlist-select">Choose a playlist</label>
          <select id="add-to-playlist-select" className="form-control" />
          <p id="add-to-playlist-status" role="status" aria-live="polite" />
          <div className="add-to-playlist-actions">
            <button className="text-button button-with-icon" type="submit">
              <img className="ui-icon ui-icon--small" src="icons/ui/bookmark.svg" alt="" />
              <span>Save video</span>
            </button>
            <button
              id="cancel-add-to-playlist"
              className="text-button button-with-icon"
              type="button"
            >
              <img className="ui-icon ui-icon--small" src="icons/ui/close.svg" alt="" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </dialog>
      <div
        id="discreet-cover"
        className="discreet-cover"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discreet-cover-heading"
      >
        <div className="discreet-cover-panel">
          <p className="eyebrow">PRIVATE SPACE</p>
          <h1 id="discreet-cover-heading">Joydash is covered</h1>
          <p id="discreet-cover-status" role="status" aria-live="polite">
            Preparing your dashboard…
          </p>
          <button id="reveal-discreet-cover" className="text-button" type="button" hidden>
            Show Joydash
          </button>
          <button id="disable-discreet-mode" className="discreet-cover-disable" type="button" hidden>
            Disable discreet mode
          </button>
        </div>
      </div>
    </>
  );
}
