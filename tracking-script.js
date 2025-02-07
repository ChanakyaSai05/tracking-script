(function () {
  const trackingData = {
    scrollDepth: 0,
    page_url: window.location.href,
    referrer: document.referrer, // Track the referrer
    email: "",
    timeSpent: 0, // Track time spent on the page
    links_clicked: [], // Track links clicked by the user
  };
  let startTime = Date.now(); // Capture page load time
  let totalTimeSpent = 0; // Total time spent
  let isTabActive = true; // Track if the tab is active
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
      payload?.page_url === previousCalledPayload?.page_url &&
      payload?.scroll_depth === previousCalledPayload?.scroll_depth &&
      payload?.type === previousCalledPayload?.type &&
      payload?.script_id === previousCalledPayload?.script_id &&
      payload?.session_id === previousCalledPayload?.session_id &&
      payload?.referrer === previousCalledPayload?.referrer &&
      payload?.links_clicked === previousCalledPayload?.links_clicked &&
      payload?.email === previousCalledPayload?.email &&
      payload?.time_spent === previousCalledPayload?.time_spent
    ) {
      return true;
    }
    previousCalledPayload = payload;
    return false;
  };
  const checkAllKeys = () => {
    if (
      !"scroll_depth" in trackingData ||
      !"page_url" in trackingData ||
      !"type" in trackingData ||
      !"script_id" in trackingData ||
      !"session_id" in trackingData ||
      !"referrer" in trackingData ||
      !"email" in trackingData ||
      !"time_spent" in trackingData ||
      !"links_clicked" in trackingData
    ) {
      return false;
    }
    return true;
  };

  // Function to send data to the backend
  const sendTrackingData = async (type, data) => {
    updateTimeSpent();
    trackingData.timeSpent = totalTimeSpent;
    if (!data) return;
    // Get session ID
    const sessionId = getSessionId();
    //
    // console.log("data", data, type, trackingData);
    let payload = {};
    if (type === "exitIntent") {
      console.log("CALLING EXIT INTENT");
      // if (trackingData.scrollDepth > exitIntentScrollPercentage) {
        exitIntentScrollPercentage = trackingData.scrollDepth;
        payload = {
          scroll_depth: trackingData?.scrollDepth?.toFixed(2) || 0, //
          page_url: trackingData?.page_url || window.location.href, //
          type: "page_url",
          script_id: trackingId,
          session_id: sessionId,
          referrer: trackingData?.referrer, //
          email: trackingData?.email, //
          time_spent: trackingData?.timeSpent?.toFixed(2) || 0, //
          links_clicked: trackingData?.links_clicked, //
        };
      // } else {
      //   return;
      // }
    } else if (type === "exitIntentUnload") {
      console.log("CALLING EXIT INTENT UNLOAD");
      payload = {
        scroll_depth: trackingData?.scrollDepth?.toFixed(2) || 0,
        page_url: trackingData?.page_url,
        type: "page_url",
        script_id: trackingId,
        session_id: sessionId,
        referrer: trackingData?.referrer,
        email: trackingData?.email,
        time_spent: trackingData?.timeSpent?.toFixed(2) || 0,
        links_clicked: trackingData?.links_clicked,
      };
    } else {
      console.log("CALLING PAGE LOAD");
      payload = {
        scroll_depth: trackingData?.scrollDepth?.toFixed(2) || 0,
        page_url:
          data?.page_url || trackingData?.page_url || window.location.href,
        type: "page_load",
        script_id: trackingId,
        session_id: sessionId,
        referrer: trackingData?.referrer,
        email: trackingData?.email,
        time_spent: null,
        links_clicked: null,
      };
    }
    if (checkPreviousPayload(payload)) return;
    if (!checkAllKeys()) return;
    console.log("payload", payload);
    // return;
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
  let isSPARouting = false;

  const updatePageUrl = () => {
    setTimeout(() => {
      if (trackingData.page_url !== window.location.href) {
        isSPARouting = true;
        sendTrackingData("exitIntentUnload", { message: "Page unload" });
        setTimeout(() => {
          trackingData.page_url = window.location.href;
          trackingData.scrollDepth = 0;
          trackingData.links_clicked = [];
          totalTimeSpent = 0;
          startTime = Date.now();
          isTabActive = true;
          trackingData.timeSpent = 0;
          trackingData.email = "";
          sendTrackingData("page_load", window.location.href);
        }, 50);
      }
    }, 50);
  };

  // Function to calculate and update time spent
  const updateTimeSpent = () => {
    if (isTabActive) {
      const currentTime = Date.now();
      totalTimeSpent += (currentTime - startTime) / 1000; // Convert to seconds
      startTime = currentTime; // Reset start time
    }
  };

  // Initialize tracking
  const initializeTracking = () => {
    window.addEventListener("load", () => {
      handlePageLoad();
      // monitorEmailInput();
      startTime = Date.now(); // Start the timer
    });
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("input", (e) => {
      if (e.target.type === "email") {
        trackingData.email = e.target.value;
      }
    });
    console.log("trackingData", trackingData);
    // Handle link clicks
    document.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        if (trackingData.links_clicked.length === 0) {
          trackingData.links_clicked.push({ link: e.target.href, count: 1 });
        } else {
          const index = trackingData.links_clicked.findIndex(
            (item) => item.link === e.target.href
          );
          if (index === -1) {
            trackingData.links_clicked.push({ link: e.target.href, count: 1 });
          } else {
            trackingData.links_clicked[index].count += 1;
          }
        }
      }
    });

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("beforeunload", () => {
      updateTimeSpent();
      sendTrackingData("exitIntentUnload", { message: "Page unload" });
    });
    // Pause time tracking when user switches tabs or minimizes the window
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        updateTimeSpent(); // Update time before pausing
        isTabActive = false;
      } else {
        startTime = Date.now(); // Reset start time
        isTabActive = true;
      }
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
