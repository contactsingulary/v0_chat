import { ChatWidget } from "@/components/chat-widget"

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Welcome to Our Website</h1>
        <p className="text-lg text-muted-foreground mb-4">
          This is a demo landing page. The chat widget will appear in the bottom right corner.
        </p>
        <div className="grid gap-6">
          {/* Add your landing page content here */}
          <div className="h-[200px] rounded-lg border bg-muted p-8">
            Content Section 1
          </div>
          <div className="h-[200px] rounded-lg border bg-muted p-8">
            Content Section 2
          </div>
          <div className="h-[200px] rounded-lg border bg-muted p-8">
            Content Section 3
          </div>
        </div>
      </div>
      <ChatWidget />
    </main>
  )
}

