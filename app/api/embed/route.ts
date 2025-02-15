import { NextResponse } from 'next/server'

export async function GET() {
  const script = `
    // Wait for DOM to be ready
    function initChatWidget() {
      if (typeof window.ChatWidget === 'undefined') {
        // If not loaded yet, try again in 100ms
        setTimeout(initChatWidget, 100);
        return;
      }
      
      // Initialize widget with configuration
      const widget = new window.ChatWidget({
        position: 'right',
        width: 400,
        height: 700
      });
      
      widget.init();
    }

    // Load widget script
    const script = document.createElement('script');
    script.src = window.location.origin + '/widget.js';
    script.async = true;
    script.onload = initChatWidget;
    document.head.appendChild(script);
  `

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  })
} 