import BookmarksSection from "./components/BookmarksSection/BookmarksSection.jsx";
import DashboardHeader from "./components/DashboardHeader/DashboardHeader.jsx";
import DashboardSectionArranger from "./components/DashboardSectionArranger/DashboardSectionArranger.jsx";
import HistoryRail from "./components/HistoryRail/HistoryRail.jsx";
import Overlays from "./components/Overlays/Overlays.jsx";
import RandomVideoSection from "./components/RandomVideoSection/RandomVideoSection.jsx";
import RecentHistorySection from "./components/RecentHistorySection/RecentHistorySection.jsx";
import VideoPlaylistsSection from "./components/VideoPlaylistsSection/VideoPlaylistsSection.jsx";

export default function App() {
  return (
    <>
      <main className="page" inert>
        <div className="dashboard-layout">
          <section className="history-section" aria-labelledby="dashboard-title">
            <DashboardHeader />
            <DashboardSectionArranger />
            <div id="continue-content">
              <div id="dashboard-section-stack" className="dashboard-section-stack" hidden>
                <RecentHistorySection />
                <RandomVideoSection />
                <VideoPlaylistsSection />
              </div>
            </div>
          </section>
          <HistoryRail />
          <BookmarksSection />
        </div>
        <footer className="asset-credit">
          <a href="https://icons8.com/" target="_blank" rel="noopener noreferrer">
            Monkey icon by Icons8
          </a>
        </footer>
      </main>
      <Overlays />
    </>
  );
}
