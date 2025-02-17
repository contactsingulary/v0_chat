export const dynamic = 'force-dynamic'

'use client'

import { createBrowserClient } from "@supabase/ssr"
import { ChatWidget } from "@/components/chat-widget"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, HelpCircle, Copy, Check, Plus, Trash2, Save } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Types for bot configuration
interface BotConfig {
  id: string
  name: string
  webhook_id: string
  config: {
    borderRadius: number
    opacity: number
    blur: number
    botName: string
    showPoweredBy: boolean
    showCloseButton: boolean
    showRefreshButton: boolean
    showSettingsButton: boolean
    privacyApproach: string
    chatPlaceholders: string[]
    showInitialPopup: boolean
    initialPopupMessage: string
  }
}

// Default configuration for new bots
const defaultBotConfig = {
  borderRadius: 16,
  opacity: 99,
  blur: 3,
  botName: "Chat Assistent",
  showPoweredBy: true,
  showCloseButton: true,
  showRefreshButton: true,
  showSettingsButton: true,
  privacyApproach: "passive",
  chatPlaceholders: [
    "Wie funktioniert der Login-Prozess?",
    "Was sind die wichtigsten Features?",
    "Wie kann ich mein Passwort zurücksetzen?"
  ],
  showInitialPopup: true,
  initialPopupMessage: "Haben Sie Fragen? Ich bin hier, um zu helfen!"
}

