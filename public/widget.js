// Widget initialization
(function(window) {
  window.ChatWidget = class ChatWidget {
    constructor(config = {}) {
      this.config = config;
      this.isOpen = false;
      this.iframeContainer = null;
      this.button = null;
      this.popup = null;
      this.iframeLoaded = false;
      this.iframeReady = false;
      this.messageQueue = [];
      this.gifUrl = "https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif";
    }

    init() {
      this.createButton();
      this.createIframeContainer();
      this.createInitialPopup();
      this.addEventListeners();
      
      // Show initial popup after a delay if enabled
      if (this.config.showInitialPopup) {
        setTimeout(() => {
          this.showInitialPopup();
        }, 1000);
      }
    }

    createButton() {
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
          background: url("${this.gifUrl}") center center no-repeat;
          background-size: cover;
          cursor: pointer;
          z-index: 999999;
          transition: transform 0.3s ease;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        `;
        
        // Create close overlay (initially hidden)
        const closeOverlay = document.createElement('div');
        closeOverlay.style.cssText = `
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(to bottom right, rgba(0,0,0,0.8), rgba(0,0,0,0.6));
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        
        // Add close icon
        closeOverlay.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        
        this.button.appendChild(closeOverlay);
        document.body.appendChild(this.button);
        this.closeOverlay = closeOverlay;
      }
    }

    createIframeContainer() {
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
          visibility: hidden;
          transform: translateY(20px);
          transition: all 0.3s ease;
          background: white;
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
        
        // Add the GIF URL to the config for the chat interface
        const iframeConfig = {
          ...this.config,
          avatarUrl: this.gifUrl
        };
        
        iframe.src = `${baseUrl}/widget?config=${encodeURIComponent(JSON.stringify(iframeConfig))}`;
        
        this.iframeContainer.appendChild(iframe);
        document.body.appendChild(this.iframeContainer);

        // Listen for messages from iframe
        window.addEventListener('message', (event) => {
          const baseUrl = this.config.baseUrl || "https://v0-chat-eta.vercel.app";
          if (event.origin !== baseUrl && !event.origin.includes('localhost')) {
            console.log('Ignored message from unauthorized origin:', event.origin);
            return;
          }

          console.log('Received message:', event.data);

          if (event.data.type === 'chat-widget-close') {
            this.closeChat();
          } else if (event.data.type === 'consent-accepted') {
            console.log('Consent accepted, opening chat');
            this.openChat();
          }
        });
      }
    }

    createInitialPopup() {
      if (!this.popup) {
        this.popup = document.createElement('div');
        this.popup.style.cssText = `
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 260px;
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          z-index: 999999;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.3s ease;
        `;
        
        // Add message text
        const message = document.createElement('p');
        message.style.cssText = `
          margin: 0;
          font-size: 14px;
          color: #1a1a1a;
          line-height: 1.4;
        `;
        message.textContent = this.config.initialPopupMessage || "Haben Sie Fragen? Ich bin hier, um zu helfen!";
        
        // Add arrow
        const arrow = document.createElement('div');
        arrow.style.cssText = `
          position: absolute;
          bottom: -8px;
          right: 24px;
          width: 16px;
          height: 16px;
          background: white;
          transform: rotate(45deg);
          box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.1);
        `;
        
        this.popup.appendChild(message);
        this.popup.appendChild(arrow);
        document.body.appendChild(this.popup);
      }
    }

    showInitialPopup() {
      if (this.popup && !this.isOpen) {
        this.popup.style.opacity = '1';
        this.popup.style.visibility = 'visible';
        this.popup.style.transform = 'translateY(0)';
        
        // Hide popup after 4 seconds
        setTimeout(() => {
          this.hideInitialPopup();
        }, 4000);
      }
    }

    hideInitialPopup() {
      if (this.popup) {
        this.popup.style.opacity = '0';
        this.popup.style.visibility = 'hidden';
        this.popup.style.transform = 'translateY(10px)';
      }
    }

    addEventListeners() {
      // Handle button click
      this.button.addEventListener('click', () => {
        if (this.isOpen) {
          this.closeChat();
        } else {
          this.handleChatOpen();
        }
      });

      // Hide popup when chat is opened
      if (this.popup) {
        this.popup.addEventListener('click', () => {
          this.hideInitialPopup();
          this.handleChatOpen();
        });
      }

      // Handle window resize
      window.addEventListener('resize', () => {
        if (this.isOpen) {
          this.adjustPosition();
        }
      });
    }

    handleChatOpen() {
      console.log('handleChatOpen called');
      // Always check privacy approach first
      const privacyApproach = this.config.privacyApproach || 'passive';
      const hasConsent = localStorage.getItem('privacyConsent');

      console.log('Privacy approach:', privacyApproach);
      console.log('Has consent:', hasConsent);

      switch (privacyApproach) {
        case 'pre':
          // Show only consent modal first if no consent
          if (!hasConsent) {
            console.log('Showing consent modal');
            // Make iframe visible
            this.iframeContainer.style.visibility = 'visible';
            this.iframeContainer.style.opacity = '1';
            this.iframeContainer.style.transform = 'translateY(0)';
            
            // Send consent message
            const iframe = this.iframeContainer.querySelector('iframe');
            if (iframe) {
              console.log('Sending show-consent message');
              iframe.contentWindow.postMessage({ type: 'show-consent' }, '*');
            }
            return;
          }
          break;
        case 'in-chat':
          // Handled by the iframe
          break;
        case 'passive':
          // Auto-accept on first open
          if (!hasConsent) {
            console.log('Auto-accepting consent for passive approach');
            localStorage.setItem('privacyConsent', JSON.stringify({ essential: true, nonEssential: true }));
          }
          break;
        case 'none':
          // No privacy check needed
          break;
      }

      console.log('Opening chat');
      this.openChat();
    }

    toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.handleChatOpen();
      }
    }

    openChat() {
      console.log('openChat called');
      this.isOpen = true;
      this.hideInitialPopup();
      this.iframeContainer.style.visibility = 'visible';
      this.iframeContainer.style.opacity = '1';
      this.iframeContainer.style.transform = 'translateY(0)';
      this.button.style.transform = 'scale(0.9)';
      this.closeOverlay.style.opacity = '1';
      this.adjustPosition();
    }

    closeChat() {
      console.log('closeChat called');
      this.isOpen = false;
      this.iframeContainer.style.visibility = 'hidden';
      this.iframeContainer.style.opacity = '0';
      this.iframeContainer.style.transform = 'translateY(20px)';
      this.button.style.transform = 'scale(1)';
      this.closeOverlay.style.opacity = '0';
    }

    adjustPosition() {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      const width = Math.min(400, vw - 40);
      const height = Math.min(600, vh - 120);
      
      this.iframeContainer.style.width = `${width}px`;
      this.iframeContainer.style.height = `${height}px`;
      
      if (vw <= 480) {
        this.iframeContainer.style.right = '10px';
        this.iframeContainer.style.bottom = '80px';
        this.button.style.right = '10px';
        this.button.style.bottom = '10px';
        if (this.popup) {
          this.popup.style.right = '10px';
          this.popup.style.bottom = '80px';
        }
      } else {
        this.iframeContainer.style.right = '20px';
        this.iframeContainer.style.bottom = '100px';
        this.button.style.right = '20px';
        this.button.style.bottom = '20px';
        if (this.popup) {
          this.popup.style.right = '20px';
          this.popup.style.bottom = '90px';
        }
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