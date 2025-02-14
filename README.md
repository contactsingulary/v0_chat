# Chat Widget

A customizable chat widget that can be embedded into any website.

## Features

- 🚀 Easy to embed
- 💅 Customizable UI
- 🔒 Secure cross-origin communication
- 📱 Responsive design
- 🤖 Powered by Botpress

## Installation

1. Clone the repository:
```bash
git clone https://github.com/contactsingulary/web-widget.git
cd web-widget
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
BOTPRESS_WEBHOOK_URL=your_botpress_webhook_url
NEXT_PUBLIC_APP_URL=your_app_url
```

## Development

Run the development server:

```bash
npm run dev
```

## Embedding

Add this script to your website:

```html
<script src="https://your-domain.com/api/embed"></script>
```

## Environment Variables

- `BOTPRESS_WEBHOOK_URL`: Your Botpress webhook URL
- `NEXT_PUBLIC_APP_URL`: The URL where your chat widget is hosted

## License

MIT 