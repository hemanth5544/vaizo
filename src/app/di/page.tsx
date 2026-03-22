import Di from "@/components/dynamic"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Dynamic Island Example</h1>
        <Di />
    </div>
  )
}
