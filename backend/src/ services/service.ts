import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import cron from 'node-cron'
import dotenv from 'dotenv'

// Import routes
import wallpaperRoutes from './routes/wallpapers'
import categoryRoutes from './routes/categories'
import userRoutes from './routes/users'
import searchRoutes from './routes/search'
import statsRoutes from './routes/stats'

// Import services
import { wallpaperSyncService } from './services/wallpaperSyncService'
import { cacheService } from './services/cacheService'
import { logger } from './utils/logger'

// Load environment variables
dotenv.config()

// Initialize database and cache
const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.unsplash.com", "https://api.pexels.com", "https://pixabay.com"]
    }
  }
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://wallpaperverse.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}))

// General middleware
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
} else {
  app.use(morgan('dev'))
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', limiter)

// API rate limiting for different endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: 'Too many API requests, please slow down.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  }
})

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check Redis connection
    const redisStatus = redis.status
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        cache: redisStatus,
        memory: {
          used: process.memoryUsage().heapUsed / 1024 / 1024,
          total: process.memoryUsage().heapTotal / 1024 / 1024
        }
      }
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    })
  }
})

// API routes
app.use('/api/wallpapers', wallpaperRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/search', strictLimiter, searchRoutes)
app.use('/api/stats', statsRoutes)

// API documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'WallpaperVerse API',
    version: '1.0.0',
    description: 'RESTful API for WallpaperVerse wallpaper platform',
    endpoints: {
      wallpapers: '/api/wallpapers',
      categories: '/api/categories',
      search: '/api/search',
      stats: '/api/stats',
      health: '/health'
    },
    documentation: '/api/docs'
  })
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  })

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      code: 'INTERNAL_ERROR'
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  })
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`)
  
  try {
    // Close database connection
    await prisma.$disconnect()
    logger.info('Database connection closed')
    
    // Close Redis connection
    redis.disconnect()
    logger.info('Redis connection closed')
    
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Initialize scheduled jobs
const initializeCronJobs = () => {
  // Sync wallpapers from external APIs every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    try {
      logger.info('Starting scheduled wallpaper sync...')
      await wallpaperSyncService.syncFromAllSources()
      logger.info('Scheduled wallpaper sync completed')
    } catch (error) {
      logger.error('Scheduled wallpaper sync failed:', error)
    }
  })

  // Clean up old cache entries every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting cache cleanup...')
      await cacheService.cleanup()
      logger.info('Cache cleanup completed')
    } catch (error) {
      logger.error('Cache cleanup failed:', error)
    }
  })

  // Update wallpaper statistics every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Starting statistics update...')
      await wallpaperSyncService.updateStatistics()
      logger.info('Statistics update completed')
    } catch (error) {
      logger.error('Statistics update failed:', error)
    }
  })

  logger.info('Cron jobs initialized')
}

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    logger.info('Database connected successfully')

    // Test Redis connection
    await redis.ping()
    logger.info('Redis connected successfully')

    // Initialize cache service
    await cacheService.initialize(redis)
    
    // Initialize cron jobs
    if (process.env.ENABLE_CRON_JOBS !== 'false') {
      initializeCronJobs()
    }

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 WallpaperVerse API server is running on port ${PORT}`)
      logger.info(`📚 Health check: http://localhost:${PORT}/health`)
      logger.info(`🔗 API endpoint: http://localhost:${PORT}/api`)
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`🎨 Frontend: http://localhost:3000`)
      }
    })

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Export for testing
export { app, prisma, redis }

// Start the server if this file is run directly
if (require.main === module) {
  startServer()
}
