import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Get the host from the request
  const host = request.headers.get('host') || ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const script = `
    (function() {
      // Create a queue for commands before widget is ready
      window.ChatWidgetQueue = window.ChatWidgetQueue || [];
      
      // Create a temporary ChatWidget object to capture initialization config
      let config = null;
      window.ChatWidget = function(conf) {
        config = conf;
        return { init: function() { window.ChatWidgetQueue.push({ type: 'init', config: conf }); } };
      };

      // Load the actual widget script
      const script = document.createElement('script');
      script.src = "${baseUrl}/widget.js";
      script.async = true;
      script.onload = function() {
        // Process queued commands
        if (config) {
          const widget = new window.ChatWidget(config);
          widget.init();
        }
        window.ChatWidgetQueue.forEach(function(cmd) {
          if (cmd.type === 'init') {
            const widget = new window.ChatWidget(cmd.config);
            widget.init();
          }
        });
        window.ChatWidgetQueue = [];
      };
      document.head.appendChild(script);
    })();
  `

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  })
} 