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
    this.iframe.src = '${process.env.NEXT_PUBLIC_APP_URL}/widget';
    this.iframe.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 400px;
      height: 700px;
      border: none;
      z-index: 999999;
      background: transparent;
    `;

    this.container.appendChild(this.iframe);

    // Handle messages from iframe
    window.addEventListener('message', (event) => {
      if (event.origin !== '${process.env.NEXT_PUBLIC_APP_URL}') return;
      
      if (event.data.type === 'chat-widget-height') {
        this.iframe.style.height = `${event.data.height}px`;
      }
    });
  }
}

// Initialize the widget
window.ChatWidget = new ChatWidget();
window.ChatWidget.init(); 