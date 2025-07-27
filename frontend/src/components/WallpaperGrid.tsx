import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { 
  Heart, 
  Download, 
  Eye, 
  Share2, 
  MoreHorizontal,
  ExternalLink,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Wallpaper } from '../types/wallpaper'
import WallpaperModal from './WallpaperModal'
import { useFavorites } from '../hooks/useFavorites'
import { formatNumber } from '../utils/helpers'

interface WallpaperGridProps {
  wallpapers: Wallpaper[]
  showLoadMore?: boolean
  onLoadMore?: () => void
  isLoading?: boolean
  className?: string
}

const WallpaperGrid: React.FC<WallpaperGridProps> = ({
  wallpapers,
  showLoadMore = false,
  onLoadMore,
  isLoading = false,
  className = ''
}) => {
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites()

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  // Load more when in view
  React.useEffect(() => {
    if (inView && showLoadMore && onLoadMore && !isLoading) {
      onLoadMore()
    }
  }, [inView, showLoadMore, onLoadMore, isLoading])

  const handleImageError = useCallback((wallpaperId: string) => {
    setImageLoadErrors(prev => new Set([...prev, wallpaperId]))
  }, [])

  const handleDownload = useCallback(async (wallpaper: Wallpaper, quality: 'regular' | 'full' = 'full') => {
    try {
      const downloadUrl = quality === 'full' ? wallpaper.urls.full : wallpaper.urls.regular
      
      // Create download link
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `wallpaper-${wallpaper.id}.jpg`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('开始下载壁纸')
    } catch (error) {
      toast.error('下载失败，请稍后重试')
    }
  }, [])

  const handleShare = useCallback(async (wallpaper: Wallpaper) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: wallpaper.alt_description || '精美壁纸',
          text: `来自 WallpaperVerse 的精美壁纸`,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('链接已复制到剪贴板')
      } catch (error) {
        toast.error('分享失败')
      }
    }
  }, [])

  const toggleFavorite = useCallback((wallpaper: Wallpaper) => {
    const isFavorited = favorites.some(fav => fav.id === wallpaper.id)
    
    if (isFavorited) {
      removeFromFavorites(wallpaper.id)
      toast.success('已从收藏中移除')
    } else {
      addToFavorites(wallpaper)
      toast.success('已添加到收藏')
    }
  }, [favorites, addToFavorites, removeFromFavorites])

  if (!wallpapers || wallpapers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Eye className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          暂无壁纸
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          请稍后再试，或者浏览其他分类
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wallpapers.map((wallpaper, index) => {
          const isFavorited = favorites.some(fav => fav.id === wallpaper.id)
          const hasError = imageLoadErrors.has(wallpaper.id)

          return (
            <motion.div
              key={wallpaper.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-700">
                {!hasError ? (
                  <img
                    src={wallpaper.urls.small}
                    alt={wallpaper.alt_description || '壁纸'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={() => handleImageError(wallpaper.id)}
                    onClick={() => setSelectedWallpaper(wallpaper)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <div className="text-center">
                      <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">加载失败</p>
                    </div>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Top Actions */}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      onClick={() => toggleFavorite(wallpaper)}
                      className={`p-2 rounded-full backdrop-blur-sm transition-colors duration-200 ${
                        isFavorited 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Bottom Actions */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-white/90 text-xs">
                        <Eye className="w-3 h-3" />
                        <span>{formatNumber(wallpaper.views || 0)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-white/90 text-xs">
                        <Download className="w-3 h-3" />
                        <span>{formatNumber(wallpaper.downloads || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleShare(wallpaper)}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors duration-200"
                      >
                        <Share2 className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => handleDownload(wallpaper)}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors duration-200"
                      >
                        <Download className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => setSelectedWallpaper(wallpaper)}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors duration-200"
                      >
                        <Info className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quality Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 text-xs font-medium bg-black/50 text-white rounded-full backdrop-blur-sm">
                    {wallpaper.width}×{wallpaper.height}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {wallpaper.user?.profile_image && (
                      <img
                        src={wallpaper.user.profile_image.small}
                        alt={wallpaper.user.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {wallpaper.user?.name || '匿名用户'}
                    </span>
                  </div>
                  
                  {wallpaper.premium && (
                    <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                      精选
                    </span>
                  )}
                </div>

                {wallpaper.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {wallpaper.description}
                  </p>
                )}

                {wallpaper.tags && wallpaper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {wallpaper.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                      >
                        #{tag.title}
                      </span>
                    ))}
                    {wallpaper.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        +{wallpaper.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Load More Trigger */}
      {showLoadMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoading && (
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">加载更多壁纸...</span>
            </div>
          )}
        </div>
      )}

      {/* Wallpaper Modal */}
      <AnimatePresence>
        {selectedWallpaper && (
          <WallpaperModal
            wallpaper={selectedWallpaper}
            isOpen={!!selectedWallpaper}
            onClose={() => setSelectedWallpaper(null)}
            onDownload={handleDownload}
            onShare={handleShare}
            onToggleFavorite={toggleFavorite}
            isFavorited={favorites.some(fav => fav.id === selectedWallpaper.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default WallpaperGrid
