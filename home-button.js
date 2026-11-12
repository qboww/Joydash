if (!globalThis.__joydashHomeButtonInstalled) {
  globalThis.__joydashHomeButtonInstalled = true;

  const host = document.createElement("div");
  const shadowRoot = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial !important;
      position: fixed !important;
      z-index: 2147483647 !important;
      right: 16px !important;
      bottom: 16px !important;
      display: block !important;
      width: 42px !important;
      height: 42px !important;
      color-scheme: dark !important;
      pointer-events: auto !important;
    }

    button {
      all: initial;
      box-sizing: border-box;
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 12px;
      background: rgba(15, 15, 18, 0.9);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.38);
      color: #f5f5f5;
      cursor: pointer;
      opacity: 0.82;
      transition: opacity 140ms ease, background-color 140ms ease, border-color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }

    button:hover,
    button:focus-visible {
      border-color: rgba(255, 255, 255, 0.72);
      background: rgba(32, 32, 36, 0.98);
      opacity: 1;
    }

    button:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
    }

    button:disabled {
      cursor: progress;
    }

    svg {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  `;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Return to Joydash home page");
  button.title = "Return to Joydash";
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 10 9-7 9 7"></path>
      <path d="M5 9v12h14V9"></path>
      <path d="M9 21v-7h6v7"></path>
    </svg>
  `;
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    button.disabled = true;
    try {
      const result = await browser.runtime.sendMessage({
        type: "joydash:return-home"
      });
      if (!result?.ok) {
        throw new Error("The Joydash page could not be opened.");
      }
    } catch (error) {
      console.error("Could not return to Joydash:", error);
      button.disabled = false;
      button.title = "Could not return to Joydash";
    }
  });

  shadowRoot.append(style, button);
  document.documentElement.append(host);
}
