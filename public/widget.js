// Widget initialization
(function(window) {
  window.ChatWidget = class ChatWidget {
    constructor(config = {}) {
      this.config = config;
      this.isOpen = false;
      this.iframeContainer = null;
      this.button = null;
    }

    init() {
      this.createButton();
      this.createIframeContainer();
      this.addEventListeners();
    }

    createButton() {
      // Create button if it doesn't exist
      if (!this.button) {
        this.button = document.createElement('div');
        this.button.id = 'chat-widget-button';
        this.button.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #9333EA;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        `;
        
        // Add chat icon
        const icon = document.createElement('div');
        icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.5 21L5.89944 20.3229C6.28389 20.22 6.69119 20.2791 7.04753 20.4565C8.38837 21.1244 9.90029 21.5 11.5 21.5C11.6681 21.5 11.8345 21.4959 12 21.4877C12 21.4959 11.8345 21.5 11.6681 21.5C11.5 21.5 11.6681 21.5 12 21.4877" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        this.button.appendChild(icon);
        
        document.body.appendChild(this.button);
      }
    }

    createIframeContainer() {
      // Create iframe container if it doesn't exist
      if (!this.iframeContainer) {
        this.iframeContainer = document.createElement('div');
        this.iframeContainer.id = 'chat-widget-container';
        this.iframeContainer.style.cssText = `
          position: fixed;
          bottom: 100px;
          right: 20px;
          width: 400px;
          height: 600px;
          max-height: 80vh;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 999998;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          transition: all 0.3s ease;
        `;
        
        // Create and append iframe
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        `;
        
        // Use the correct URL for the iframe src
        const baseUrl = this.config.baseUrl || "https://v0-chat-eta.vercel.app";
        iframe.src = `${baseUrl}/widget?config=${encodeURIComponent(JSON.stringify(this.config))}`;
        
        this.iframeContainer.appendChild(iframe);
        document.body.appendChild(this.iframeContainer);
      }
    }

    addEventListeners() {
      // Toggle chat on button click
      this.button.addEventListener('click', () => {
        this.toggleChat();
      });

      // Handle messages from iframe
      window.addEventListener('message', (event) => {
        // Verify origin
        const baseUrl = this.config.baseUrl || "https://v0-chat-eta.vercel.app";
        if (event.origin !== baseUrl) return;

        // Handle close message
        if (event.data === 'close-chat') {
          this.closeChat();
        }
      });

      // Handle window resize
      window.addEventListener('resize', () => {
        if (this.isOpen) {
          this.adjustPosition();
        }
      });
    }

    toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }

    openChat() {
      this.isOpen = true;
      this.iframeContainer.style.opacity = '1';
      this.iframeContainer.style.visibility = 'visible';
      this.iframeContainer.style.transform = 'translateY(0)';
      this.button.style.transform = 'scale(0.9)';
      this.adjustPosition();
    }

    closeChat() {
      this.isOpen = false;
      this.iframeContainer.style.opacity = '0';
      this.iframeContainer.style.visibility = 'hidden';
      this.iframeContainer.style.transform = 'translateY(20px)';
      this.button.style.transform = 'scale(1)';
    }

    adjustPosition() {
      // Get viewport dimensions
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      // Default dimensions
      const width = Math.min(400, vw - 40);
      const height = Math.min(600, vh - 120);
      
      // Update container dimensions
      this.iframeContainer.style.width = `${width}px`;
      this.iframeContainer.style.height = `${height}px`;
      
      // Adjust position for small screens
      if (vw <= 480) {
        this.iframeContainer.style.right = '10px';
        this.iframeContainer.style.bottom = '80px';
        this.button.style.right = '10px';
        this.button.style.bottom = '10px';
      } else {
        this.iframeContainer.style.right = '20px';
        this.iframeContainer.style.bottom = '100px';
        this.button.style.right = '20px';
        this.button.style.bottom = '20px';
      }
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