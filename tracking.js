// tracking.js

// IIFE to isolate tracking logic and avoid conflicts
(function() {
  // Object to store tracking data
  const trackingData = {
    clicks: [],
    scrollDepth: 0,
    timeOnPage: 0,
    interactions: [],
  };

  // Start time on page
  const startTime = Date.now();

  // Function to track time spent on page
  const trackTimeOnPage = () => {
    const endTime = Date.now();
    trackingData.timeOnPage = (endTime - startTime) / 1000;
    sendTrackingData('timeOnPage', trackingData.timeOnPage);
  };

  // Function to track scroll depth
  const trackScrollDepth = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / docHeight) * 100;
    if (scrollPercentage > trackingData.scrollDepth) {
      trackingData.scrollDepth = scrollPercentage;
      sendTrackingData('scrollDepth', trackingData.scrollDepth);
    }
  };

  // Function to track clicks
  const trackClicks = (event) => {
    const { tagName, className, id } = event.target;
    trackingData.clicks.push({ tagName, className, id });
    sendTrackingData('click', { tagName, className, id });
  };

  // Send data to the backend
  const sendTrackingData = (type, data) => {
    console.log(type,data);
    // fetch('https://your-backend-url.com/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ type, data, timestamp: new Date() }),
    // });
  };

  // Add event listeners
  // window.addEventListener('beforeunload', trackTimeOnPage);
  window.addEventListener('scroll', trackScrollDepth);
  document.addEventListener('click', trackClicks);

  // Track idle time, visibility, etc., by adding more functions if needed
})();
