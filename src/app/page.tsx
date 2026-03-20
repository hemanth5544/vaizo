"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceButton, type VoiceButtonState } from "@/components/ui/voice-button"

export default function Home() {
  const [state, setState] = useState<VoiceButtonState>("idle")
  const [hasRecording, setHasRecording] = useState(false)

  const handlePress = () => {
    if (state === "idle") {
      setState("recording")
      setHasRecording(false)
    } else if (state === "recording") {
      setState("processing")
      setTimeout(() => {
        setState("success")
        setHasRecording(true)
      }, 2000)
    }
  }

  const handleSend = () => {
    // 👇 your API call goes here later
    console.log("Sending recorded data...")
    setHasRecording(false)
    setState("idle")
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <VoiceButton
          label="Voice"
          trailing="⌥Space"
          state={state}
          onPress={handlePress}
          // size="lg"
          className="min-w-[180px]"
          
          />

          {hasRecording && (
            <Button
              size="lg"
              onClick={handleSend}
              className="h-8 px-3"
            >
              <Send className="h-3 w-3" />
            </Button>
          )}
      </div>
    </main>
  )
}