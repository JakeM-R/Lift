import type { Metadata, Viewport } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: 'Lift',
  description: 'Track your workouts. Hit your PRs.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lift',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read theme server-side so first paint has correct data-theme (no flash)
  let theme = 'strong'
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('theme')
        .eq('user_id', user.id)
        .single()
      if (prefs?.theme) theme = prefs.theme
    }
  } catch {
    // Ignore — default theme used
  }

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IM+Fell+English:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
