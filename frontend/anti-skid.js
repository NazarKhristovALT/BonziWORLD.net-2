(function() {
  const REDIRECT_URL = "skid.html";
  const DIMENSION_THRESHOLD = 160;

  // Method 1: The Dimension Check
  const checkDimensions = () => {
    if (window.outerWidth - window.innerWidth > DIMENSION_THRESHOLD || window.outerHeight - window.innerHeight > DIMENSION_THRESHOLD) {
      window.location.href = REDIRECT_URL;
    }
  };

  // Method 2: The `debugger` Check3
  const checkDebugger = () => {
    try {
      const check = new Function('debugger', 'return false');
      if (check()) {
        window.location.href = REDIRECT_URL;
      }
    } catch (e) {
      // Do nothing, the debugger is not active
    }
  };

  // Method 3: The `console.profile` Check (Less Reliable)
  const checkProfile = () => {
    if (console && console.profile) {
      console.profile();
      setTimeout(() => {
        console.profileEnd();
        if (console.profiles && console.profiles.length > 0) {
          window.location.href = REDIRECT_URL;
        }
      }, 10);
    }
  };

  // Method 4: The Keyboard Shortcut Check
  document.addEventListener('keydown', (e) => {
    // F12 key
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      window.location.href = REDIRECT_URL;
    }
    // Ctrl+Shift+I for Windows/Linux
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73)) {
      e.preventDefault();
      window.location.href = REDIRECT_URL;
    }
    // Cmd+Opt+I for Mac
    if (e.metaKey && e.altKey && (e.key === 'I' || e.keyCode === 73)) {
      e.preventDefault();
      window.location.href = REDIRECT_URL;
    }
  });

    // Method 5: Chat Message Check for <script></script>
    document.addEventListener('chat-message', function(e) {
      if (e.detail && typeof e.detail.text === 'string' && e.detail.text.includes('<script>') && e.detail.text.includes('</script>')) {
        e.preventDefault();
        window.location.href = REDIRECT_URL;
      }
    });

  // Combine all checks into a single interval for efficiency
  setInterval(() => {
    checkDimensions();
    checkDebugger();
    checkProfile();
  }, 500);

})();