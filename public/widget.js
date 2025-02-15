// Widget initialization
(function(window) {
  window.ChatWidget = class ChatWidget {
    constructor(config = {}) {
      this.config = config;
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

      // Create chat iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.bottom = '100px';
      iframe.style.right = '20px';
      iframe.style.width = this.config.width || '400px';
      iframe.style.height = this.config.height || '700px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = (this.config.borderRadius || 16) + 'px';
      iframe.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      iframe.style.display = 'none';
      iframe.style.zIndex = '999999';
      
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
      const safeConfig = {
        ...this.config,
        width: undefined,  // Remove properties we don't want to pass
        height: undefined  // as they're handled in the iframe itself
      };
      
      // Construct URL with properly encoded config
      const params = new URLSearchParams();
      params.append('config', JSON.stringify(safeConfig));
      iframe.src = `${baseUrl}/widget?${params.toString()}`;

      // Add click handler
      button.onclick = () => {
        if (iframe.style.display === 'none') {
          iframe.style.display = 'block';
          button.style.transform = 'scale(0.9)';
        } else {
          iframe.style.display = 'none';
          button.style.transform = 'scale(1)';
        }
      };

      // Add elements to DOM
      document.body.appendChild(button);
      document.body.appendChild(iframe);

      // Handle messages from iframe
      window.addEventListener('message', (event) => {
        if (event.origin === baseUrl) {
          if (event.data === 'close') {
            iframe.style.display = 'none';
            button.style.transform = 'scale(1)';
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