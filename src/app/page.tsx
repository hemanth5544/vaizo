"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { VoiceButton, type VoiceButtonState } from "@/components/ui/voice-button"
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher"

export default function Home() {
  const [state, setState] = useState<VoiceButtonState>("idle")
  const [hasRecording, setHasRecording] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

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
    console.log("Sending recorded data...")
    setHasRecording(false)
    setState("idle")
  }

  return (
    <main className="flex min-h-screen items-center justify-center relative">

      {/* ✅ Theme Switcher Top Right */}
      <div className="absolute top-5 right-5">
        <ThemeSwitcher
          defaultValue="system"
          onChange={setTheme}
          value={theme}
        />
      </div>

      <div className="flex items-center gap-3">

        {/* 🎤 Animated Voice Button */}
        <motion.div
          animate={{
            scale: state === "recording" ? 1.1 : 1,
          }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <VoiceButton
            label="Voice"
            trailing="⌥Space"
            state={state}
            onPress={handlePress}
            className="min-w-[180px]"
          />
        </motion.div>

        {/* ✉️ Animated Send Button */}
        <AnimatePresence>
          {hasRecording && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Button
                size="lg"
                onClick={handleSend}
                className="h-8 px-3"
              >
                <Send className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  )
}