(function () {
  const trackingData = {
    scrollDepth: 0,
    page_url: window.location.href,
  };

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

  function setSessionIdWithExpiry(sessionId) {
    const now = new Date();
    const expiryTime = now.getTime() + 24 * 60 * 60 * 1000;
    const sessionData = {
      sessionId,
      expiry: expiryTime,
    };
    localStorage.setItem("tracking_session", JSON.stringify(sessionData));
  }

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

  const sendTrackingData = async (type, data) => {
    if (!data) return;
    try {
      const sessionId = getSessionId();
      const payload = {
        ...data,
        script_id: trackingId,
        session_id: sessionId,
      };
      console.log("Tracking data:", payload);

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

  const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  let lastScrollDepth = 0;
  const handleScroll = debounce(() => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / docHeight) * 100;

    if (scrollPercentage > lastScrollDepth) {
      lastScrollDepth = scrollPercentage;
      trackingData.scrollDepth = scrollPercentage.toFixed(2);
    }
  }, 500);

  const handleMouseLeave = (e) => {
    if (e.clientY < 10) {
      sendTrackingData("exitIntent", {
        page_url: trackingData.page_url,
        scroll_depth: trackingData.scrollDepth,
      });
    }
  };

  const handlePageUnload = () => {
    sendTrackingData("pageUnload", {
      page_url: trackingData.page_url,
      scroll_depth: trackingData.scrollDepth,
    });
  };

  const initializeTracking = () => {
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("beforeunload", handlePageUnload);
  };

  initializeTracking();
})();
