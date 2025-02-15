// Widget initialization
(function(window) {
  window.ChatWidget = class ChatWidget {
    constructor(config = {}) {
      this.config = {
        borderRadius: 16,
        opacity: 99,
        blur: 3,
        width: 400,
        height: 700,
        ...config
      };
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;

      // Create chat button
      const button = document.createElement('div');
      button.style.position = 'fixed';
      button.style.bottom = '20px';
      button.style.right = '20px';
      button.style.width = '60px';
      button.style.height = '60px';
      button.style.borderRadius = '50%';
      button.style.background = 'url("https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif") center center no-repeat';
      button.style.backgroundSize = 'cover';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      button.style.transition = 'transform 0.3s ease';
      button.style.zIndex = '999999';

      // Create chat iframe container for styling
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.bottom = '100px';
      container.style.right = '20px';
      container.style.width = `${this.config.width}px`;
      container.style.height = `${this.config.height}px`;
      container.style.borderRadius = `${this.config.borderRadius}px`;
      container.style.overflow = 'hidden';
      container.style.display = 'none';
      container.style.zIndex = '999999';
      container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      container.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      
      // Create chat iframe
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = `${this.config.borderRadius}px`;
      
      // Get base URL from our script tag
      let baseUrl = 'https://v0-chat-eta.vercel.app';  // Default fallback
      const scripts = document.getElementsByTagName('script');
      for (const script of scripts) {
        if (script.src && script.src.includes('widget.js')) {
          baseUrl = script.src.split('/widget.js')[0];
          break;
        }
      }
      
      // Set iframe source with properly encoded config
      const params = new URLSearchParams();
      params.append('config', JSON.stringify(this.config));
      iframe.src = `${baseUrl}/widget?${params.toString()}`;

      // Add iframe to container
      container.appendChild(iframe);

      // Add click handler
      button.onclick = () => {
        if (container.style.display === 'none') {
          container.style.display = 'block';
          button.style.transform = 'scale(0.9)';
          // Add a small delay to allow the display change to take effect
          setTimeout(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
          }, 50);
        } else {
          container.style.opacity = '0';
          container.style.transform = 'translateY(10px)';
          button.style.transform = 'scale(1)';
          // Hide container after animation
          setTimeout(() => {
            container.style.display = 'none';
          }, 300);
        }
      };

      // Set initial styles
      container.style.opacity = '0';
      container.style.transform = 'translateY(10px)';

      // Add elements to DOM
      document.body.appendChild(button);
      document.body.appendChild(container);

      // Handle messages from iframe
      window.addEventListener('message', (event) => {
        if (event.origin === baseUrl) {
          if (event.data === 'close') {
            container.style.opacity = '0';
            container.style.transform = 'translateY(10px)';
            button.style.transform = 'scale(1)';
            setTimeout(() => {
              container.style.display = 'none';
            }, 300);
          }
        }
      });
    }
  };
})(window);

// Process any queued commands
if (window.ChatWidgetQueue) {
  window.ChatWidgetQueue.forEach((cmd) => {
    if (cmd.type === 'init') {
      const widget = new window.ChatWidget(cmd.config);
      widget.init();
    }
  });
  window.ChatWidgetQueue = [];
}

// Example usage:
// window.ChatWidget = new ChatWidget({
//   configId: 'customer_config_123',
//   position: 'right',
//   width: 400,
//   height: 700
// });
// window.ChatWidget.init(); 