import { useLayoutEffect, useRef } from "react";
import "../../../discreet-cover-component.js";

function DiscreetCover() {
  const mountRef = useRef(null);

  useLayoutEffect(() => {
    const cover = globalThis.JoydashDiscreetCover.create(document);
    const mount = mountRef.current;
    mount.append(cover.element);
    return () => cover.element.remove();
  }, []);

  return <div ref={mountRef} />;
}

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
        <div id="history-hover-preview-actions">
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
          <button
            id="history-hover-preview-delete"
            className="preview-playlist-add preview-icon-link"
            type="button"
            aria-label="Delete this page from Firefox history"
            title="Delete from Firefox history"
            hidden
          >
            <img className="ui-icon preview-action-icon" src="icons/ui/trash-can.svg" alt="" />
          </button>
        </div>
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
      <DiscreetCover />
    </>
  );
}
