"use client"

import { useState } from "react"
import { VoiceButton, type VoiceButtonState } from "@/components/ui/voice-button"

export default function Home() {
  const [state, setState] = useState<VoiceButtonState>("idle")

  const handlePress = () => {
    if (state === "idle") {
      setState("recording")
    } else if (state === "recording") {
      setState("processing")
      // 👇 this is where your API call will go later
      setTimeout(() => {
        setState("success")
      }, 2000)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <VoiceButton
        label="Voice"
        trailing="⌥Space"
        state={state}
        onPress={handlePress}
        className="min-w-[180px]"
      />
    </main>
  )
}