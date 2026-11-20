export function createDashboardSectionController({
  browser,
  document,
  stack,
  arranger,
  list,
  status,
  manageButton,
  closeButton,
  saveButton,
  settings,
  reducedMotionPreference
}) {
  let order = [];
  let draft = [];
  let saving = false;
  let pointerDrag = null;

  function getSections() {
    return [...stack.children].filter((section) => section.dataset.dashboardSection);
  }

  function normalizeOrder(savedOrder) {
    const availableIds = getSections().map((section) => section.dataset.dashboardSection);
    const validSavedIds = Array.isArray(savedOrder)
      ? savedOrder.filter((id) => typeof id === "string" && availableIds.includes(id))
      : [];
    return [...new Set([...validSavedIds, ...availableIds])];
  }

  function hasChanges() {
    return draft.length !== order.length ||
      draft.some((sectionId, index) => sectionId !== order[index]);
  }

  function setDraft(nextOrder) {
    draft = normalizeOrder(nextOrder);
    status.textContent = hasChanges() ? "Unsaved order changes." : "";
    renderList();
  }

  function renderList() {
    list.replaceChildren();
    const sectionsById = new Map(
      getSections().map((section) => [section.dataset.dashboardSection, section])
    );
    draft.forEach((sectionId, index) => {
      const section = sectionsById.get(sectionId);
      if (!section) {
        return;
      }
      const item = document.createElement("li");
      item.className = "dashboard-section-order-item";
      item.dataset.dashboardSection = sectionId;
      item.draggable = false;

      const label = document.createElement("span");
      label.textContent = section.dataset.dashboardSectionLabel;

      const controls = document.createElement("div");
      controls.className = "dashboard-section-order-controls";
      for (const [direction, text] of [[-1, "Up"], [1, "Down"]]) {
        const button = document.createElement("button");
        button.className = "text-button dashboard-section-order-button";
        button.type = "button";
        button.textContent = text;
        button.setAttribute(
          "aria-label",
          `Move ${section.dataset.dashboardSectionLabel} ${text.toLowerCase()}`
        );
        button.disabled = saving ||
          index + direction < 0 ||
          index + direction >= draft.length;
        button.addEventListener("click", () => {
          void moveSection(sectionId, direction);
        });
        controls.append(button);
      }
      item.append(label, controls);
      list.append(item);
    });
    saveButton.disabled = saving || !hasChanges();
  }

  function applyOrder(nextOrder) {
    order = normalizeOrder(nextOrder);
    draft = [...order];
    const sectionsById = new Map(
      getSections().map((section) => [section.dataset.dashboardSection, section])
    );
    for (const sectionId of order) {
      const section = sectionsById.get(sectionId);
      if (section) {
        stack.append(section);
      }
    }
    renderList();
  }

  async function saveOrder(nextOrder) {
    if (saving) {
      return;
    }
    const normalizedOrder = normalizeOrder(nextOrder);
    if (normalizedOrder.length === order.length &&
        normalizedOrder.every((sectionId, index) => sectionId === order[index])) {
      return;
    }
    const previousOrder = [...order];
    saving = true;
    status.textContent = "";
    applyOrder(normalizedOrder);
    try {
      await browser.storage.local.set({ dashboardSectionOrder: order });
      return true;
    } catch (error) {
      applyOrder(previousOrder);
      status.textContent = `Could not save section order: ${error.message}`;
      return false;
    } finally {
      saving = false;
      renderList();
    }
  }

  async function moveSection(sectionId, direction) {
    if (saving) {
      return;
    }
    const currentIndex = draft.indexOf(sectionId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= draft.length) {
      return;
    }
    const nextOrder = [...draft];
    [nextOrder[currentIndex], nextOrder[nextIndex]] =
      [nextOrder[nextIndex], nextOrder[currentIndex]];
    setDraft(nextOrder);
  }

  function close() {
    arranger.hidden = true;
    manageButton.setAttribute("aria-expanded", "false");
    settings.querySelector(":scope > summary").focus();
  }

  manageButton.addEventListener("click", () => {
    const isExpanded = manageButton.getAttribute("aria-expanded") === "true";
    manageButton.setAttribute("aria-expanded", String(!isExpanded));
    arranger.hidden = isExpanded;
    if (!isExpanded) {
      status.textContent = hasChanges() ? "Unsaved order changes." : "";
      renderList();
    }
    settings.open = false;
  });

  closeButton.addEventListener("click", close);

  saveButton.addEventListener("click", async () => {
    const nextOrder = [...list.children]
      .map((item) => item.dataset.dashboardSection);
    if (await saveOrder(nextOrder)) {
      close();
    }
  });

  list.addEventListener("pointerdown", (event) => {
    const item = event.target.closest(".dashboard-section-order-item");
    if (saving ||
        event.button !== 0 ||
        !item ||
        event.target.closest("button")) {
      return;
    }
    pointerDrag = {
      item,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      active: false
    };
    list.setPointerCapture(event.pointerId);
  });

  document.addEventListener("pointermove", (event) => {
    const drag = pointerDrag;
    if (!drag || event.pointerId !== drag.pointerId || saving) {
      return;
    }

    if (!drag.active) {
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (distance < 5) {
        return;
      }
      drag.active = true;
      drag.item.classList.add("is-dragging");
    }

    event.preventDefault();
    const listBounds = list.getBoundingClientRect();
    if (event.clientY < listBounds.top || event.clientY > listBounds.bottom) {
      return;
    }
    const currentItems = [...list.children];
    const currentIndex = currentItems.indexOf(drag.item);
    const otherItems = currentItems.filter((item) => item !== drag.item);
    const nextIndex = otherItems.findIndex((item) => {
      const bounds = item.getBoundingClientRect();
      return event.clientY < bounds.top + bounds.height / 2;
    });
    const destinationIndex = nextIndex < 0 ? otherItems.length : nextIndex;
    if (destinationIndex === currentIndex) {
      return;
    }

    const affectedItems = otherItems.slice(
      Math.min(currentIndex, destinationIndex),
      Math.max(currentIndex, destinationIndex)
    );
    for (const sectionItem of affectedItems) {
      for (const animation of sectionItem.getAnimations()) {
        animation.cancel();
      }
    }
    const previousTops = new Map(
      affectedItems.map((sectionItem) => [sectionItem, sectionItem.getBoundingClientRect().top])
    );
    list.insertBefore(drag.item, otherItems[destinationIndex] ?? null);
    if (reducedMotionPreference.matches) {
      return;
    }
    for (const sectionItem of affectedItems) {
      const offset = previousTops.get(sectionItem) - sectionItem.getBoundingClientRect().top;
      if (offset !== 0) {
        sectionItem.animate(
          [{ transform: `translateY(${offset}px)` }, { transform: "translateY(0)" }],
          { duration: 110, easing: "ease-out" }
        );
      }
    }
  });

  document.addEventListener("pointerup", (event) => {
    const drag = pointerDrag;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    pointerDrag = null;
    if (!drag.active) {
      return;
    }
    event.preventDefault();
    drag.item.classList.remove("is-dragging");
    setDraft([...list.children].map((item) => item.dataset.dashboardSection));
  });

  document.addEventListener("pointercancel", (event) => {
    const drag = pointerDrag;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    pointerDrag = null;
    drag.item.classList.remove("is-dragging");
    if (drag.active) {
      renderList();
    }
  });

  return {
    getSections,
    applyOrder
  };
}
