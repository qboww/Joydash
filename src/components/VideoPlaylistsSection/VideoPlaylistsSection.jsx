import styles from "./VideoPlaylistsSection.module.css";

export default function VideoPlaylistsSection() {
  return (
    <section
      id="video-playlists-section"
      className="automatic-history-section video-playlists-section"
      data-dashboard-section="video-playlists"
      data-dashboard-section-label="Playlists"
      aria-labelledby="video-playlists-heading"
      hidden
    >
      <div className={`automatic-history-heading ${styles.heading}`}>
        <div>
          <h3 id="video-playlists-heading">Playlists</h3>
          <p id="video-playlist-description" className="section-description">
            <span className="section-description-default">
              Save video previews from any section and pick them up later.
            </span>
            <span id="video-playlist-status" className="section-description-status" role="status" aria-live="polite" />
          </p>
        </div>
        <div className={styles.controls}>
          <button
            id="load-missing-video-playlist-previews"
            className="text-button"
            type="button"
          >
            Load missing previews
          </button>
          <label className={styles.picker}>
            <span>Playlist</span>
            <select id="video-playlist-select" className="form-control" aria-label="Choose a playlist" />
          </label>
          <form id="create-video-playlist-form" className={styles.createForm}>
            <input
              id="new-video-playlist-name"
              className="form-control"
              type="text"
              maxLength={60}
              placeholder="New playlist name"
              aria-label="New playlist name"
              autoComplete="off"
            />
            <button className="text-button" type="submit">Create</button>
          </form>
          <button
            id="delete-video-playlist"
            className="text-button button-with-icon"
            type="button"
          >
            <img className="ui-icon ui-icon--small" src="icons/ui/trash-can.svg" alt="" />
            <span>Delete playlist</span>
          </button>
        </div>
      </div>
      <div id="video-playlist-grid" className={`history-grid ${styles.grid}`} />
      <p id="video-playlist-empty" className={`empty-state ${styles.empty}`} hidden />
      <div className="history-pagination">
        <button
          id="load-more-video-playlist"
          className="text-button load-more-button"
          type="button"
          hidden
        >
          View more
        </button>
        <button
          id="show-less-video-playlist"
          className="text-button show-less-button"
          type="button"
          hidden
        >
          Show less
        </button>
      </div>
    </section>
  );
}
