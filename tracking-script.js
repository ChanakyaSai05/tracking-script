(function () {
  const trackingData = {
    scrollDepth: 0,
    page_url: window.location.href,
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

  function setCookie(name, value, days) {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);
      const cookie = `${name}=${encodeURIComponent(
        value
      )};expires=${expirationDate.toUTCString()};path=/;SameSite=Strict;Secure`;
      document.cookie = cookie;
      return true;
    } catch (error) {
      console.error("Error setting cookie:", error);
      return false;
    }
  }

  function getCookie(name) {
    try {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split("=");
        if (cookieName.trim() === name) {
          return cookieValue ? decodeURIComponent(cookieValue) : null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting cookie:", error);
      return null;
    }
  }

  // Function to send data to the backend
  const sendTrackingData = async (type, data) => {
    if (!data) return;
    // In your tracking code:
    let sessionId = getCookie("tracking_session_id");

    if (!sessionId) {
      sessionId = generateSessionId();
      const cookieSet = setCookie("tracking_session_id", sessionId, 1);
      if (!cookieSet) {
        console.error("Failed to set session cookie");
      }
    }
    console.log("data", data, type, trackingData);
    let payload = {};
    if (type === "scroll_depth") {
      payload = {
        scroll_depth: data || trackingData?.scrollDepth || 0,
        page_url: trackingData?.page_url || window.location.href,
        type: "scroll_depth",
        script_id: trackingId,
        session_id: sessionId || null,
      };
    } else
      payload = {
        scroll_depth: trackingData?.scrollDepth || 0,
        page_url:
          data?.page_url || trackingData?.page_url || window.location.href,
        type: "page_load",
        script_id: trackingId,
        session_id: sessionId || null,
      };
    console.log("payload", payload);
    try {
      await fetch("https://be-agent.dev-vison.infiniticube.in/analytics/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      trackingData.scrollDepth = scrollPercentage.toFixed(2);
      sendTrackingData("scroll_depth", scrollPercentage.toFixed(2));
    }
  }, 500); // 500ms debounce delay

  // Send data when the page loads
  const handlePageLoad = () => {
    sendTrackingData("pageLoad", { page_url: trackingData.page_url });
  };

  // Handle exit intent
  const handleMouseLeave = (e) => {
    if (e.clientY < 10) {
      sendTrackingData("exitIntent", {
        message: "User is about to leave the page",
      });
    }
  };

  // Handle URL updates (SPAs or dynamic routing)
  const updatePageUrl = () => {
    setTimeout(() => {
      if (trackingData.page_url !== window.location.href) {
        trackingData.page_url = window.location.href;
        sendTrackingData("page_url", window.location.href);
      }
    }, 50);
  };

  // Initialize tracking
  const initializeTracking = () => {
    window.addEventListener("load", handlePageLoad);
    window.addEventListener("scroll", handleScroll);
    // document.addEventListener("mouseleave", handleMouseLeave);
    // window.addEventListener("beforeunload", () => {
    //   sendTrackingData("exitIntent", { message: "Page unload" });
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
