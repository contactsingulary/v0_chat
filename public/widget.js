class ChatWidget {
  constructor() {
    this.initialized = false;
    this.container = null;
    this.iframe = null;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'chat-widget-container';
    document.body.appendChild(this.container);

    // Create and style iframe
    this.iframe = document.createElement('iframe');
    this.iframe.id = 'chat-widget-iframe';
    this.iframe.src = 'https://v0-chat-eta.vercel.app/widget';
    this.iframe.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      height: 600px;
      border: none;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      background: transparent;
      transition: all 0.3s ease;
      transform: translateX(0);
    `;

    this.container.appendChild(this.iframe);

    // Handle messages from iframe
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://v0-chat-eta.vercel.app') return;
      
      if (event.data.type === 'chat-widget-height') {
        this.iframe.style.height = `${event.data.height}px`;
      }
    });

    // Add responsive handling
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 480) {
        this.iframe.style.width = '100%';
        this.iframe.style.right = '0';
        this.iframe.style.bottom = '0';
        this.iframe.style.borderRadius = '0';
      } else {
        this.iframe.style.width = '380px';
        this.iframe.style.right = '20px';
        this.iframe.style.bottom = '20px';
        this.iframe.style.borderRadius = '10px';
      }
    });
  }
}

// Initialize the widget
window.ChatWidget = new ChatWidget();
window.ChatWidget.init(); 