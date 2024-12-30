(function () {
  const trackingData = {
    scrollDepth: 0,
    page_url: window.location.href,
  };

  const startTime = Date.now();
  let trackingBuffer = [];
  let debounceTimer;
  let batchTimeout;
  const BATCH_SIZE = 10;
  const BATCH_TIMEOUT = 5000;
  const MAX_RETRIES = 3;

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const flushTrackingData = () => {
    // if (trackingBuffer.length > 0) {
    //   fetch("https://your-backend-url.com/track", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(trackingBuffer),
    //   }).catch((err) => console.error("Failed to send tracking data:", err));
    //   trackingBuffer = [];
    // }
  };

  const sendTrackingData = (type, data) => {
    console.log(`Tracking ${type}:`, trackingData);
    trackingBuffer.push({ type, data, timestamp: new Date() });
    if (trackingBuffer.length >= 10) {
      // Adjust batching threshold
      flushTrackingData();
    }
  };

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / docHeight) * 100;

    if (scrollPercentage > trackingData.scrollDepth) {
      trackingData.scrollDepth = scrollPercentage;
      sendTrackingData("scrollDepth", scrollPercentage);
    }
  };

  const handleMouseLeave = (e) => {
    if (e.clientY < 10) {
      sendTrackingData("exitIntent", {
        message: "User is about to leave the page",
      });
    }
  };

  const updatePageUrl = () => {
    // Add small delay to ensure URL has updated
    setTimeout(() => {
      trackingData.page_url = window.location.href;
      console.log("page url", window.location.href);
      sendTrackingData("page_url", window.location.href);
    }, 50);
  };

  // Initialize script
  const initializeTracking = () => {
    window.addEventListener("load", updatePageUrl);
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("beforeunload", flushTrackingData);

    // Add URL change detection via mutation observer
    const urlObserver = new MutationObserver(() => {
      if (trackingData.page_url !== window.location.href) {
        updatePageUrl();
      }
    });

    urlObserver.observe(document.querySelector("body"), {
      childList: true,
      subtree: true,
    });
  };

  initializeTracking();
})();
