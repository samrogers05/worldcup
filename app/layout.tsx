import type { Metadata } from 'next'
import { Press_Start_2P, Orbitron } from 'next/font/google'
import './globals.css'

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel-var',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron-var',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'World Cup 2026 Predictions',
  description: 'Family World Cup 2026 score predictions',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${orbitron.variable} h-full`}
    >
      <body className="min-h-full w-full flex flex-col">{children}</body>
    </html>
  )
}
