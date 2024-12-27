(function () {
  const trackingData = {
    scrollDepth: 0,
    // clicks: [],
    // scrollDirection: "",
    // timeOnPage: 0,
    // idleTime: 0,
    // errors: [],
    // promiseRejections: [],
    // visibility: "visible",
    page_url: window.location.href,
    userIP: "", // To be populated
  };

  const startTime = Date.now();
  let trackingBuffer = [];

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

  const trackTimeOnPage = () => {
    const endTime = Date.now();
    trackingData.timeOnPage = (endTime - startTime) / 1000;
    sendTrackingData("timeOnPage", trackingData.timeOnPage);
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

  const handleClick = (event) => {
    const clickedElement = event.target;
    sendTrackingData("click", {
      tagName: clickedElement.tagName,
      className: clickedElement.className,
      id: clickedElement.id,
      text: clickedElement.innerText,
    });
  };

  const handleMouseLeave = (e) => {
    if (e.clientY < 10) {
      sendTrackingData("exitIntent", {
        message: "User is about to leave the page",
      });
    }
  };

  const handleActivity = () => {
    clearTimeout(window.idleTimer);
    window.idleTimer = setTimeout(() => {
      sendTrackingData("idleTime", { message: "User idle for 30 seconds" });
    }, 30000);
  };

  const handleError = (error) => {
    sendTrackingData("error", {
      message: error.message,
      stack: error.error?.stack,
    });
  };

  const handleRejection = (event) => {
    sendTrackingData("promiseRejection", event.reason);
  };

  const handleScrollDirection = () => {
    const scrollTop = window.scrollY;
    trackingData.scrollDirection =
      scrollTop > window.lastScrollTop ? "down" : "up";
    window.lastScrollTop = scrollTop;
  };

  const handleVisibilityChange = () => {
    trackingData.visibility = document.hidden ? "hidden" : "visible";
    sendTrackingData("visibility", trackingData.visibility);
  };

  const handleScrollEnd = () => {
    if (
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight
    ) {
      sendTrackingData("scrollEnd", {
        message: "User reached the end of the page",
      });
    }
  };

  const updatePageUrl = () => {
    trackingData.page_url = window.location.href;
    sendTrackingData("page_url", trackingData.page_url);
  };

  const getUserIP = () => {
    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => {
        trackingData.userIP = data.ip;
        sendTrackingData("userIP", data.ip);
      })
      .catch((err) => console.error("Failed to fetch user IP:", err));
  };

  // Initialize script
  const initializeTracking = () => {
    getUserIP();

    window.addEventListener("load", updatePageUrl);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScrollDirection);
    window.addEventListener("scroll", handleScrollEnd);
    document.addEventListener("click", handleClick);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", flushTrackingData);

    // For SPAs, track route changes
    window.addEventListener("popstate", updatePageUrl);
  };

  initializeTracking();
})();
