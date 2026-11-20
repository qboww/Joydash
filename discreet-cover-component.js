(function installJoydashDiscreetCover(global) {
  function create(document) {
    const element = document.createElement("div");
    element.id = "discreet-cover";
    element.className = "discreet-cover";
    element.setAttribute("role", "dialog");
    element.setAttribute("aria-modal", "true");
    element.setAttribute("aria-labelledby", "discreet-cover-heading");
    element.tabIndex = -1;

    const panel = document.createElement("div");
    panel.className = "discreet-cover-panel";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "PRIVATE SPACE";

    const heading = document.createElement("h1");
    heading.id = "discreet-cover-heading";
    heading.textContent = "Joydash is covered";

    const status = document.createElement("p");
    status.id = "discreet-cover-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Press Escape to reveal Joydash.";

    panel.append(eyebrow, heading, status);
    element.append(panel);
    return { element, status };
  }

  global.JoydashDiscreetCover = Object.freeze({ create });
})(globalThis);
