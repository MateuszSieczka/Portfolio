document.addEventListener("DOMContentLoaded", () => {
  // === Konfiguracja i elementy DOM ===
  const navigationMappings = [
    { baseId: "q1_base", excludeId: "q1", href: "installations.html" },
    { baseId: "q2_base", excludeId: "q2", href: "films.html" },
    { baseId: "q3_base", excludeId: "q3", href: "animations.html" },
    { baseId: "q4_base", excludeId: "q4", href: "photographs.html" },
  ];

  // Zgromadź referencje do elementów DOM raz podczas inicjalizacji
  const quadrants = navigationMappings.map((mapping) => ({
    id: mapping.baseId,
    baseEl: document.getElementById(mapping.baseId),
    excludeEl: document.getElementById(mapping.excludeId), // Potrzebne dla click-outside logic
    href: mapping.href,
  }));

  const contactNavDiv = document.getElementById("contact-nav-div");
  const video = document.getElementById("main-video");
  const source = document.getElementById("video-source");

  // === Stan aplikacji ===
  const state = {
    activeId: null, // ID aktywnego kwadrantu (przez hover lub kliknięcie)
    activationType: null, // "hover" lub "click"
    tappedOnce: new Set(), // Dla dotyku: śledzi, czy element został raz tapnięty
  };

  // === Funkcje pomocnicze ===
  const activateQuadrant = (id, type) => {
    // Jeśli już aktywny ten sam element tym samym typem, nic nie rób
    if (state.activeId === id && state.activationType === type) {
      return;
    }

    // Jeśli jest aktywny inny element, dezaktywuj go
    if (state.activeId && state.activeId !== id) {
      deactivateQuadrant(state.activeId);
    }

    const quad = quadrants.find((q) => q.id === id);
    if (quad && quad.baseEl) {
      // Jeśli aktywacja jest typu "hover", usuń poprzednie aktywacje "click"
      if (type === "hover" && state.activationType === "click") {
        deactivateQuadrant(state.activeId); // Dezaktywuj poprzedni kliknięty
      }

      quad.baseEl.classList.add("touch-active"); // Używamy "touch-active" dla obu, to nazwa klasy CSS
      state.activeId = id;
      state.activationType = type;
      console.log(`[Aktywacja] Kwadrant: ${id} (przez: ${type})`);
    } else {
      console.error(`[Błąd] Nie znaleziono elementu o ID: ${id}`);
    }
  };

  const deactivateQuadrant = (idToDeactivate = state.activeId) => {
    if (!idToDeactivate) return;

    const prev = quadrants.find((q) => q.id === idToDeactivate);
    if (prev && prev.baseEl) {
      prev.baseEl.classList.remove("touch-active");
      console.log(`[Dezaktywacja] Kwadrant: ${idToDeactivate}`);
    }
    state.tappedOnce.delete(idToDeactivate); // Usuń z tappedOnce niezależnie od typu

    // Tylko jeśli dezaktywujemy aktualnie aktywny element
    if (state.activeId === idToDeactivate) {
      state.activeId = null;
      state.activationType = null;
    }
  };

  const resetInteractionState = () => {
    console.log("[RESET] Resetowanie stanu interakcji...");
    // Dezaktywuj wszystkie kwadranty, aby mieć pewność, że żaden nie jest "zamrożony"
    quadrants.forEach((q) => deactivateQuadrant(q.id));

    state.tappedOnce.clear(); // Wyczyść wszystkie zapisane "tapnięcia"

    // Upewnij się, że żaden element nie ma aktywnego fokusu, który mógłby go "zamrozić"
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
      console.log("[RESET] Usunięto fokus z elementu:", document.activeElement);
    }

    // Po resecie sprawdzamy, czy myszka jest nad jakimś elementem
    checkInitialHoverState();
  };

  // Sprawdzenie stanu hovera po załadowaniu/powrocie ze strony
  const checkInitialHoverState = () => {
    // Sprawdzamy tylko jeśli urządzenie obsługuje hover (mysz)
    if (window.matchMedia("(hover: hover)").matches) {
      const hoveredElement = document.querySelector(".base:hover");
      if (hoveredElement) {
        const quad = quadrants.find((q) => q.baseEl === hoveredElement);
        if (quad) {
          activateQuadrant(quad.id, "hover");
        }
      } else {
        // Jeśli myszka nie jest nad żadnym kwadrantem, upewniamy się, że żaden nie jest aktywny
        deactivateQuadrant();
      }
    }
  };

  // === Globalne listenery ===
  if (contactNavDiv) {
    contactNavDiv.addEventListener("click", () => {
      window.location.href = "contact.html";
      console.log("[NAVIGACJA] Przejście do contact.html");
    });
  }

  // Dezaktywacja po kliknięciu poza kwadrantami lub przyciskami exclude
  document.body.addEventListener("pointerdown", (event) => {
    // Sprawdź, czy kliknięto w element .base (jeden z kwadrantów)
    const clickedQuad = event.target.closest(".base");
    // Sprawdź, czy kliknięto w div kontaktu
    const clickedContact = event.target.closest("#contact-nav-div");
    let clickedExclude = false;
    // Sprawdź, czy kliknięto w element 'exclude' wewnątrz kwadrantu
    quadrants.forEach((q) => {
      if (
        q.excludeEl &&
        (event.target === q.excludeEl ||
          event.target.closest(`#${q.excludeEl.id}`))
      ) {
        clickedExclude = true;
      }
    });

    // Sprawdź, czy kliknięto w obrębie aktywnego kwadrantu (jeśli aktywny jest przez tapnięcie)
    const insideActiveByClick =
      state.activeId &&
      state.activationType === "click" &&
      event.target.closest(`#${state.activeId}`) ===
        document.getElementById(state.activeId);

    // Jeśli kliknięto poza kwadrantem, poza kontaktem, poza przyciskiem exclude
    // I nie jest to kliknięcie wewnątrz już aktywnego kwadrantu (przez 'click' - bo wtedy to ma nawigować)
    // to dezaktywuj aktywny kwadrant.
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
      console.log("[PAGESHOW] Strona odtworzona z BFCache. Resetowanie stanu.");
      resetInteractionState(); // Resetuj stan interakcji i sprawdź hover
    } else {
      console.log("[PAGESHOW] Strona załadowana normalnie.");
      checkInitialHoverState(); // Sprawdź początkowy stan hovera
    }
  });

  // === Obsługa interakcji z kwadrantami ===
  quadrants.forEach((q) => {
    const baseEl = q.baseEl;
    if (!baseEl) return;

    // Obsługa hover dla myszy
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
        deactivateQuadrant(); // Dezaktywuj tylko, jeśli to było aktywowane przez hover
      }
    });

    // Obsługa kliknięć/tapnięć
    baseEl.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") {
        event.preventDefault(); // Zapobiega emulacji myszy i podwójnemu tapnięciu zoomu
        const id = q.id;

        if (state.activeId !== id || !state.tappedOnce.has(id)) {
          // Pierwsze tapnięcie: aktywuj i zapisz stan "tappedOnce"
          activateQuadrant(id, "click");
          state.tappedOnce.add(id);
          console.log(`[Dotyk] Pierwsze dotknięcie/aktywacja: ${id}`);
        } else {
          // Drugie tapnięcie: nawiguj
          window.location.href = q.href;
          console.log(`[NAVIGACJA] Przejście do: ${q.href}`);
          // Resetuj stan po nawigacji, aby uniknąć problemów po powrocie
          state.tappedOnce.delete(id);
          state.activeId = null;
          state.activationType = null;
        }
      } else if (event.pointerType === "mouse") {
        const id = q.id;
        if (state.activeId === id) {
          // Jeśli już aktywny (przez kliknięcie lub hover, ale ten sam element), nawiguj
          window.location.href = q.href;
          console.log(`[NAVIGACJA] Przejście do: ${q.href}`);
          // Resetuj stan po nawigacji
          state.activeId = null;
          state.activationType = null;
        } else {
          // Jeśli nieaktywny, aktywuj go kliknięciem
          activateQuadrant(id, "click");
        }
      }
    });
  });

  // // === Dynamiczna zmiana wideo ===
  // const horizontalVideoSrc = "assets/vid/showreel_horizontal.mp4"; // 16/9
  // const squareVideoSrc = "assets/vid/showreel_square.mp4"; // 1:1
  // const verticalVideoSrc = "assets/vid/showreel_vertical.mp4"; // 9/16

  // let currentVideoLoadedSrc = ""; // Śledzi aktualnie załadowane źródło wideo

  // const updateVideoSource = () => {
  //   let newSrc;
  //   const screenWidth = window.innerWidth;

  //   if (screenWidth <= 767) {
  //     newSrc = verticalVideoSrc; // Telefony: 9/16
  //   } else if (screenWidth >= 768 && screenWidth <= 1024) {
  //     newSrc = squareVideoSrc; // Tablety: 1:1
  //   } else {
  //     newSrc = horizontalVideoSrc; // Komputery: 16/9
  //   }

  //   // Zmień źródło wideo tylko jeśli jest inne niż aktualne
  //   if (newSrc === currentVideoLoadedSrc) {
  //     return;
  //   }

  //   // Upewnij się, że elementy wideo istnieją
  //   if (!video || !source) {
  //     console.error("Błąd: Element <video> lub <source> nie znaleziony w DOM.");
  //     return;
  //   }

  //   const currentTime = video.currentTime;
  //   const wasPaused = video.paused;

  //   video.pause();
  //   source.src = newSrc;
  //   video.load();

  //   video.addEventListener(
  //     "canplaythrough",
  //     function onCanPlay() {
  //       video.currentTime = currentTime;
  //       if (!wasPaused) {
  //         video
  //           .play()
  //           .catch((e) => console.error("Błąd odtwarzania wideo:", e));
  //       }
  //       this.removeEventListener("canplaythrough", onCanPlay); // Usuń listener
  //     },
  //     { once: true }
  //   );

  //   currentVideoLoadedSrc = newSrc;
  //   console.log(`Zmieniono źródło wideo na: ${newSrc}`);
  // };

  // // Inicjalizacja i obsługa zdarzeń
  // if (video && source) {
  //   updateVideoSource(); // Ustaw początkowe źródło wideo

  //   // Debounce dla zdarzenia resize, aby uniknąć nadmiernych wywołań
  //   let resizeTimer;
  //   window.addEventListener("resize", () => {
  //     clearTimeout(resizeTimer);
  //     resizeTimer = setTimeout(updateVideoSource, 250);
  //   });

  //   // Obsługa błędów wideo
  //   video.addEventListener("error", (event) => {
  //     console.error("Wystąpił błąd odtwarzania wideo:", event.target.error);
  //   });
  // }
});
