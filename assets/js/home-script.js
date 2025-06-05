document.addEventListener("DOMContentLoaded", () => {
  const contactNavDiv = document.getElementById("contact-nav-div");
  if (contactNavDiv) {
    contactNavDiv.addEventListener("click", () => {
      window.location.href = "contact.html";
    });
  }

  const navigationMappings = [
    { baseId: "q1_base", excludeId: "q1", href: "installations.html" },
    { baseId: "q2_base", excludeId: "q2", href: "films.html" },
    { baseId: "q3_base", excludeId: "q3", href: "animations.html" },
    { baseId: "q4_base", excludeId: "q4", href: "photographs.html" },
  ];

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  let activeQuadrantId = null; // Keeps track of the currently "hovered" quadrant on touch devices

  navigationMappings.forEach(({ baseId, excludeId, href }) => {
    const baseElement = document.getElementById(baseId);
    const excludeElement = document.getElementById(excludeId); // This is the inner 'quad' div
    const contentDiv = baseElement
      ? baseElement.querySelector(".content-div")
      : null;
    const backgroundDivBefore = baseElement
      ? baseElement.querySelector(".background-div")
      : null;

    if (baseElement && excludeElement && contentDiv && backgroundDivBefore) {
      if (isTouchDevice) {
        // --- Touch Device Logic ---
        baseElement.addEventListener("click", (event) => {
          if (event.target === excludeElement) {
            return;
          }

          if (activeQuadrantId === baseId) {
            // Second tap on the same quadrant: navigate
            // --- NEW LOGIC START ---
            // Remove the 'touch-active' class from the current element BEFORE navigating
            if (activeQuadrantId) {
              const prevActiveBase = document.getElementById(activeQuadrantId);
              if (prevActiveBase) {
                prevActiveBase.classList.remove("touch-active");
              }
            }
            activeQuadrantId = null; // Reset the active ID
            // --- NEW LOGIC END ---
            window.location.href = href; // Navigate
          } else {
            // First tap on this quadrant (or tap on a different one): activate hover effect
            if (activeQuadrantId) {
              const prevActiveBase = document.getElementById(activeQuadrantId);
              if (prevActiveBase) {
                prevActiveBase.classList.remove("touch-active");
              }
            }

            baseElement.classList.add("touch-active");
            activeQuadrantId = baseId;
          }
        });
      } else {
        // --- Desktop Device Logic (existing behavior) ---
        baseElement.addEventListener("click", (event) => {
          if (event.target !== excludeElement) {
            window.location.href = href;
          }
        });
      }
    } else {
      console.warn(
        `Navigation element missing: baseId='${baseId}', excludeId='${excludeId}'`
      );
    }
  });

  // --- Video Handling Logic ---
  const video = document.getElementById("main-video");
  const source = document.getElementById("video-source");

  const horizontalVideoSrc = "assets/vid/showreel_horizontal.mp4";
  const verticalVideoSrc = "assets/vid/showreel_vertical.mp4";

  let currentVideoSrc = "";
  let videoLoadPromise = Promise.resolve();

  const updateVideoSource = () => {
    const shouldBeVertical = window.innerWidth <= 500;
    const newVideoSrc = shouldBeVertical
      ? verticalVideoSrc
      : horizontalVideoSrc;

    if (newVideoSrc !== currentVideoSrc) {
      const currentTime = video.currentTime;
      const isPaused = video.paused;

      videoLoadPromise = videoLoadPromise.then(() => {
        return new Promise((resolve) => {
          video.pause();
          video.removeEventListener("canplaythrough", handleCanPlayThrough);

          const handleCanPlayThrough = () => {
            console.log("canplaythrough fired for:", newVideoSrc);
            video.currentTime = currentTime;
            if (!isPaused) {
              video.play().catch((e) => console.error("Video play failed:", e));
            } else {
              video.pause();
            }
            video.removeEventListener("canplaythrough", handleCanPlayThrough);
            resolve();
          };

          video.addEventListener("canplaythrough", handleCanPlayThrough);

          source.src = newVideoSrc;
          video.load();

          if (video.readyState >= 4) {
            handleCanPlayThrough();
          }
        });
      });

      currentVideoSrc = newVideoSrc;
    }
  };

  // Initial video source setup
  updateVideoSource();

  window.addEventListener("resize", updateVideoSource);

  video.addEventListener("error", (event) => {
    console.error("Video playback error:", event.target.error);
  });
});
