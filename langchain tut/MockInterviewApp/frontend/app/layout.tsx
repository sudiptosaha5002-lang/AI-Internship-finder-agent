import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'AI Mock Interview Simulator',
  description: 'Practice and improve your interview skills with real-time AI feedback.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        {children}
      </body>
    </html>
  )
}