function HelpText({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-transparent"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Hilfe</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm text-sm">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function Dashboard() {
  const [bots, setBots] = useState<BotConfig[]>([])
  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null)
  const [isNewBotDialogOpen, setIsNewBotDialogOpen] = useState(false)
  const [newBotName, setNewBotName] = useState("")
  const [newBotWebhookId, setNewBotWebhookId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load bots on mount
  useEffect(() => {
    loadBots()
  }, [])

  // Load bots from Supabase
  const loadBots = async () => {
    const { data: botsData, error } = await supabase
      .from('bots')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading bots:', error)
      return
    }

    setBots(botsData)
    if (botsData.length > 0 && !selectedBot) {
      setSelectedBot(botsData[0])
    }
  }

  // Create new bot
  const createBot = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: bot, error } = await supabase
        .from('bots')
        .insert([
          {
            name: newBotName || "Neuer Chat Bot",
            webhook_id: newBotWebhookId || "default-webhook-id",
            config: defaultBotConfig,
            user_id: user.id  // Add the user_id
          }
        ])
        .select()
        .single()

      if (error) throw error

      setSelectedBot(bot)
      await loadBots()
      setIsNewBotDialogOpen(false)  // Close the dialog on success
    } catch (error) {
      console.error('Error creating bot:', error)
      setError('Fehler beim Erstellen des Bots')
    } finally {
      setLoading(false)
    }
  }

  // Update bot configuration
  const updateBot = async (botId: string, config: any) => {
    setIsSaving(true)
    const { error } = await supabase
      .from('bots')
      .update({ config })
      .eq('id', botId)

    setIsSaving(false)
    if (error) {
      console.error('Error updating bot:', error)
      return
    }

    loadBots()
  }

  // Delete bot
  const deleteBot = async (botId: string) => {
    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', botId)

    if (error) {
      console.error('Error deleting bot:', error)
      return
    }

    loadBots()
  }

  // Generate embed code for selected bot
  const generateEmbedCode = () => {
    if (!selectedBot) return ""

    const config = {
      ...selectedBot.config,
      theme,
      webhook_id: selectedBot.webhook_id
    }
    
    const baseUrl = "https://v0-chat-eta.vercel.app"
    
    return `<!-- Chat Widget Embed Code -->
<script>
  // Initialize theme based on user preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = ${JSON.stringify(theme)} || (prefersDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');
</script>
<script src="${baseUrl}/widget.js"></script>
<script>
  window.ChatWidget = new ChatWidget(${JSON.stringify(config, null, 2)});
  window.ChatWidget.init();
</script>`
  }

  // Copy embed code to clipboard
  const copyEmbedCode = async () => {
    const code = generateEmbedCode()
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!selectedBot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Willkommen!</CardTitle>
            <CardDescription>
              Erstellen Sie Ihren ersten Chat-Bot, um zu beginnen.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => setIsNewBotDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Neuen Bot erstellen
            </Button>
          </CardFooter>
        </Card>

        {/* New Bot Dialog */}
        <Dialog open={isNewBotDialogOpen} onOpenChange={setIsNewBotDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Chat Bot erstellen</DialogTitle>
              <DialogDescription>
                Geben Sie einen Namen und die Webhook ID für Ihren neuen Bot ein.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={newBotName} onChange={(e) => setNewBotName(e.target.value)} />
              </div>
              <div>
                <Label>Webhook ID</Label>
                <Input value={newBotWebhookId} onChange={(e) => setNewBotWebhookId(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewBotDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={createBot} disabled={loading}>
                {loading ? "Wird erstellt..." : "Bot erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex">
      {/* Bot List Sidebar */}
      <div className="w-64 border-r p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Meine Bots</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNewBotDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className={`p-2 rounded-lg cursor-pointer flex items-center justify-between ${
                selectedBot?.id === bot.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => setSelectedBot(bot)}
            >
              <span className="truncate">{bot.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteBot(bot.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* New Bot Dialog */}
        <Dialog open={isNewBotDialogOpen} onOpenChange={setIsNewBotDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Chat Bot erstellen</DialogTitle>
              <DialogDescription>
                Geben Sie einen Namen und die Webhook ID für Ihren neuen Bot ein.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={newBotName} onChange={(e) => setNewBotName(e.target.value)} />
              </div>
              <div>
                <Label>Webhook ID</Label>
                <Input value={newBotWebhookId} onChange={(e) => setNewBotWebhookId(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewBotDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={createBot} disabled={loading}>
                {loading ? "Wird erstellt..." : "Bot erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bot Configuration */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{selectedBot.name}</h1>
              <p className="text-sm text-muted-foreground">
                Webhook ID: {selectedBot.webhook_id}
              </p>
            </div>
            <Button
              onClick={() => updateBot(selectedBot.id, selectedBot.config)}
              disabled={isSaving}
            >
              {isSaving ? (
                "Wird gespeichert..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Änderungen speichern
                </>
              )}
            </Button>
          </div>

          {/* Configuration Cards */}
          <div className="space-y-6">
            {/* Appearance Card */}
            <Card>
              <CardHeader>
                <CardTitle>Darstellung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bot Name */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Bot Name</Label>
                    <HelpText text="Der Name Ihres Chat-Assistenten, der im Header des Chat-Fensters angezeigt wird." />
                  </div>
                  <Input 
                    value={selectedBot.config.botName} 
                    onChange={(e) => setSelectedBot({
                      ...selectedBot,
                      config: { ...selectedBot.config, botName: e.target.value }
                    })}
                    placeholder="Name des Chatbots"
                  />
                </div>

                {/* Theme Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Dark Mode</Label>
                    <HelpText text="Aktivieren Sie den dunklen Modus für bessere Lesbarkeit bei wenig Licht." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                    <span className="text-sm text-muted-foreground">
                      {theme === "dark" ? "Aktiviert" : "Deaktiviert"}
                    </span>
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Eckenradius</Label>
                    <HelpText text="Passen Sie die Rundung der Ecken des Chat-Widgets an." />
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[selectedBot.config.borderRadius]}
                      onValueChange={(value) => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, borderRadius: value[0] }
                      })}
                      max={32}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {selectedBot.config.borderRadius}px
                    </span>
                  </div>
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Transparenz</Label>
                    <HelpText text="Stellen Sie die Transparenz des Chat-Widgets ein." />
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[selectedBot.config.opacity]}
                      onValueChange={(value) => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, opacity: value[0] }
                      })}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {selectedBot.config.opacity}%
                    </span>
                  </div>
                </div>

                {/* Blur Effect */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Unschärfe-Effekt</Label>
                    <HelpText text="Passen Sie den Unschärfe-Effekt des Hintergrunds an." />
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[selectedBot.config.blur]}
                      onValueChange={(value) => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, blur: value[0] }
                      })}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {selectedBot.config.blur}px
                    </span>
                  </div>
                </div>

                {/* Show Powered By */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Powered by Anzeige</Label>
                    <HelpText text="Zeigt einen 'Powered by Singulary' Link im Footer des Chat-Widgets an. Dies hilft uns, neue Kunden zu gewinnen und ermöglicht es uns, den Service weiterhin kostenlos anzubieten." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedBot.config.showPoweredBy}
                      onCheckedChange={(checked) => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, showPoweredBy: checked }
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedBot.config.showPoweredBy ? "Aktiviert" : "Deaktiviert"}
                    </span>
                  </div>
                </div>

                {/* Show Close Button */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Schließen-Button</Label>
                    <HelpText text="Fügt einen Button hinzu, mit dem Benutzer das Chat-Widget schließen können. Das Widget kann durch erneutes Klicken auf das Chat-Icon wieder geöffnet werden." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedBot.config.showCloseButton}
                      onCheckedChange={(checked) => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, showCloseButton: checked }
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedBot.config.showCloseButton ? "Aktiviert" : "Deaktiviert"}
                    </span>
                  </div>
                </div>

                {/* Show Refresh Button */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Aktualisieren-Button</Label>
                    <HelpText text="Ermöglicht es Benutzern, die Konversation neu zu starten. Dies löscht den Chat-Verlauf und beginnt eine neue Sitzung." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedBot.config.showRefreshButton}
                      onCheckedChange={(checked) => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, showRefreshButton: checked }
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedBot.config.showRefreshButton ? "Aktiviert" : "Deaktiviert"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Functions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Funktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Initial Popup */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Initial Popup</Label>
                    <HelpText text="Zeigt eine kleine Willkommensnachricht über dem Chat-Icon an, um Benutzer zum Chatten einzuladen. Das Popup verschwindet automatisch nach einigen Sekunden." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedBot.config.showInitialPopup}
                      onCheckedChange={(checked) => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, showInitialPopup: checked }
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedBot.config.showInitialPopup ? "Aktiviert" : "Deaktiviert"}
                    </span>
                  </div>
                  {selectedBot.config.showInitialPopup && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Popup Nachricht</Label>
                        <HelpText text="Die Nachricht, die im Popup angezeigt wird. Halten Sie sie kurz und einladend." />
                      </div>
                      <Input
                        value={selectedBot.config.initialPopupMessage}
                        onChange={(e) => setSelectedBot({
                          ...selectedBot,
                          config: { ...selectedBot.config, initialPopupMessage: e.target.value }
                        })}
                        placeholder="Haben Sie Fragen? Ich bin hier, um zu helfen!"
                      />
                    </div>
                  )}
                </div>

                {/* Chat Placeholders */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Chat-Platzhalter</Label>
                    <HelpText text="Beispielfragen oder Vorschläge, die im Eingabefeld angezeigt werden. Diese wechseln automatisch und helfen Benutzern, das Gespräch zu beginnen." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedBot.config.chatPlaceholders?.length > 0}
                      onCheckedChange={(checked) => {
                        const newConfig = {
                          ...selectedBot.config,
                          chatPlaceholders: checked ? [
                            "Wie funktioniert der Login-Prozess?",
                            "Was sind die wichtigsten Features?",
                            "Wie kann ich mein Passwort zurücksetzen?"
                          ] : []
                        };
                        setSelectedBot({
                          ...selectedBot,
                          config: newConfig
                        });
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedBot.config.chatPlaceholders?.length > 0 ? "Aktiviert" : "Deaktiviert"}
                    </span>
                  </div>
                  {selectedBot.config.chatPlaceholders?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedBot.config.chatPlaceholders.map((placeholder: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={placeholder}
                            onChange={(e) => {
                              const newPlaceholders = [...selectedBot.config.chatPlaceholders];
                              newPlaceholders[index] = e.target.value;
                              setSelectedBot({
                                ...selectedBot,
                                config: { ...selectedBot.config, chatPlaceholders: newPlaceholders }
                              });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newPlaceholders = selectedBot.config.chatPlaceholders.filter((_, i) => i !== index);
                              setSelectedBot({
                                ...selectedBot,
                                config: { ...selectedBot.config, chatPlaceholders: newPlaceholders }
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const newPlaceholders = [...selectedBot.config.chatPlaceholders, ""];
                          setSelectedBot({
                            ...selectedBot,
                            config: { ...selectedBot.config, chatPlaceholders: newPlaceholders }
                          });
                        }}
                      >
                        Platzhalter hinzufügen
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Privacy Card */}
            <Card>
              <CardHeader>
                <CardTitle>Datenschutz</CardTitle>
                <CardDescription>
                  Konfigurieren Sie, wie Benutzer ihre Zustimmung zur Datenverarbeitung geben.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label>Datenschutz-Ansatz</Label>
                    <HelpText text="Wählen Sie, wie die Datenschutz-Zustimmung von Benutzern eingeholt werden soll. Dies ist wichtig für die DSGVO-Konformität." />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedBot.config.privacyApproach === 'pre'
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedBot({
                          ...selectedBot,
                          config: { 
                            ...selectedBot.config, 
                            privacyApproach: 'pre',
                            showSettingsButton: true // Automatically enable settings button for pre approach
                          }
                        })
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={selectedBot.config.privacyApproach === 'pre' ? 'default' : 'outline'}>
                          Vor dem Chat
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Zeigt ein Modal-Fenster mit detaillierten Cookie-Einstellungen, bevor der Chat gestartet wird. Die sicherste Option für volle DSGVO-Konformität.
                      </p>
                      {selectedBot.config.privacyApproach === 'pre' && (
                        <div className="mt-4 space-y-2 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Einstellungen-Button</Label>
                              <p className="text-sm text-muted-foreground">
                                Ermöglicht Benutzern, ihre Cookie-Einstellungen später anzupassen
                              </p>
                            </div>
                            <Switch
                              checked={selectedBot.config.showSettingsButton}
                              onCheckedChange={(checked) => {
                                // Prevent event from reaching the card's onClick
                                setSelectedBot({
                                  ...selectedBot,
                                  config: { ...selectedBot.config, showSettingsButton: checked }
                                })
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedBot.config.privacyApproach === 'in-chat'
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, privacyApproach: 'in-chat' }
                      })}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={selectedBot.config.privacyApproach === 'in-chat' ? 'default' : 'outline'}>
                          Im Chat
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fordert die Zustimmung als erste Nachricht im Chat an. Benutzerfreundlich und dennoch DSGVO-konform.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedBot.config.privacyApproach === 'passive'
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, privacyApproach: 'passive' }
                      })}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={selectedBot.config.privacyApproach === 'passive' ? 'default' : 'outline'}>
                          Passiv
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Zeigt einen Datenschutzhinweis im Chat-Fenster an. Die Nutzung des Chats gilt als Zustimmung.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedBot.config.privacyApproach === 'none'
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedBot({
                        ...selectedBot,
                        config: { ...selectedBot.config, privacyApproach: 'none' }
                      })}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={selectedBot.config.privacyApproach === 'none' ? 'default' : 'outline'}>
                          Keine Zustimmung
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Keine explizite Zustimmung erforderlich. Nur verwenden, wenn Sie sicher sind, dass keine personenbezogenen Daten verarbeitet werden.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Embed Code Section */}
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Generieren Sie hier den Embed-Code für Ihre Website. Fügen Sie diesen Code in den HTML-Body Ihrer Website ein.
                </AlertDescription>
              </Alert>
              <Button 
                className="w-full"
                onClick={async () => {
                  await updateBot(selectedBot.id, selectedBot.config)
                  copyEmbedCode()
                }}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Code kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Embed Code generieren & kopieren
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <ChatWidget
        customization={{
          ...selectedBot.config,
          webhook_id: selectedBot.webhook_id
        }}
      />
    </main>
  )
} 