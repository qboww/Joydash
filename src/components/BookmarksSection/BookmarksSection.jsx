export default function BookmarksSection() {
  return (
    <section className="bookmarks-section" aria-label="Favorite bookmarks">
      <div className="shortcuts-heading">
        <div>
          <h2>Shortcuts</h2>
        </div>
        <button
          id="manage-shortcuts"
          className="text-button button-with-icon"
          type="button"
          aria-pressed="false"
        >
          <img className="ui-icon" src="icons/ui/edit-pencil.svg" alt="" />
          <span data-shortcut-label>Arrange</span>
        </button>
      </div>
      <p id="shortcuts-help" className="shortcuts-help" hidden>
        Reorder or hide shortcuts here. Hidden shortcuts can be restored; this does not change which sites contribute to history.
      </p>
      <div id="bookmark-grid" className="bookmark-grid" />
      <div id="hidden-shortcuts" className="hidden-shortcuts" hidden>
        <span className="hidden-shortcuts-label">Hidden shortcuts</span>
        <div id="hidden-shortcut-list" className="hidden-shortcut-list" />
      </div>
      <p id="bookmark-empty" className="empty-state" hidden />
    </section>
  );
}
