(function () {
  const trackingData = {
    scrollDepth: 0,
    page_url: window.location.href,
  };

  // Function to send data to the backend
  const sendTrackingData = async (type, data) => {
    if (!data) return;
    // const payload = {
    //   type,
    //   data,
    //   timestamp: new Date().toISOString(),
    // };
    console.log("data", data,type, trackingData);
    let payload = {};
    if (type === "scroll_depth") {
      payload = {
        scroll_depth: data || trackingData?.scrollDepth || 0,
        page_url: trackingData?.page_url || window.location.href,
        type: "scroll_depth",
      };
    } else
      payload = {
        page_url: data?.page_url || trackingData?.page_url || window.location.href,
        type: "page_url",
        scroll_depth: trackingData?.scrollDepth || 0,
      };
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
      trackingData.scrollDepth = scrollPercentage;
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
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("beforeunload", () => {
      sendTrackingData("exitIntent", { message: "Page unload" });
    });

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
