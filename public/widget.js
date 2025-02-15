// Widget initialization
(function(window, document) {
  // Store the original script tag
  var scripts = document.getElementsByTagName('script');
  var thisScript = scripts[scripts.length - 1];
  var widgetUrl = thisScript.src.replace('/api/embed', '');

  window.ChatWidget = class ChatWidget {
    constructor(config = {}) {
      this.config = {
        configId: config.configId || null,
        position: config.position || 'right',
        width: config.width || 400,
        height: config.height || 700,
        ...config
      };
      
      this.isOpen = false;
      this.iframe = null;
      this.button = null;
      this.widgetUrl = widgetUrl;
    }

    init() {
      // Create container
      const container = document.createElement('div');
      container.id = 'chat-widget-container';
      document.body.appendChild(container);

      // Create iframe
      this.iframe = document.createElement('iframe');
      this.iframe.id = 'chat-widget-iframe';
      
      // Set iframe source with config
      const url = this.config.configId 
        ? `${this.widgetUrl}/widget?configId=${encodeURIComponent(this.config.configId)}`
        : `${this.widgetUrl}/widget`;
      this.iframe.src = url;
      
      // Style iframe
      const position = this.config.position === 'left' ? 'left: 20px;' : 'right: 20px;';
      this.iframe.style.cssText = `
        position: fixed;
        bottom: 100px;
        ${position}
        width: ${this.config.width}px;
        height: ${this.config.height}px;
        border: none;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease, opacity 0.3s ease;
        transform: translateY(100%);
        opacity: 0;
        pointer-events: none;
        z-index: 999998;
      `;
      container.appendChild(this.iframe);

      // Create button
      this.button = document.createElement('button');
      this.button.id = 'chat-widget-button';
      this.button.style.cssText = `
        position: fixed;
        bottom: 20px;
        ${position}
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: url(https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif);
        background-size: cover;
        background-position: center;
        border: none;
        cursor: pointer;
        z-index: 999999;
        transition: transform 0.3s ease;
      `;

      // Create close overlay
      const closeOverlay = document.createElement('div');
      closeOverlay.style.cssText = `
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 50%;
      `;
      closeOverlay.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      this.button.appendChild(closeOverlay);

      // Add click handler
      this.button.onclick = () => this.toggle();
      container.appendChild(this.button);

      // Handle close message from iframe
      window.addEventListener('message', (event) => {
        if (event.origin !== this.widgetUrl) return;
        if (event.data.type === 'chat-widget-close') {
          this.close();
        }
      });
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.iframe.style.transform = 'translateY(0)';
      this.iframe.style.opacity = '1';
      this.iframe.style.pointerEvents = 'all';
      this.button.querySelector('div').style.opacity = '1';
    }

    close() {
      this.isOpen = false;
      this.iframe.style.transform = 'translateY(100%)';
      this.iframe.style.opacity = '0';
      this.iframe.style.pointerEvents = 'none';
      this.button.querySelector('div').style.opacity = '0';
    }
  }
})(window, document);

// Example usage:
// window.ChatWidget = new ChatWidget({
//   configId: 'customer_config_123',
//   position: 'right',
//   width: 400,
//   height: 700
// });
// window.ChatWidget.init(); 