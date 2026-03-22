"use client"

import { useState } from "react"

import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher"
import Di from "@/components/dynamic"


export default function Home() {

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")




  

  return (
    <main className="flex min-h-screen items-center justify-center relative">
            <Di />

      <div className="absolute top-5 right-5">
        <ThemeSwitcher
          defaultValue="system"
          onChange={setTheme}
          value={theme}
        />
      </div>


    </main>
  )
}