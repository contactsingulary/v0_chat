"use client"

import { ChatWidget } from "@/components/chat-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, HelpCircle, Copy, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export default function Home() {
  const [borderRadius, setBorderRadius] = useState(16)
  const [opacity, setOpacity] = useState(99)
  const [blur, setBlur] = useState(3)
  const [botName, setBotName] = useState("Chat Assistent")
  const [showPoweredBy, setShowPoweredBy] = useState(true)
  const [showCloseButton, setShowCloseButton] = useState(true)
  const [showRefreshButton, setShowRefreshButton] = useState(true)
  const [showSettingsButton, setShowSettingsButton] = useState(true)
  const [privacyApproach, setPrivacyApproach] = useState("passive")
  const [chatPlaceholders, setChatPlaceholders] = useState([
    "Wie funktioniert der Login-Prozess?",
    "Was sind die wichtigsten Features?",
    "Wie kann ich mein Passwort zurücksetzen?"
  ])
  const [showPlaceholders, setShowPlaceholders] = useState(true)
  const [showInitialPopup, setShowInitialPopup] = useState(true)
  const [initialPopupMessage, setInitialPopupMessage] = useState("Haben Sie Fragen? Ich bin hier, um zu helfen!")
  const [copied, setCopied] = useState(false)
  const { theme, setTheme } = useTheme()
  const [key, setKey] = useState(0)

  // Add reset function for privacy approach changes
  const handlePrivacyApproachChange = (newApproach: string) => {
    // Clear any existing privacy states
    localStorage.removeItem('privacyConsent')
    localStorage.removeItem('userId')
    localStorage.removeItem('conversationId')
    
    // Reset widget state
    setPrivacyApproach(newApproach)
    // Force ChatWidget to re-mount with new key
    setKey(prev => prev + 1)
  }

  // Function to generate embed code
  const generateEmbedCode = () => {
    // Get computed styles from the root element for theme colors
    const rootStyles = getComputedStyle(document.documentElement)
    
    const config = {
      // Basic settings
      borderRadius,
      opacity,
      blur,
      botName,
      showPoweredBy,
      showCloseButton,
      showRefreshButton,
      showSettingsButton,
      privacyApproach,
      chatPlaceholders: showPlaceholders ? chatPlaceholders : [],
      showInitialPopup,
      initialPopupMessage,
      theme,

      // Visual customization
      customStyles: {
        // Layout
        borderRadius,
        opacity,
        blur,
        
        // Colors - get actual computed values
        headerBackgroundColor: theme === 'dark' ? 'rgb(17, 17, 17)' : 'rgb(255, 255, 255)',
        headerTextColor: theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
        chatBackgroundColor: theme === 'dark' ? 'rgb(9, 9, 11)' : 'rgb(255, 255, 255)',
        userMessageBackgroundColor: theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(147, 51, 234)',
        userMessageTextColor: theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(255, 255, 255)',
        botMessageBackgroundColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(243, 244, 246)',
        botMessageTextColor: theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
        inputBackgroundColor: theme === 'dark' ? 'rgb(39, 39, 42, 0.5)' : 'rgb(255, 255, 255, 0.5)',
        inputTextColor: theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
        buttonBackgroundColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(243, 244, 246)',
        buttonTextColor: theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
        
        // Typography
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 14,
        
        // Spacing
        messageSpacing: 16,
        avatarSize: 32,
        inputHeight: 48,
        headerHeight: 56
      }
    }
    
    // Use fixed production URL
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

  // Function to copy embed code
  const copyEmbedCode = async () => {
    await navigator.clipboard.writeText(generateEmbedCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Log initial state values
  useEffect(() => {
    console.log('Page Initial State:', {
      showInitialPopup,
      privacyApproach,
      showPlaceholders
    })
  }, [showInitialPopup, privacyApproach, showPlaceholders])

  return (
    <main className="min-h-screen flex">
      {/* Controls Section */}
      <div className="w-[400px] border-r p-8 bg-muted/50">
        <h1 className="text-2xl font-bold mb-6">Widget Designer</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Passen Sie das Aussehen Ihres Chat-Widgets mit den folgenden Einstellungen an.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Darstellung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bot Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Bot Name</Label>
                <HelpText text="Der Name Ihres Chat-Assistenten, der im Header des Chat-Fensters angezeigt wird. Wählen Sie einen Namen, der zu Ihrer Marke oder Website passt." />
              </div>
              <Input 
                value={botName} 
                onChange={(e) => setBotName(e.target.value)}
                placeholder="Name des Chatbots"
              />
            </div>

            {/* Theme Toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Dark Mode</Label>
                <HelpText text="Aktivieren Sie den dunklen Modus für bessere Lesbarkeit bei wenig Licht. Der Chat-Widget passt sich automatisch an Ihre Einstellung an." />
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

            {/* Powered By Toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Powered by Label</Label>
                <HelpText text="Zeigt einen dezenten 'Powered by' Hinweis im Chat-Widget an. Sie können diesen ausblenden, wenn Sie möchten." />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showPoweredBy}
                  onCheckedChange={setShowPoweredBy}
                />
                <span className="text-sm text-muted-foreground">
                  {showPoweredBy ? "Sichtbar" : "Ausgeblendet"}
                </span>
              </div>
            </div>

            {/* Control Buttons Toggles */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Schließen-Button</Label>
                <HelpText text="Ein Button zum Schließen des Chat-Fensters. Benutzer können den Chat jederzeit wieder öffnen." />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showCloseButton}
                  onCheckedChange={setShowCloseButton}
                />
                <span className="text-sm text-muted-foreground">
                  {showCloseButton ? "Sichtbar" : "Ausgeblendet"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Neustarten-Button</Label>
                <HelpText text="Ermöglicht Benutzern, die Konversation neu zu starten. Nützlich, wenn sie ein neues Thema besprechen möchten." />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showRefreshButton}
                  onCheckedChange={setShowRefreshButton}
                />
                <span className="text-sm text-muted-foreground">
                  {showRefreshButton ? "Sichtbar" : "Ausgeblendet"}
                </span>
              </div>
            </div>

            {/* Border Radius Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Eckenradius</Label>
                <HelpText text="Stellen Sie ein, wie abgerundet die Ecken des Chat-Widgets sein sollen. Ein höherer Wert macht die Ecken runder." />
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  defaultValue={[borderRadius]}
                  max={32}
                  step={1}
                  className="flex-1"
                  onValueChange={([value]) => setBorderRadius(value)}
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {borderRadius}px
                </span>
              </div>
            </div>

            {/* Transparency Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Transparenz</Label>
                <HelpText text="Passen Sie die Durchsichtigkeit des Chat-Widgets an. Ein höherer Wert macht das Widget transparenter." />
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  defaultValue={[opacity]}
                  max={100}
                  step={1}
                  className="flex-1"
                  onValueChange={([value]) => setOpacity(value)}
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {opacity}%
                </span>
              </div>
            </div>

            {/* Blur Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Unschärfe</Label>
                <HelpText text="Steuern Sie den Unschärfe-Effekt des Hintergrunds. Ein höherer Wert erzeugt mehr Unschärfe und einen moderneren Look." />
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  defaultValue={[blur]}
                  max={10}
                  step={1}
                  className="flex-1"
                  onValueChange={([value]) => setBlur(value)}
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {blur}px
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Functions Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Funktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Initiale Chatbot-Nachricht</Label>
                    <HelpText text="Eine Willkommensnachricht, die kurz nach dem Laden der Seite in einer Sprechblase erscheint. Nutzen Sie diese, um Besucher auf den Chat aufmerksam zu machen und Hilfe anzubieten." />
                  </div>
                  <Switch
                    checked={showInitialPopup}
                    onCheckedChange={setShowInitialPopup}
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Zeigt beim Laden der Seite eine Willkommensnachricht an
                </p>
                {showInitialPopup && (
                  <div className="space-y-2">
                    <Label className="text-sm">Popup-Nachricht</Label>
                    <Input
                      value={initialPopupMessage}
                      onChange={(e) => setInitialPopupMessage(e.target.value)}
                      placeholder="Willkommensnachricht eingeben"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Passen Sie die Nachricht an, die im Popup angezeigt wird
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Platzhalter-Texte</Label>
                    <HelpText text="Beispielfragen, die im Eingabefeld als Vorschläge angezeigt werden. Diese helfen Besuchern zu verstehen, welche Art von Fragen sie stellen können." />
                  </div>
                  <Switch
                    checked={showPlaceholders}
                    onCheckedChange={setShowPlaceholders}
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Beispielfragen im Eingabefeld anzeigen
                </p>
                {showPlaceholders && (
                  <>
                    <div className="space-y-4">
                      {chatPlaceholders.map((placeholder, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={placeholder}
                            onChange={(e) => {
                              const newPlaceholders = [...chatPlaceholders];
                              newPlaceholders[index] = e.target.value;
                              setChatPlaceholders(newPlaceholders);
                            }}
                            placeholder={`Platzhalter ${index + 1}`}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newPlaceholders = chatPlaceholders.filter((_, i) => i !== index);
                              setChatPlaceholders(newPlaceholders);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {chatPlaceholders.length < 10 && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setChatPlaceholders([...chatPlaceholders, "Neuer Platzhalter"]);
                          }}
                        >
                          Platzhalter hinzufügen
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Definieren Sie bis zu 10 Beispielfragen, die im Eingabefeld als Platzhalter angezeigt werden
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Card */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Datenschutz</CardTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200">
              Wichtig
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Datenschutz Ansatz</Label>
                  <HelpText text="Wählen Sie, wie Benutzer über die Datenverarbeitung informiert werden. Die verschiedenen Optionen bieten unterschiedliche Grade der Transparenz und Benutzerinteraktion." />
                </div>
                <Select
                  value={privacyApproach}
                  onValueChange={handlePrivacyApproachChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie einen Datenschutz-Ansatz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre">
                      <div className="space-y-1">
                        <div className="font-medium">Datenschutzabfrage vor Bot Nutzung</div>
                        <p className="text-xs text-muted-foreground">
                          Cookie-Banner mit detaillierten Einstellungen vor der ersten Nutzung.{" "}
                          <a 
                            href="https://www.singulary.net/datenschutz" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Datenschutzerklärung
                          </a>
                        </p>
                      </div>
                    </SelectItem>
                    <SelectItem value="in-chat">
                      <div className="space-y-1">
                        <div className="font-medium">Datenschutzabfrage im Bot</div>
                        <p className="text-xs text-muted-foreground">
                          Bot fragt nach Zustimmung beim ersten Chat.{" "}
                          <a 
                            href="https://www.singulary.net/datenschutz" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Datenschutzerklärung
                          </a>
                        </p>
                      </div>
                    </SelectItem>
                    <SelectItem value="passive">
                      <div className="space-y-1">
                        <div className="font-medium">Passive Datenschutz Deklaration</div>
                        <p className="text-xs text-muted-foreground">
                          Disclaimer im Chat-Header.{" "}
                          <a 
                            href="https://www.singulary.net/datenschutz" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Datenschutzerklärung
                          </a>
                        </p>
                      </div>
                    </SelectItem>
                    <SelectItem value="none">
                      <div className="space-y-1">
                        <div className="font-medium">Keine Datenschutzabfrage</div>
                        <p className="text-xs text-muted-foreground">
                          Keine separate Datenschutzerklärung - muss in der Website-Datenschutzerklärung integriert werden.{" "}
                          <a 
                            href="https://www.singulary.net/datenschutz" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Datenschutzerklärung zum Integrieren
                          </a>
                        </p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Wählen Sie, wie Benutzer über die Datenverarbeitung informiert werden sollen
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Einstellungen-Button</Label>
                  <HelpText text="Zeigt einen Button im Chat-Header an, über den Benutzer ihre Datenschutz- und Cookie-Einstellungen jederzeit anpassen können." />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showSettingsButton}
                    onCheckedChange={setShowSettingsButton}
                  />
                  <span className="text-sm text-muted-foreground">
                    {showSettingsButton ? "Sichtbar" : "Ausgeblendet"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ermöglicht Benutzern, Datenschutz- & Cookie-Einstellungen anzupassen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Embed Code Section */}
        <div className="mt-8 space-y-4">
          <Alert>
            <AlertDescription>
              Generieren Sie hier den Embed-Code für Ihre Website. Fügen Sie diesen Code in den HTML-Body Ihrer Website ein.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full"
            onClick={copyEmbedCode}
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

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Willkommen auf unserer Website</h2>
          <p className="text-lg text-muted-foreground mb-4">
            Dies ist eine Demo-Landingpage. Das Chat-Widget erscheint in der unteren rechten Ecke.
          </p>
          <div className="grid gap-6">
            <div className="h-[200px] rounded-lg border bg-muted p-8">
              Inhaltsbereich 1
            </div>
            <div className="h-[200px] rounded-lg border bg-muted p-8">
              Inhaltsbereich 2
            </div>
            <div className="h-[200px] rounded-lg border bg-muted p-8">
              Inhaltsbereich 3
            </div>
          </div>
        </div>
      </div>

      {/* Chat Widget with customization props */}
      <ChatWidget 
        key={key}
        customization={{
          borderRadius,
          opacity,
          blur,
          botName,
          showPoweredBy,
          showCloseButton,
          showRefreshButton,
          showSettingsButton,
          privacyApproach,
          chatPlaceholders: showPlaceholders ? chatPlaceholders : [],
          showInitialPopup,
          initialPopupMessage
        }}
      />
    </main>
  )
}

