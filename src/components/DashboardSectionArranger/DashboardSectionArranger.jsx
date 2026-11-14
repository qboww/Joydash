export default function DashboardSectionArranger() {
  return (
    <div id="dashboard-section-arranger" className="dashboard-section-arranger" hidden>
      <div className="dashboard-section-arranger-heading">
        <p className="dashboard-section-arranger-title">
          Drag sections or use Up/Down, then save your order.
        </p>
      </div>
      <ol id="dashboard-section-order-list" className="dashboard-section-order-list" />
      <div className="dashboard-section-order-actions">
        <button id="save-dashboard-section-order" className="text-button" type="button" disabled>
          Save order
        </button>
        <button id="close-dashboard-section-arranger" className="text-button" type="button">
          Close
        </button>
      </div>
      <p
        id="dashboard-section-order-status"
        className="dashboard-section-order-status"
        role="status"
        aria-live="polite"
      />
    </div>
  );
}
