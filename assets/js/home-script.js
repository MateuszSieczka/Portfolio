document.addEventListener("DOMContentLoaded", () => {
  const contactNavDiv = document.getElementById("contact-nav-div");

  // === Global Listeners ===
  if (contactNavDiv) {
    contactNavDiv.addEventListener("click", () => {
      window.location.href = "contact.html";
      console.log("[NAVIGATION] Navigating to contact.html");
    });
  }

  // === Configuration and DOM Elements ===
  const navigationMappings = [
    { baseId: "q1_base", excludeId: "q1", href: "installations.html" },
    { baseId: "q2_base", excludeId: "q2", href: "films.html" },
    { baseId: "q3_base", excludeId: "q3", href: "animations.html" },
    { baseId: "q4_base", excludeId: "q4", href: "photographs.html" },
  ];

  // Collect DOM element references once during initialization
  const quadrants = navigationMappings.map((mapping) => ({
    id: mapping.baseId,
    baseEl: document.getElementById(mapping.baseId),
    excludeEl: document.getElementById(mapping.excludeId),
    href: mapping.href,
  }));

  // === Application State ===
  const state = {
    activeId: null, // ID of the currently active quadrant (via hover or click)
    activationType: null, // "hover" or "click"
    tappedOnce: new Set(), // For touch devices: tracks if an element has been tapped once
  };

  // === Helper Functions ===
  const activateQuadrant = (id, type) => {
    // If the same element is already active with the same type, do nothing
    if (state.activeId === id && state.activationType === type) {
      return;
    }

    // If a different element is active, deactivate it first
    if (state.activeId && state.activeId !== id) {
      deactivateQuadrant(state.activeId);
    }

    const quad = quadrants.find((q) => q.id === id);
    if (quad && quad.baseEl) {
      // If activation is via "hover", remove previous "click" activations
      if (type === "hover" && state.activationType === "click") {
        deactivateQuadrant(state.activeId); // Deactivate previously clicked element
      }

      quad.baseEl.classList.add("touch-active"); // Use "touch-active" for both hover and click
      state.activeId = id;
      state.activationType = type;
      console.log(`[Activation] Quadrant: ${id} (by: ${type})`);
    } else {
      console.error(`[Error] Element not found with ID: ${id}`);
    }
  };

  const deactivateQuadrant = (idToDeactivate = state.activeId) => {
    if (!idToDeactivate) return;

    const prev = quadrants.find((q) => q.id === idToDeactivate);
    if (prev && prev.baseEl) {
      prev.baseEl.classList.remove("touch-active");
      console.log(`[Deactivation] Quadrant: ${idToDeactivate}`);
    }
    state.tappedOnce.delete(idToDeactivate); // Remove from tappedOnce regardless of type

    // Only if deactivating the currently active element
    if (state.activeId === idToDeactivate) {
      state.activeId = null;
      state.activationType = null;
    }
  };

  const resetInteractionState = () => {
    console.log("[RESET] Resetting interaction state...");
    // Deactivate all quadrants to ensure none are "frozen"
    quadrants.forEach((q) => deactivateQuadrant(q.id));

    state.tappedOnce.clear(); // Clear all recorded "taps"

    // Ensure no element has active focus that might "freeze" it
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
      console.log(
        "[RESET] Removed focus from element:",
        document.activeElement
      );
    }

    // After reset, check if the mouse is currently hovering over any element
    checkInitialHoverState();
  };

  // Check initial hover state after load/back from page
  const checkInitialHoverState = () => {
    // Only check if the device supports hover (mouse)
    if (window.matchMedia("(hover: hover)").matches) {
      const hoveredElement = document.querySelector(".base:hover");
      if (hoveredElement) {
        const quad = quadrants.find((q) => q.baseEl === hoveredElement);
        if (quad) {
          activateQuadrant(quad.id, "hover");
        }
      } else {
        // If the mouse is not over any quadrant, ensure none are active
        deactivateQuadrant();
      }
    }
  };

  // Deactivate on click outside quadrants or exclude buttons
  document.body.addEventListener("pointerdown", (event) => {
    // Check if a .base element (one of the quadrants) was clicked
    const clickedQuad = event.target.closest(".base");
    // Check if the contact div was clicked
    const clickedContact = event.target.closest("#contact-nav-div");
    let clickedExclude = false;
    // Check if an 'exclude' element inside a quadrant was clicked
    quadrants.forEach((q) => {
      if (
        q.excludeEl &&
        (event.target === q.excludeEl ||
          event.target.closest(`#${q.excludeEl.id}`))
      ) {
        clickedExclude = true;
      }
    });

    // Check if the click was within the active quadrant (if active by tap)
    const insideActiveByClick =
      state.activeId &&
      state.activationType === "click" &&
      event.target.closest(`#${state.activeId}`) ===
        document.getElementById(state.activeId);

    // If clicked outside a quadrant, outside contact, outside exclude button,
    // AND it's not a click inside an already active quadrant (by 'click' - because then it should navigate)
    // then deactivate the active quadrant.
    if (
      !clickedQuad &&
      !clickedContact &&
      !clickedExclude &&
      !insideActiveByClick
    ) {
      deactivateQuadrant();
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      console.log("[PAGESHOW] Page restored from BFCache. Resetting state.");
      resetInteractionState(); // Reset interaction state and check hover
    } else {
      console.log("[PAGESHOW] Page loaded normally.");
      checkInitialHoverState(); // Check initial hover state
    }
  });

  // === Quadrant Interaction Handling ===
  quadrants.forEach((q) => {
    const baseEl = q.baseEl;
    if (!baseEl) return;

    // Handle hover for mouse devices
    baseEl.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") {
        activateQuadrant(q.id, "hover");
      }
    });

    baseEl.addEventListener("pointerleave", (event) => {
      if (
        event.pointerType === "mouse" &&
        state.activeId === q.id &&
        state.activationType === "hover"
      ) {
        deactivateQuadrant(); // Deactivate only if activated by hover
      }
    });

    // Handle clicks/taps
    baseEl.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") {
        event.preventDefault(); // Prevent mouse emulation and double-tap zoom
        const id = q.id;

        if (state.activeId !== id || !state.tappedOnce.has(id)) {
          // First tap: activate and record "tappedOnce" state
          activateQuadrant(id, "click");
          state.tappedOnce.add(id);
          console.log(`[Touch] First tap/activation: ${id}`);
        } else {
          // Second tap: navigate
          window.location.href = q.href;
          console.log(`[NAVIGATION] Navigating to: ${q.href}`);
          // Reset state after navigation to prevent issues on return
          state.tappedOnce.delete(id);
          state.activeId = null;
          state.activationType = null;
        }
      } else if (event.pointerType === "mouse") {
        const id = q.id;
        if (state.activeId === id) {
          // If already active (by click or hover, but the same element), navigate
          window.location.href = q.href;
          console.log(`[NAVIGATION] Navigating to: ${q.href}`);
          // Reset state after navigation
          state.activeId = null;
          state.activationType = null;
        } else {
          // If inactive, activate it by click
          activateQuadrant(id, "click");
        }
      }
    });
  });
});
