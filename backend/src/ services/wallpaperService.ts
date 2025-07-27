import axios from 'axios'
import { PrismaClient, Wallpaper, Category } from '@prisma/client'
import { logger } from '../utils/logger'
import { cacheService } from './cacheService'

const prisma = new PrismaClient()

// API configurations
const API_CONFIGS = {
  unsplash: {
    baseURL: 'https://api.unsplash.com',
    accessKey: process.env.UNSPLASH_ACCESS_KEY,
    headers: {
      'Accept-Version': 'v1'
    }
  },
  pexels: {
    baseURL: 'https://api.pexels.com/v1',
    apiKey: process.env.PEXELS_API_KEY,
    headers: {
      'Authorization': process.env.PEXELS_API_KEY
    }
  },
  pixabay: {
    baseURL: 'https://pixabay.com/api',
    apiKey: process.env.PIXABAY_API_KEY,
    params: {
      key: process.env.PIXABAY_API_KEY,
      image_type: 'photo',
      orientation: 'all',
      min_width: 1920,
      min_height: 1080,
      safesearch: 'true'
    }
  }
}

interface ExternalWallpaper {
  id: string
  title?: string
  description?: string
  urls: {
    raw?: string
    full: string
    regular: string
    small: string
    thumb?: string
  }
  width: number
  height: number
  color?: string
  blurHash?: string
  user?: {
    name: string
    username?: string
    profile_image?: {
      small: string
      medium: string
      large: string
    }
  }
  tags?: Array<{ title: string }>
  downloads?: number
  views?: number
  likes?: number
}

class WallpaperSyncService {
  private readonly CACHE_TTL = 3600 // 1 hour
  private readonly MAX_WALLPAPERS_PER_SYNC = 100

  // Fetch wallpapers from Unsplash API
  async fetchFromUnsplash(category: string, page: number = 1, perPage: number = 30): Promise<ExternalWallpaper[]> {
    try {
      if (!API_CONFIGS.unsplash.accessKey) {
        logger.warn('Unsplash API key not configured')
        return []
      }

      const response = await axios.get(`${API_CONFIGS.unsplash.baseURL}/search/photos`, {
        headers: {
          ...API_CONFIGS.unsplash.headers,
          'Authorization': `Client-ID ${API_CONFIGS.unsplash.accessKey}`
        },
        params: {
          query: category,
          page,
          per_page: perPage,
          orientation: 'landscape'
        }
      })

      return response.data.results.map((item: any) => ({
        id: `unsplash_${item.id}`,
        title: item.description || item.alt_description,
        description: item.description,
        urls: {
          raw: item.urls.raw,
          full: item.urls.full,
          regular: item.urls.regular,
          small: item.urls.small,
          thumb: item.urls.thumb
        },
        width: item.width,
        height: item.height,
        color: item.color,
        blurHash: item.blur_hash,
        user: {
          name: item.user.name,
          username: item.user.username,
          profile_image: item.user.profile_image
        },
        tags: item.tags?.map((tag: any) => ({ title: tag.title })) || [],
        downloads: item.downloads || 0,
        views: item.views || 0,
        likes: item.likes || 0
      }))
    } catch (error) {
      logger.error('Error fetching from Unsplash:', error)
      return []
    }
  }

  // Fetch wallpapers from Pexels API
  async fetchFromPexels(category: string, page: number = 1, perPage: number = 30): Promise<ExternalWallpaper[]> {
    try {
      if (!API_CONFIGS.pexels.apiKey) {
        logger.warn('Pexels API key not configured')
        return []
      }

      const response = await axios.get(`${API_CONFIGS.pexels.baseURL}/search`, {
        headers: API_CONFIGS.pexels.headers,
        params: {
          query: category,
          page,
          per_page: perPage,
          orientation: 'landscape'
        }
      })

      return response.data.photos.map((item: any) => ({
        id: `pexels_${item.id}`,
        title: item.alt,
        description: item.alt,
        urls: {
          full: item.src.original,
          regular: item.src.large2x,
          small: item.src.medium,
          thumb: item.src.small
        },
        width: item.width,
        height: item.height,
        color: item.avg_color,
        user: {
          name: item.photographer,
          username: item.photographer_id?.toString()
        },
        tags: [],
        downloads: 0,
        views: 0,
        likes: 0
      }))
    } catch (error) {
      logger.error('Error fetching from Pexels:', error)
      return []
    }
  }

  // Fetch wallpapers from Pixabay API
  async fetchFromPixabay(category: string, page: number = 1, perPage: number = 30): Promise<ExternalWallpaper[]> {
    try {
      if (!API_CONFIGS.pixabay.apiKey) {
        logger.warn('Pixabay API key not configured')
        return []
      }

      const response = await axios.get(API_CONFIGS.pixabay.baseURL, {
        params: {
          ...API_CONFIGS.pixabay.params,
          q: category,
          page,
          per_page: perPage
        }
      })

      return response.data.hits.map((item: any) => ({
        id: `pixabay_${item.id}`,
        title: item.tags,
        description: item.tags,
        urls: {
          full: item.largeImageURL,
          regular: item.webformatURL,
          small: item.previewURL,
          thumb: item.previewURL
        },
        width: item.imageWidth,
        height: item.imageHeight,
        user: {
          name: item.user,
          username: item.user_id?.toString()
        },
        tags: item.tags.split(', ').map((tag: string) => ({ title: tag.trim() })),
        downloads: item.downloads || 0,
        views: item.views || 0,
        likes: item.likes || 0
      }))
    } catch (error) {
      logger.error('Error fetching from Pixabay:', error)
      return []
    }
  }

  // Save wallpaper to database
  async saveWallpaper(wallpaper: ExternalWallpaper, categoryId: string, source: string): Promise<Wallpaper | null> {
    try {
      // Check if wallpaper already exists
      const existing = await prisma.wallpaper.findUnique({
        where: { externalId: wallpaper.id }
      })

      if (existing) {
        // Update statistics if wallpaper exists
        return await prisma.wallpaper.update({
          where: { id: existing.id },
          data: {
            views: wallpaper.views || existing.views,
            downloads: wallpaper.downloads || existing.downloads,
            likes: wallpaper.likes || existing.likes,
            updatedAt: new Date()
          }
        })
      }

      // Create new wallpaper
      const aspectRatio = wallpaper.width / wallpaper.height
      
      const newWallpaper = await prisma.wallpaper.create({
        data: {
          externalId: wallpaper.id,
          source,
          title: wallpaper.title,
          description: wallpaper.description,
          altText: wallpaper.title || wallpaper.description,
          urlSmall: wallpaper.urls.small,
          urlRegular: wallpaper.urls.regular,
          urlFull: wallpaper.urls.full,
          urlRaw: wallpaper.urls.raw,
          width: wallpaper.width,
          height: wallpaper.height,
          aspectRatio,
          color: wallpaper.color,
          blurHash: wallpaper.blurHash,
          views: wallpaper.views || 0,
          downloads: wallpaper.downloads || 0,
          likes: wallpaper.likes || 0,
          categoryId,
          publishedAt: new Date()
        }
      })

      // Save tags if any
      if (wallpaper.tags && wallpaper.tags.length > 0) {
        for (const tagData of wallpaper.tags) {
          // Create or fin
