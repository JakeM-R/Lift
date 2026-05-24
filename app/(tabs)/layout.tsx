import { TabBar } from '@/components/TabBar'

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--bg)]">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
