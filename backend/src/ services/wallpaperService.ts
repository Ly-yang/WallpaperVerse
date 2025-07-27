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
          // Create or find tag
          const tag = await prisma.tag.upsert({
            where: { name: tagData.title.toLowerCase() },
            update: {
              wallpaperCount: { increment: 1 }
            },
            create: {
              name: tagData.title.toLowerCase(),
              slug: tagData.title.toLowerCase().replace(/\s+/g, '-'),
              wallpaperCount: 1
            }
          })

          // Link wallpaper to tag
          await prisma.wallpaperTag.create({
            data: {
              wallpaperId: newWallpaper.id,
              tagId: tag.id
            }
          })
        }
      }

      // Update category wallpaper count
      await prisma.category.update({
        where: { id: categoryId },
        data: { wallpaperCount: { increment: 1 } }
      })

      logger.info(`Saved wallpaper: ${wallpaper.id} from ${source}`)
      return newWallpaper

    } catch (error) {
      logger.error(`Error saving wallpaper ${wallpaper.id}:`, error)
      return null
    }
  }

  // Sync wallpapers from all sources
  async syncFromAllSources(): Promise<void> {
    try {
      logger.info('Starting wallpaper sync from all sources...')

      // Get all categories
      const categories = await prisma.category.findMany({
        where: { active: true }
      })

      for (const category of categories) {
        await this.syncCategory(category)
        
        // Add delay between categories to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      logger.info('Completed wallpaper sync from all sources')
    } catch (error) {
      logger.error('Error syncing wallpapers from all sources:', error)
    }
  }

  // Sync wallpapers for a specific category
  async syncCategory(category: Category): Promise<void> {
    try {
      logger.info(`Syncing category: ${category.name}`)

      const searchTerm = this.getCategorySearchTerm(category.slug)
      const wallpapersPerSource = Math.floor(this.MAX_WALLPAPERS_PER_SYNC / 3) // Divide among 3 sources

      // Fetch from all sources concurrently
      const [unsplashWallpapers, pexelsWallpapers, pixabayWallpapers] = await Promise.all([
        this.fetchFromUnsplash(searchTerm, 1, wallpapersPerSource),
        this.fetchFromPexels(searchTerm, 1, wallpapersPerSource),
        this.fetchFromPixabay(searchTerm, 1, wallpapersPerSource)
      ])

      // Save wallpapers from each source
      const savePromises = [
        ...unsplashWallpapers.map(w => this.saveWallpaper(w, category.id, 'unsplash')),
        ...pexelsWallpapers.map(w => this.saveWallpaper(w, category.id, 'pexels')),
        ...pixabayWallpapers.map(w => this.saveWallpaper(w, category.id, 'pixabay'))
      ]

      const results = await Promise.allSettled(savePromises)
      const saved = results.filter(r => r.status === 'fulfilled' && r.value !== null).length
      const failed = results.filter(r => r.status === 'rejected').length

      logger.info(`Category ${category.name}: ${saved} saved, ${failed} failed`)

    } catch (error) {
      logger.error(`Error syncing category ${category.name}:`, error)
    }
  }

  // Get appropriate search term for category
  private getCategorySearchTerm(categorySlug: string): string {
    const searchTerms: Record<string, string> = {
      'nature': 'nature landscape',
      'architecture': 'architecture building',
      'animals': 'animals wildlife',
      'abstract': 'abstract art',
      'space': 'space universe',
      'technology': 'technology digital',
      'people': 'people portrait',
      'food': 'food cuisine'
    }

    return searchTerms[categorySlug] || categorySlug
  }

  // Get trending wallpapers
  async getTrending(limit: number = 20): Promise<Wallpaper[]> {
    const cacheKey = `trending_wallpapers_${limit}`
    
    try {
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Query database for trending wallpapers
      const wallpapers = await prisma.wallpaper.findMany({
        where: { active: true },
        orderBy: [
          { views: 'desc' },
          { downloads: 'desc' },
          { likes: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        include: {
          category: true,
          tags: {
            include: { tag: true }
          },
          _count: {
            select: {
              favorites: true,
              downloads: true,
              views: true
            }
          }
        }
      })

      // Cache the result
      await cacheService.set(cacheKey, JSON.stringify(wallpapers), this.CACHE_TTL)

      return wallpapers
    } catch (error) {
      logger.error('Error getting trending wallpapers:', error)
      return []
    }
  }

  // Get latest wallpapers
  async getLatest(limit: number = 20): Promise<Wallpaper[]> {
    const cacheKey = `latest_wallpapers_${limit}`
    
    try {
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Query database for latest wallpapers
      const wallpapers = await prisma.wallpaper.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          category: true,
          tags: {
            include: { tag: true }
          },
          _count: {
            select: {
              favorites: true,
              downloads: true,
              views: true
            }
          }
        }
      })

      // Cache the result
      await cacheService.set(cacheKey, JSON.stringify(wallpapers), this.CACHE_TTL)

      return wallpapers
    } catch (error) {
      logger.error('Error getting latest wallpapers:', error)
      return []
    }
  }

  // Get featured wallpapers
  async getFeatured(limit: number = 20): Promise<Wallpaper[]> {
    const cacheKey = `featured_wallpapers_${limit}`
    
    try {
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Query database for featured wallpapers
      const wallpapers = await prisma.wallpaper.findMany({
        where: { 
          active: true,
          featured: true 
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          category: true,
          tags: {
            include: { tag: true }
          },
          _count: {
            select: {
              favorites: true,
              downloads: true,
              views: true
            }
          }
        }
      })

      // If no featured wallpapers, get high-quality ones
      if (wallpapers.length === 0) {
        const highQualityWallpapers = await prisma.wallpaper.findMany({
          where: { 
            active: true,
            views: { gte: 1000 },
            downloads: { gte: 100 }
          },
          orderBy: [
            { views: 'desc' },
            { downloads: 'desc' }
          ],
          take: limit,
          include: {
            category: true,
            tags: {
              include: { tag: true }
            },
            _count: {
              select: {
                favorites: true,
                downloads: true,
                views: true
              }
            }
          }
        })

        // Cache and return high-quality wallpapers
        await cacheService.set(cacheKey, JSON.stringify(highQualityWallpapers), this.CACHE_TTL)
        return highQualityWallpapers
      }

      // Cache the result
      await cacheService.set(cacheKey, JSON.stringify(wallpapers), this.CACHE_TTL)

      return wallpapers
    } catch (error) {
      logger.error('Error getting featured wallpapers:', error)
      return []
    }
  }

  // Get wallpapers by category
  async getByCategory(categorySlug: string, page: number = 1, limit: number = 20): Promise<{ wallpapers: Wallpaper[], total: number }> {
    const cacheKey = `category_wallpapers_${categorySlug}_${page}_${limit}`
    
    try {
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      const offset = (page - 1) * limit

      // Get category
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug }
      })

      if (!category) {
        return { wallpapers: [], total: 0 }
      }

      // Get wallpapers and total count
      const [wallpapers, total] = await Promise.all([
        prisma.wallpaper.findMany({
          where: { 
            active: true,
            categoryId: category.id
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          include: {
            category: true,
            tags: {
              include: { tag: true }
            },
            _count: {
              select: {
                favorites: true,
                downloads: true,
                views: true
              }
            }
          }
        }),
        prisma.wallpaper.count({
          where: { 
            active: true,
            categoryId: category.id
          }
        })
      ])

      const result = { wallpapers, total }

      // Cache the result
      await cacheService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL)

      return result
    } catch (error) {
      logger.error(`Error getting wallpapers by category ${categorySlug}:`, error)
      return { wallpapers: [], total: 0 }
    }
  }

  // Search wallpapers
  async search(query: string, page: number = 1, limit: number = 20): Promise<{ wallpapers: Wallpaper[], total: number }> {
    const cacheKey = `search_wallpapers_${query}_${page}_${limit}`
    
    try {
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      const offset = (page - 1) * limit

      // Search in title, description, and tags
      const [wallpapers, total] = await Promise.all([
        prisma.wallpaper.findMany({
          where: {
            active: true,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { altText: { contains: query, mode: 'insensitive' } },
              {
                tags: {
                  some: {
                    tag: {
                      name: { contains: query, mode: 'insensitive' }
                    }
                  }
                }
              }
            ]
          },
          orderBy: [
            { views: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit,
          include: {
            category: true,
            tags: {
              include: { tag: true }
            },
            _count: {
              select: {
                favorites: true,
                downloads: true,
                views: true
              }
            }
          }
        }),
        prisma.wallpaper.count({
          where: {
            active: true,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { altText: { contains: query, mode: 'insensitive' } },
              {
                tags: {
                  some: {
                    tag: {
                      name: { contains: query, mode: 'insensitive' }
                    }
                  }
                }
              }
            ]
          }
        })
      ])

      const result = { wallpapers, total }

      // Cache the result for shorter time since search results change more frequently
      await cacheService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL / 2)

      return result
    } catch (error) {
      logger.error(`Error searching wallpapers with query "${query}":`, error)
      return { wallpapers: [], total: 0 }
    }
  }

  // Update wallpaper statistics
  async updateStatistics(): Promise<void> {
    try {
      logger.info('Starting statistics update...')

      // Update category wallpaper counts
      await prisma.$executeRaw`
        UPDATE categories 
        SET wallpaper_count = (
          SELECT COUNT(*) 
          FROM wallpapers 
          WHERE wallpapers.category_id = categories.id 
          AND wallpapers.active = true
        )
      `

      // Update tag wallpaper counts
      await prisma.$executeRaw`
        UPDATE tags 
        SET wallpaper_count = (
          SELECT COUNT(*) 
          FROM wallpaper_tags 
          WHERE wallpaper_tags.tag_id = tags.id
        )
      `

      // Clear related caches
      await cacheService.clearPattern('*wallpapers*')
      await cacheService.clearPattern('*categories*')

      logger.info('Statistics update completed')
    } catch (error) {
      logger.error('Error updating statistics:', error)
    }
  }

  // Record wallpaper view
  async recordView(wallpaperId: string, userId?: string, metadata?: any): Promise<void> {
    try {
      // Create view record
      await prisma.view.create({
        data: {
          wallpaperId,
          userId,
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          referer: metadata?.referer
        }
      })

      // Update wallpaper view count
      await prisma.wallpaper.update({
        where: { id: wallpaperId },
        data: { views: { increment: 1 } }
      })

      // Clear related caches
      await cacheService.clearPattern(`*wallpaper_${wallpaperId}*`)
      await cacheService.clearPattern('*trending*')
    } catch (error) {
      logger.error('Error recording wallpaper view:', error)
    }
  }

  // Record wallpaper download
  async recordDownload(wallpaperId: string, quality: string = 'regular', userId?: string, metadata?: any): Promise<void> {
    try {
      // Create download record
      await prisma.download.create({
        data: {
          wallpaperId,
          userId,
          quality,
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          referer: metadata?.referer
        }
      })

      // Update wallpaper download count
      await prisma.wallpaper.update({
        where: { id: wallpaperId },
        data: { downloads: { increment: 1 } }
      })

      // Clear related caches
      await cacheService.clearPattern(`*wallpaper_${wallpaperId}*`)
      await cacheService.clearPattern('*trending*')
    } catch (error) {
      logger.error('Error recording wallpaper download:', error)
    }
  }
}

export const wallpaperSyncService = new WallpaperSyncService()
