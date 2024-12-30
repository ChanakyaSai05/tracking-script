(function () {
  const trackingData = {
    scroll_depth: 0,
    page_url: window.location.href,
  };

  let isScrolling = false;
  let trackingBuffer = [];

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const flushTrackingData = () => {
    if (trackingBuffer.length > 0) {
      navigator.sendBeacon("https://be-agent.dev-vison.infiniticube.in/analytics/data", JSON.stringify(trackingBuffer));
      trackingBuffer = [];
    }
  };

  const sendTrackingData = (type, data) => {
    trackingBuffer.push({ type, data, timestamp: new Date() });
    if (trackingBuffer.length >= 10) {
      flushTrackingData();
    }
  };

  const handleScroll = debounce(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / docHeight) * 100;

    if (scrollPercentage > trackingData.scroll_depth) {
      trackingData.scroll_depth = scrollPercentage;
      sendTrackingData("scroll_depth", scrollPercentage);
    }
  }, 1000);

  const handleMouseLeave = (e) => {
    if (e.clientY < 10) {
      sendTrackingData("exitIntent", {
        message: "User is about to leave the page",
      });
    }
  };

  const updatePageUrl = () => {
    setTimeout(() => {
      if (trackingData.page_url !== window.location.href) {
        trackingData.page_url = window.location.href;
        sendTrackingData("page_url", window.location.href);
      }
    }, 50);
  };

  const initializeTracking = () => {
    window.addEventListener("load", () => {
      sendTrackingData("pageLoad", { page_url: trackingData.page_url });
    });

    window.addEventListener("scroll", () => {
      isScrolling = true;
      handleScroll();
    });

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("beforeunload", flushTrackingData);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushTrackingData();
      }
    });

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
