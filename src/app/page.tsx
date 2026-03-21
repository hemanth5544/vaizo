"use client"

import { useState, useRef } from "react"
import { Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { VoiceButton, type VoiceButtonState } from "@/components/ui/voice-button"
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher"

export default function Home() {
  const [state, setState] = useState<VoiceButtonState>("idle")
  const [hasRecording, setHasRecording] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handlePress = async () => {
    if (state === "idle") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        const chunks: Blob[] = []
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          setAudioBlob(blob)
          setState("processing")
          setTimeout(() => {
            setState("success")
            setHasRecording(true)
          }, 2000)
        }

        mediaRecorder.start()
        setState("recording")
      } catch (error) {
        console.error('Error accessing microphone:', error)
        setState("error")
      }
    } else if (state === "recording") {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }
    }
  }

  const handleSend = async () => {
    if (!audioBlob) return

    const formData = new FormData()
    formData.append('audio', audioBlob, 'voice-note.webm')

    try {
      const response = await fetch('/api/send-voice', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        console.log('Voice note sent successfully')
        setHasRecording(false)
        setState("idle")
        setAudioBlob(null)
      } else {
        console.error('Failed to send voice note')
      }
    } catch (error) {
      console.error('Error sending voice note:', error)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center relative">

      <div className="absolute top-5 right-5">
        <ThemeSwitcher
          defaultValue="system"
          onChange={setTheme}
          value={theme}
        />
      </div>

      <div className="flex items-center gap-3">

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