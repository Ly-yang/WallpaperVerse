import React, { useState, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Heart, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Image as ImageIcon,
  Star,
  Download,
  Settings
} from 'lucide-react'
import { ThemeContext } from '../App'
import SearchBar from './SearchBar'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { theme, toggleTheme } = useContext(ThemeContext)
  const navigate = useNavigate()
  const location = useLocation()

  const categories = [
    { name: '自然风景', slug: 'nature', icon: '🌿' },
    { name: '城市建筑', slug: 'architecture', icon: '🏢' },
    { name: '动物世界', slug: 'animals', icon: '🐾' },
    { name: '抽象艺术', slug: 'abstract', icon: '🎨' },
    { name: '太空宇宙', slug: 'space', icon: '🌌' },
    { name: '科技数码', slug: 'technology', icon: '💻' },
    { name: '人物写真', slug: 'people', icon: '👥' },
    { name: '美食佳肴', slug: 'food', icon: '🍽️' }
  ]

  const isActiveLink = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-pink-500 to-red-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              WallpaperVerse
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors duration-200 hover:text-primary-600 ${
                isActiveLink('/') ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              首页
            </Link>
            
            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors duration-200 flex items-center">
                分类
                <svg className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        to={`/category/${category.slug}`}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <span className="text-xl">{category.icon}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {category.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link 
              to="/favorites" 
              className={`text-sm font-medium transition-colors duration-200 hover:text-primary-600 flex items-center space-x-1 ${
                isActiveLink('/favorites') ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>收藏</span>
            </Link>

            <Link 
              to="/about" 
              className={`text-sm font-medium transition-colors duration-200 hover:text-primary-600 ${
                isActiveLink('/about') ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              关于
            </Link>
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700"
            >
              <div className="py-4 space-y-2">
                <Link 
                  to="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActiveLink('/') 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  首页
                </Link>
                
                <div className="px-4 py-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    分类
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        to={`/category/${category.slug}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <span className="text-sm">{category.icon}</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {category.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <Link 
                  to="/favorites" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActiveLink('/favorites') 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>收藏</span>
                </Link>

                <Link 
                  to="/about" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActiveLink('/about') 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  关于
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Modal */}
      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  )
}

export default Header
