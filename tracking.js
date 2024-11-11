(function() {
  // Object to store tracking data
  const trackingData = {
    scrollDepth: 0,
    clicks: [],
    scrollDirection: '',
    timeOnPage: 0,
    idleTime: 0,
    errors: [],
    promiseRejections: [],
    visibility: 'visible',
    page_url:""
  };

  // Start time on page
  const startTime = Date.now();

  // Function to send data to the backend
  const sendTrackingData = (type, data) => {
    console.log(trackingData,"trackingData");
    // fetch('https://your-backend-url.com/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ type, data, timestamp: new Date() }),
    // });
  };

  // 1. Track Time Spent on Page
  const trackTimeOnPage = () => {
    const endTime = Date.now();
    trackingData.timeOnPage = (endTime - startTime) / 1000;
    sendTrackingData('timeOnPage', trackingData.timeOnPage);
  };

  // 2. Track Scroll Depth
  let scrollDepth = 0;
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / docHeight) * 100;

    if (scrollPercentage > scrollDepth) {
      scrollDepth = scrollPercentage;
      trackingData.scrollDepth = scrollPercentage;
      console.log(`User has scrolled ${scrollPercentage.toFixed(2)}% of the page`);
      sendTrackingData('scrollDepth', scrollPercentage);
    }
  };

  // 3. Track Click Events on Specific Elements
  const handleClick = (event) => {
    const clickedElement = event.target;
    const tagName = clickedElement.tagName;
    const className = clickedElement.className;
    const id = clickedElement.id;
    const text = clickedElement.innerText;

    console.log(`User clicked on element with Tag: ${tagName}, Class: ${className}, ID: ${id}, text: ${text}`);
    trackingData.clicks.push({ tagName, className, id, text });
    sendTrackingData('click', { tagName, className, id, text });
  };

  // 4. Detect Exit Intent
  const handleMouseLeave = (e) => {
    if (e.clientY < 10) {
      console.log("User is about to exit the page");
      sendTrackingData('exitIntent', { message: 'User is about to leave the page' });
    }
  };

  // 5. Track Idle Time
  let idleTimer;
  const handleActivity = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      console.log("User has been idle for 30 seconds");
      sendTrackingData('idleTime', { message: 'User idle for 30 seconds' });
    }, 30000); // 30 seconds of inactivity
  };

  // 6. Track JavaScript Errors
  const handleError = (error) => {
    console.log(`JavaScript error: ${error.message}`);
    trackingData.errors.push(error);
    sendTrackingData('error', error);
  };

  // 7. Track Unhandled Promise Rejections
  const handleRejection = (event) => {
    console.log(`Promise rejected: ${event.reason}`);
    trackingData.promiseRejections.push(event.reason);
    sendTrackingData('promiseRejection', event.reason);
  };

  // 8. Scroll Direction Tracking
  let lastScrollTop = window.scrollY;
  const handleScrollDirection = () => {
    const scrollTop = window.scrollY;
    if (scrollTop > lastScrollTop) {
      console.log("User is scrolling down");
      trackingData.scrollDirection = 'down';
    } else {
      console.log("User is scrolling up");
      trackingData.scrollDirection = 'up';
    }
    lastScrollTop = scrollTop;
  };

  // 9. Track Page Visibility
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log("User left the page");
      trackingData.visibility = 'hidden';
    } else {
      console.log("User returned to the page");
      trackingData.visibility = 'visible';
    }
    sendTrackingData('visibility', trackingData.visibility);
  };

  // 10. Reading Completion Tracking
  const handleScrollEnd = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollTop + window.innerHeight >= docHeight) {
      console.log('User reached the end of the article');
      sendTrackingData('scrollEnd', { message: 'User reached the end of the page' });
    }
  };

  // 11. page url
  const getPageUrl=()=>{
    let page_url=window.location.href
    trackingData.page_url= page_url;
    sendTrackingData("page_url",page_url);
  }

  // Add event listeners
  // window.addEventListener("beforeunload", trackTimeOnPage);
  window.addEventListener("scroll", handleScroll);
  document.addEventListener("click", handleClick);
  document.addEventListener("mouseleave", handleMouseLeave);
  window.addEventListener("mousemove", handleActivity);
  window.addEventListener("keydown", handleActivity);
  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);
  window.addEventListener("scroll", handleScrollDirection);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("scroll", handleScrollEnd);
  window.addEventListener("onload", getPageUrl);

  // Cleanup event listeners
  return () => {
    // window.removeEventListener("beforeunload", trackTimeOnPage);
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("click", handleClick);
    document.removeEventListener("mouseleave", handleMouseLeave);
    window.removeEventListener("mousemove", handleActivity);
    window.removeEventListener("keydown", handleActivity);
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
    window.removeEventListener("scroll", handleScrollDirection);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("scroll", handleScrollEnd);
    window.addEventListener("onload", getPageUrl);
  };
})();
