import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles/dashboard.css";
import "../discreet-cover.css";
import App from "./App.jsx";

function Joydash() {
  useEffect(() => {
    import("./legacyController.js").catch((error) => {
      console.error("Could not start Joydash:", error);
      const status = document.querySelector("#history-status") ??
        document.querySelector("#discreet-cover-status");
      if (status) {
        status.textContent = `Could not start Joydash: ${error.message}`;
      }
    });
  }, []);

  return <App />;
}

createRoot(document.querySelector("#root")).render(<Joydash />);
