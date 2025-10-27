import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '../Navbar'
import QuizGuard from '../components/QuizGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LearnMatch - Learn Anything',
  description: 'Discover personalized learning resources that match your learning style',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Navbar />
        <main className="min-h-screen">
          <QuizGuard>
            {children}
          </QuizGuard>
        </main>
      </body>
    </html>
  )
}
