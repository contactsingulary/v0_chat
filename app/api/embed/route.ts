import { NextResponse } from 'next/server'

export async function GET() {
  const script = `
    (function(w,d,s,o,f,js,fjs){
      w['ChatWidget']=o;w[o]=w[o]||function(){
        (w[o].q=w[o].q||[]).push(arguments)};
      js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
      js.id='chat-widget-script';
      js.src='https://v0-chat-eta.vercel.app/widget.js';
      js.async=1;
      fjs.parentNode.insertBefore(js,fjs);
    }(window,document,'script','cw'));
  `

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  })
} 