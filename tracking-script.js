(function () {
  const trackingData = {
    scrollDepth: 0,
    page_url: window.location.href,
    referrer: document.referrer, // Track the referrer
  };
  // Function to extract query parameters from the script URL
  const getScriptParam = (param) => {
    const scriptTags = document.getElementsByTagName("script");
    for (let script of scriptTags) {
      if (script.src.includes("tracking-script.js")) {
        const urlParams = new URLSearchParams(script.src.split("?")[1]);
        return urlParams.get(param);
      }
    }
    return null;
  };

  // Extract the ID parameter
  const trackingId = getScriptParam("id");
  if (!trackingId) {
    console.error("Tracking ID is missing in the script URL");
  }

  function generateSessionId() {
    return "xxxxxx-xxxx-4xxx-yxxx-xxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Set session ID with expiration
  function setSessionIdWithExpiry(sessionId) {
    const now = new Date();
    const expiryTime = now.getTime() + 24 * 60 * 60 * 1000; // 1 day in milliseconds
    // const expiryTime = now.getTime() + 1 * 60 * 1000; // 1 minute in milliseconds for testing
    const sessionData = {
      sessionId,
      expiry: expiryTime,
    };
    localStorage.setItem("tracking_session", JSON.stringify(sessionData));
  }

  // Get session ID and validate expiry
  function getSessionId() {
    const sessionData = localStorage.getItem("tracking_session");
    if (!sessionData) {
      const newSessionId = generateSessionId();
      setSessionIdWithExpiry(newSessionId);
      return newSessionId;
    }

    try {
      const parsedData = JSON.parse(sessionData);
      const now = new Date();

      // Check if the session has expired
      if (now.getTime() > parsedData.expiry) {
        const newSessionId = generateSessionId();
        setSessionIdWithExpiry(newSessionId);
        return newSessionId;
      }

      return parsedData.sessionId;
    } catch (error) {
      console.error("Error parsing session data:", error);
      const newSessionId = generateSessionId();
      setSessionIdWithExpiry(newSessionId);
      return newSessionId;
    }
  }
  let exitIntentScrollPercentage = 0;
  let previousCalledPayload = {};
  const checkPreviousPayload = (payload) => {
    if (
      payload.page_url === previousCalledPayload.page_url &&
      payload.scroll_depth === previousCalledPayload.scroll_depth &&
      payload.type === previousCalledPayload.type
    ) {
      return true;
    }
    previousCalledPayload = payload;
    return false;
  };

  // Function to send data to the backend
  const sendTrackingData = async (type, data) => {
    if (!data) return;
    // Get session ID
    const sessionId = getSessionId();
    //
    console.log("data", data, type, trackingData);
    let payload = {};
    if (type === "exitIntent") {
      if (trackingData.scrollDepth > exitIntentScrollPercentage) {
        exitIntentScrollPercentage = trackingData.scrollDepth;
        payload = {
          scroll_depth: trackingData?.scrollDepth?.toFixed(2) || 0,
          page_url: trackingData?.page_url || window.location.href,
          type: "page_url",
          script_id: trackingId,
          session_id: sessionId,
          referrer: trackingData?.referrer,
        };
      } else {
        return;
      }
    } else if (type === "exitIntentUnload") {
      payload = {
        scroll_depth: trackingData?.scrollDepth?.toFixed(2) || 0,
        page_url: trackingData?.page_url,
        type: "page_url",
        script_id: trackingId,
        session_id: sessionId,
        referrer: trackingData?.referrer
      };
    } else {
      payload = {
        scroll_depth: trackingData?.scrollDepth?.toFixed(2) || 0,
        page_url:
          data?.page_url || trackingData?.page_url || window.location.href,
        type: "page_load",
        script_id: trackingId,
        session_id: sessionId,
        referrer: trackingData?.referrer,
      };
    }
    console.log("payload", payload);
    if (checkPreviousPayload(payload)) return;
    try {
      await fetch("https://be-agent.dev-vison.infiniticube.in/analytics/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      console.log("Tracking data sent:", payload);
    } catch (error) {
      console.error("Error sending tracking data:", error);
    }
  };

  // Debounce function
  const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Handle scroll with debounce
  let lastScrollDepth = 0;
  const handleScroll = debounce(() => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / docHeight) * 100;

    if (scrollPercentage > lastScrollDepth) {
      lastScrollDepth = scrollPercentage;
      trackingData.scrollDepth = scrollPercentage;
      // sendTrackingData("scroll_depth", scrollPercentage.toFixed(2));
    }
  }, 500); // 500ms debounce delay

  // Send data when the page loads
  const handlePageLoad = () => {
    console.log(`User landed from: ${trackingData.referrer}`);
    trackingData.referrer = document.referrer;
    setTimeout(() => {
      sendTrackingData("pageLoad", { page_url: trackingData.page_url });
    }, 50);
  };

  // Handle exit intent
  const handleMouseLeave = (e) => {
    if (e.clientY < 10) {
      sendTrackingData("exitIntent", {
        message: "User is about to leave the page",
      });
    }
  };

  // // Handle URL updates (SPAs or dynamic routing)
  // const updatePageUrl = () => {
  //   setTimeout(() => {
  //     if (trackingData.page_url !== window.location.href) {
  //       sendTrackingData("exitIntentUnload", { message: "Page unload" });
  //       setTimeout(() => {
  //         trackingData.page_url = window.location.href;
  //         trackingData.scrollDepth = 0;
  //         sendTrackingData("page_load", window.location.href);
  //       }, 50);
  //     }
  //   }, 50);
  // };
  let isSPARouting = false;

  const updatePageUrl = () => {
    setTimeout(() => {
      if (trackingData.page_url !== window.location.href) {
        isSPARouting = true;
        sendTrackingData("exitIntentUnload", { message: "Page unload" });
        setTimeout(() => {
          trackingData.page_url = window.location.href;
          trackingData.scrollDepth = 0;
          sendTrackingData("page_load", window.location.href);
        }, 50);
      }
    }, 50);
  };

  // Initialize tracking
  const initializeTracking = () => {
    window.addEventListener("load", handlePageLoad);
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("beforeunload", () => {
      sendTrackingData("exitIntentUnload", { message: "Page unload" });
    });
    // window.addEventListener("beforeunload", () => {
    //   if (!isSPARouting) {
    //     const payload = {
    //       scroll_depth: trackingData?.scrollDepth?.toFixed(2) || 0,
    //       page_url: trackingData?.page_url,
    //       type: "page_url",
    //       script_id: trackingId,
    //       session_id: getSessionId(),
    //     };
    
    //     const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    //     navigator.sendBeacon(
    //       "https://be-agent.dev-vison.infiniticube.in/analytics/data",
    //       blob
    //     );
    //   }
    // });

    // Monitor URL changes for SPAs
    const urlObserver = new MutationObserver(() => {
      updatePageUrl();
    });

    urlObserver.observe(document.querySelector("body"), {
      childList: true,
      subtree: true,
    });
  };

  initializeTracking();
})();
