export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates periodically
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('ChitroKatha offline cache updated. New content ready.');
                  } else {
                    console.log('ChitroKatha content is now cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          // Fallback gracefully (e.g. in preview sandboxes or unsupported origins)
          console.warn('ServiceWorker registration omitted:', error?.message || error);
        });
    });
  }
}
