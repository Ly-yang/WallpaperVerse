import React, { Suspense, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'

// Components
import Header from './components/Header'
import Footer from './components/Footer'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

// Pages
const Home = React.lazy(() => import('./pages/Home'))
const Category = React.lazy(() => import('./pages/Category'))
const Favorites = React.lazy(() => import('./pages/Favorites'))
const About = React.lazy(() => import('./pages/About'))
const Search = React.lazy(() => import('./pages/Search'))

// Styles
import './styles/globals.css'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

// Theme context
export const ThemeContext = React.createContext<{
  theme: 'light' | 'dark'
  toggleTheme: () => void
}>({
  theme: 'light',
  toggleTheme: () => {},
})

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <Router>
            <ErrorBoundary>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <Header />
                
                <main className="container mx-auto px-4 py-8">
                  <AnimatePresence mode="wait">
                    <Suspense fallback={
                      <div className="flex justify-center items-center min-h-96">
                        <LoadingSpinner size="large" />
                      </div>
                    }>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/category/:category" element={<Category />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/about" element={<About />} />
                      </Routes>
                    </Suspense>
                  </AnimatePresence>
                </main>

                <Footer />
              </div>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: theme === 'dark' ? '#374151' : '#ffffff',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                  },
                }}
              />
            </ErrorBoundary>
          </Router>
        </ThemeContext.Provider>

        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </HelmetProvider>
  )
}

export default App
