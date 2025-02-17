// Widget initialization
(function(window) {
  window.ChatWidget = class ChatWidget {
    constructor(config = {}) {
      this.config = config;
      this.isOpen = false;
      this.iframeContainer = null;
      this.button = null;
      this.popup = null;
      this.consentModal = null;
      this.gifUrl = "https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif";
    }

    init() {
      this.createButton();
      this.createIframeContainer();
      this.createInitialPopup();
      this.createConsentModal();
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
          opacity: 0;
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

    createConsentModal() {
      if (!this.consentModal) {
        this.consentModal = document.createElement('div');
        this.consentModal.style.cssText = `
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 400px;
          background: var(--modal-bg, white);
          border: 1px solid var(--border-color, #e5e5e5);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 999999;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.3s ease;
          color: var(--text-color, #1a1a1a);
        `;
        
        // Add dark mode support
        const darkModeStyle = document.createElement('style');
        darkModeStyle.textContent = `
          @media (prefers-color-scheme: dark) {
            .chat-widget-consent {
              --modal-bg: #1a1a1a;
              --border-color: #2a2a2a;
              --text-color: #ffffff;
              --muted-color: #a1a1aa;
              --button-bg: #2a2a2a;
              --button-hover: #3a3a3a;
            }
          }
          
          @media (prefers-color-scheme: light) {
            .chat-widget-consent {
              --modal-bg: #ffffff;
              --border-color: #e5e5e5;
              --text-color: #1a1a1a;
              --muted-color: #71717a;
              --button-bg: #f4f4f5;
              --button-hover: #e4e4e7;
            }
          }
        `;
        document.head.appendChild(darkModeStyle);
        this.consentModal.classList.add('chat-widget-consent');
        
        this.consentModal.innerHTML = `
          <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: var(--text-color);">
              Datenschutzeinstellungen
            </h3>
            <p style="margin: 0; font-size: 14px; color: var(--muted-color);">
              Bitte wählen Sie aus, welche Cookies Sie akzeptieren möchten.
            </p>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="
                  width: 40px;
                  height: 24px;
                  background: var(--button-bg);
                  border-radius: 12px;
                  position: relative;
                  pointer-events: none;
                ">
                  <div style="
                    position: absolute;
                    left: 4px;
                    top: 4px;
                    width: 16px;
                    height: 16px;
                    background: var(--text-color);
                    border-radius: 50%;
                    transform: translateX(16px);
                  "></div>
                </div>
                <span style="font-size: 14px; font-weight: 500; color: var(--text-color);">Essenzielle Cookies</span>
              </label>
              <p style="margin: 4px 0 0 48px; font-size: 12px; color: var(--muted-color);">
                Notwendig für die Grundfunktionen des Chats.
              </p>
            </div>

            <div>
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="
                  width: 40px;
                  height: 24px;
                  background: var(--button-bg);
                  border-radius: 12px;
                  position: relative;
                  cursor: pointer;
                " id="non-essential-switch">
                  <div style="
                    position: absolute;
                    left: 4px;
                    top: 4px;
                    width: 16px;
                    height: 16px;
                    background: var(--text-color);
                    border-radius: 50%;
                    transform: translateX(16px);
                    transition: transform 0.2s ease;
                  "></div>
                </div>
                <span style="font-size: 14px; font-weight: 500; color: var(--text-color);">Nicht-essenzielle Cookies</span>
              </label>
              <p style="margin: 4px 0 0 48px; font-size: 12px; color: var(--muted-color);">
                Für erweiterte Funktionen und Analysen.
              </p>
            </div>
          </div>

          <div style="font-size: 12px; color: var(--muted-color); margin-bottom: 24px;">
            <p style="margin: 0 0 8px;">Verantwortliche Stelle: Singulary</p>
            <p style="margin: 0 0 8px;">Zweck: Chat-Funktionalität, Personalisierung</p>
            <p style="margin: 0 0 8px;">Speicherdauer: 12 Monate</p>
            <p style="margin: 0 0 8px;">Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</p>
            <p style="margin: 0;">
              Weitere Informationen finden Sie in unserer
              <a href="https://www.singulary.net/datenschutz" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 style="color: var(--text-color); text-decoration: underline; text-underline-offset: 4px;">
                Datenschutzerklärung
              </a>
            </p>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 12px;">
            <button id="decline-cookies" style="
              flex: 1;
              padding: 8px 16px;
              border: 1px solid var(--border-color);
              background: var(--modal-bg);
              color: var(--text-color);
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s ease;
            ">
              Ablehnen
            </button>
            <button id="accept-cookies" style="
              flex: 1;
              padding: 8px 16px;
              border: none;
              background: var(--button-bg);
              color: var(--text-color);
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s ease;
            ">
              Einstellungen speichern
            </button>
          </div>
        `;
        
        document.body.appendChild(this.consentModal);
        
        // Add hover effects for buttons
        const buttons = this.consentModal.querySelectorAll('button');
        buttons.forEach(button => {
          button.addEventListener('mouseover', () => {
            button.style.background = 'var(--button-hover)';
          });
          button.addEventListener('mouseout', () => {
            button.style.background = button.id === 'accept-cookies' ? 'var(--button-bg)' : 'var(--modal-bg)';
          });
        });
        
        // Add switch toggle functionality
        let nonEssentialEnabled = true;
        const switchEl = this.consentModal.querySelector('#non-essential-switch');
        const toggleSwitch = () => {
          nonEssentialEnabled = !nonEssentialEnabled;
          const handle = switchEl.querySelector('div');
          handle.style.transform = nonEssentialEnabled ? 'translateX(16px)' : 'translateX(0)';
        };
        switchEl.addEventListener('click', toggleSwitch);
        
        // Add event listeners for consent buttons
        this.consentModal.querySelector('#accept-cookies').addEventListener('click', () => {
          this.handleCookieConsent({ essential: true, nonEssential: nonEssentialEnabled });
        });
        
        this.consentModal.querySelector('#decline-cookies').addEventListener('click', () => {
          this.hideConsentModal();
        });
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

    showConsentModal() {
      if (this.consentModal) {
        this.consentModal.style.opacity = '1';
        this.consentModal.style.visibility = 'visible';
        this.consentModal.style.transform = 'translateY(0)';
      }
    }

    hideConsentModal() {
      if (this.consentModal) {
        this.consentModal.style.opacity = '0';
        this.consentModal.style.visibility = 'hidden';
        this.consentModal.style.transform = 'translateY(10px)';
      }
    }

    handleCookieConsent(settings) {
      // Save consent to localStorage
      localStorage.setItem('privacyConsent', JSON.stringify(settings));
      this.hideConsentModal();
      this.openChat();
    }

    addEventListeners() {
      // Handle button click
      this.button.addEventListener('click', () => {
        if (this.isOpen) {
          this.closeChat();
        } else {
          // Check privacy approach
          if (this.config.privacyApproach === 'pre') {
            const consent = localStorage.getItem('privacyConsent');
            if (!consent) {
              this.showConsentModal();
              return;
            }
          }
          this.openChat();
        }
      });

      // Hide popup when chat is opened
      if (this.popup) {
        this.popup.addEventListener('click', () => {
          this.hideInitialPopup();
          if (this.config.privacyApproach === 'pre') {
            const consent = localStorage.getItem('privacyConsent');
            if (!consent) {
              this.showConsentModal();
              return;
            }
          }
          this.openChat();
        });
      }

      // Handle messages from iframe
      window.addEventListener('message', (event) => {
        const baseUrl = this.config.baseUrl || "https://v0-chat-eta.vercel.app";
        if (event.origin !== baseUrl) return;

        if (event.data.type === 'chat-widget-close') {
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
      this.hideInitialPopup();
      this.iframeContainer.style.opacity = '1';
      this.iframeContainer.style.visibility = 'visible';
      this.iframeContainer.style.transform = 'translateY(0)';
      this.button.style.transform = 'scale(0.9)';
      this.closeOverlay.style.opacity = '1';
      this.adjustPosition();
    }

    closeChat() {
      this.isOpen = false;
      this.iframeContainer.style.opacity = '0';
      this.iframeContainer.style.visibility = 'hidden';
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
        if (this.consentModal) {
          this.consentModal.style.right = '10px';
          this.consentModal.style.bottom = '80px';
          this.consentModal.style.width = 'calc(100vw - 20px)';
          this.consentModal.style.maxWidth = '400px';
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
        if (this.consentModal) {
          this.consentModal.style.right = '20px';
          this.consentModal.style.bottom = '90px';
          this.consentModal.style.width = '400px';
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