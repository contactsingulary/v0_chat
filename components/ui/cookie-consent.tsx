"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface CookieConsentProps {
  onAccept: (settings: { essential: boolean; nonEssential: boolean }) => void;
  onDecline: () => void;
  position?: { top?: number; right?: number; bottom?: number; left?: number };
}

export function CookieConsent({ onAccept, onDecline, position }: CookieConsentProps) {
  const [essentialCookies, setEssentialCookies] = useState(true)
  const [nonEssentialCookies, setNonEssentialCookies] = useState(true)

  return (
    <Card className="w-[400px] absolute z-50 shadow-lg" style={position}>
      <CardHeader>
        <CardTitle>Datenschutzeinstellungen</CardTitle>
        <CardDescription>
          Bitte wählen Sie aus, welche Cookies Sie akzeptieren möchten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="essential">Essenzielle Cookies</Label>
              <Switch
                id="essential"
                checked={essentialCookies}
                onCheckedChange={setEssentialCookies}
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Notwendig für die Grundfunktionen des Chats. Diese Cookies können nicht deaktiviert werden.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="non-essential">Nicht-essenzielle Cookies</Label>
              <Switch
                id="non-essential"
                checked={nonEssentialCookies}
                onCheckedChange={setNonEssentialCookies}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Für erweiterte Funktionen und Analysen.
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Verantwortliche Stelle: Singulary</p>
            <p>Zweck: Chat-Funktionalität, Personalisierung</p>
            <p>Speicherdauer: 12 Monate</p>
            <p>Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</p>
            <p>
              Weitere Informationen finden Sie in unserer{" "}
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onDecline}>
          Ablehnen
        </Button>
        <Button
          onClick={() => onAccept({ essential: essentialCookies, nonEssential: nonEssentialCookies })}
        >
          Einstellungen speichern
        </Button>
      </CardFooter>
    </Card>
  )
} 