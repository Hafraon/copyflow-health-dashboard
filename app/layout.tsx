import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CopyFlow Health Dashboard',
  description: 'Real-time system health and performance monitoring for CopyFlow',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk" className={inter.className}>
      <body className="min-h-screen bg-dashboard-bg">
        <div className="min-h-screen">
          {/* Header */}
          <header className="bg-white border-b border-dashboard-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">CF</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        CopyFlow Health Dashboard
                      </h1>
                      <p className="text-xs text-gray-500">
                        System Status & Performance Monitoring
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    Last updated: <span className="font-medium">Live</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">All Systems Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-dashboard-border mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>© 2025 CopyFlow Health Dashboard v1.0.0</span>
                  <span>•</span>
                  <span>Powered by Next.js & Railway</span>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="mailto:admin@copyflow.com.ua" className="hover:text-gray-700">
                    Contact Support
                  </a>
                  <span>•</span>
                  <span>Monitoring by Claude AI</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
