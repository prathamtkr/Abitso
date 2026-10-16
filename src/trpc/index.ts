import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import {
  privateProcedure,
  publicProcedure,
  router,
} from './trpc'
import { TRPCError } from '@trpc/server'
import db from '@/db'
import { z } from 'zod'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { absoluteUrl } from '@/lib/utils'
import {
  getUserSubscriptionPlan,
  stripe,
} from '@/lib/stripe'
import { PLANS } from '@/config/stripe'

// User settings validation schema
const userSettingsSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  imageUrl: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accentColor: z.string().optional(),
  fontSize: z.number().min(12).max(24).optional(),
  defaultZoom: z.number().min(50).max(200).optional(),
  autoSave: z.boolean().optional(),
  defaultHighlightColor: z.string().optional(),
  autoDelete: z.number().min(1).max(365).optional(),
  emailNotifications: z.boolean().optional(),
  processingAlerts: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  browserNotifications: z.boolean().optional(),
  analyticsOptOut: z.boolean().optional(),
  shareUsageData: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
});

export const appRouter = router({
  // Authentication callback
  authCallback: publicProcedure.query(async () => {
    try {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id || !user?.email)
        throw new TRPCError({ code: 'UNAUTHORIZED' })

      // Check if the user exists in the database
      const dbUser = await db.user.findFirst({
        where: {
          id: user.id,
        },
      })

      if (!dbUser) {
        // Create user in database
        await db.user.create({
          data: {
            id: user.id,
            email: user.email,
            displayName: user.given_name && user.family_name 
              ? `${user.given_name} ${user.family_name}`
              : user.given_name || user.email,
          },
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Auth callback error:', error)
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Authentication failed'
      })
    }
  }),

  // Get user files
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx

    return await db.file.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }),

  getPdfHighlights: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await db.file.findFirst({
        where: { id: input.fileId, userId: ctx.userId },
        select: { id: true },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      return db.pdfHighlight.findMany({
        where: { fileId: file.id },
        orderBy: { createdAt: 'asc' },
      })
    }),

  createPdfHighlight: privateProcedure
    .input(z.object({
      fileId: z.string(),
      pageNumber: z.number().int().min(1),
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().positive(),
      height: z.number().positive(),
      color: z.string().min(1).max(30),
    }))
    .mutation(async ({ ctx, input }) => {
      const file = await db.file.findFirst({
        where: { id: input.fileId, userId: ctx.userId },
        select: { id: true },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      return db.pdfHighlight.create({
        data: {
          fileId: file.id,
          pageNumber: input.pageNumber,
          x: input.x,
          y: input.y,
          width: input.width,
          height: input.height,
          normalized: true,
          color: input.color,
        },
      })
    }),

  importPdfHighlights: privateProcedure
    .input(z.object({
      fileId: z.string(),
      highlights: z.array(z.object({
        id: z.string().min(1).max(100),
        pageNumber: z.number().int().min(1),
        x: z.number().min(0),
        y: z.number().min(0),
        width: z.number().positive(),
        height: z.number().positive(),
        color: z.string().min(1).max(30),
        text: z.string().max(500).optional(),
        note: z.string().max(5000).nullable().optional(),
        timestamp: z.number().positive(),
      })).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const file = await db.file.findFirst({
        where: { id: input.fileId, userId: ctx.userId },
        select: { id: true },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      await db.pdfHighlight.createMany({
        data: input.highlights.map((highlight) => {
          const { id, pageNumber, x, y, width, height, color, text, note, timestamp } = highlight
          const createdAt = new Date(timestamp)
          return {
            id,
            pageNumber,
            x,
            y,
            width,
            height,
            normalized: false,
            color,
            text: text ?? 'Highlighted text',
            note,
            fileId: file.id,
            createdAt,
            updatedAt: createdAt,
          }
        }),
        skipDuplicates: true,
      })

      return db.pdfHighlight.findMany({
        where: { fileId: file.id },
        orderBy: { createdAt: 'asc' },
      })
    }),

  updatePdfHighlightNote: privateProcedure
    .input(z.object({
      id: z.string(),
      note: z.string().max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const highlight = await db.pdfHighlight.findFirst({
        where: { id: input.id },
        include: { File: { select: { userId: true } } },
      })

      if (!highlight || highlight.File.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Highlight not found' })
      }

      return db.pdfHighlight.update({
        where: { id: input.id },
        data: { note: input.note.trim() || null },
      })
    }),

  deletePdfHighlight: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const highlight = await db.pdfHighlight.findFirst({
        where: { id: input.id },
        include: { File: { select: { userId: true } } },
      })

      if (!highlight || highlight.File.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Highlight not found' })
      }

      await db.pdfHighlight.delete({ where: { id: input.id } })
      return { success: true }
    }),

  clearPdfHighlights: privateProcedure
    .input(z.object({
      fileId: z.string(),
      pageNumber: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const file = await db.file.findFirst({
        where: { id: input.fileId, userId: ctx.userId },
        select: { id: true },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      const result = await db.pdfHighlight.deleteMany({
        where: {
          fileId: file.id,
          ...(input.pageNumber !== undefined && { pageNumber: input.pageNumber }),
        },
      })

      return { deleted: result.count }
    }),

  // Get user settings
  getUserSettings: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx

    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    })

    if (!dbUser) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
    }

    // Return user settings from the user table
    return {
      displayName: dbUser.displayName || '',
      email: dbUser.email || '',
      imageUrl: dbUser.imageUrl || '',
      theme: (dbUser.theme as "light" | "dark" | "system") || 'system',
      accentColor: dbUser.accentColor || 'blue',
      fontSize: dbUser.fontSize || 16,
      defaultZoom: dbUser.defaultZoom || 100,
      autoSave: dbUser.autoSave ?? true,
      defaultHighlightColor: dbUser.defaultHighlightColor || '#ffeb3b',
      autoDelete: dbUser.autoDelete || 90,
      emailNotifications: dbUser.emailNotifications ?? true,
      processingAlerts: dbUser.processingAlerts ?? true,
      weeklyDigest: dbUser.weeklyDigest ?? false,
      browserNotifications: dbUser.browserNotifications ?? true,
      analyticsOptOut: dbUser.analyticsOptOut ?? false,
      shareUsageData: dbUser.shareUsageData ?? true,
      publicProfile: dbUser.publicProfile ?? false,
    }
  }),

  // Update user settings
  updateUserSettings: privateProcedure
    .input(userSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      const updatedUser = await db.user.update({
        where: {
          id: userId,
        },
        data: {
          ...(input.displayName !== undefined && { displayName: input.displayName }),
          ...(input.email !== undefined && { email: input.email }),
          ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
          ...(input.theme !== undefined && { theme: input.theme }),
          ...(input.accentColor !== undefined && { accentColor: input.accentColor }),
          ...(input.fontSize !== undefined && { fontSize: input.fontSize }),
          ...(input.defaultZoom !== undefined && { defaultZoom: input.defaultZoom }),
          ...(input.autoSave !== undefined && { autoSave: input.autoSave }),
          ...(input.defaultHighlightColor !== undefined && { defaultHighlightColor: input.defaultHighlightColor }),
          ...(input.autoDelete !== undefined && { autoDelete: input.autoDelete }),
          ...(input.emailNotifications !== undefined && { emailNotifications: input.emailNotifications }),
          ...(input.processingAlerts !== undefined && { processingAlerts: input.processingAlerts }),
          ...(input.weeklyDigest !== undefined && { weeklyDigest: input.weeklyDigest }),
          ...(input.browserNotifications !== undefined && { browserNotifications: input.browserNotifications }),
          ...(input.analyticsOptOut !== undefined && { analyticsOptOut: input.analyticsOptOut }),
          ...(input.shareUsageData !== undefined && { shareUsageData: input.shareUsageData }),
          ...(input.publicProfile !== undefined && { publicProfile: input.publicProfile }),
        },
      })

      return {
        displayName: updatedUser.displayName || '',
        email: updatedUser.email || '',
        imageUrl: updatedUser.imageUrl || '',
        theme: (updatedUser.theme as "light" | "dark" | "system") || 'system',
        accentColor: updatedUser.accentColor || 'blue',
        fontSize: updatedUser.fontSize || 16,
        defaultZoom: updatedUser.defaultZoom || 100,
        autoSave: updatedUser.autoSave ?? true,
        defaultHighlightColor: updatedUser.defaultHighlightColor || '#ffeb3b',
        autoDelete: updatedUser.autoDelete || 90,
        emailNotifications: updatedUser.emailNotifications ?? true,
        processingAlerts: updatedUser.processingAlerts ?? true,
        weeklyDigest: updatedUser.weeklyDigest ?? false,
        browserNotifications: updatedUser.browserNotifications ?? true,
        analyticsOptOut: updatedUser.analyticsOptOut ?? false,
        shareUsageData: updatedUser.shareUsageData ?? true,
        publicProfile: updatedUser.publicProfile ?? false,
      }
    }),

  // Update file details
  updateFile: privateProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      iconIndex: z.number().min(0).max(10).optional(),
      colorIndex: z.number().min(0).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      // Verify file ownership
      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      return await db.file.update({
        where: { 
          id: input.id,
        },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.iconIndex !== undefined && { iconIndex: input.iconIndex }),
          ...(input.colorIndex !== undefined && { colorIndex: input.colorIndex }),
        },
      })
    }),

  // Track file view
  trackFileView: privateProcedure
    .input(z.object({
      fileId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      // Verify file ownership
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      return await db.file.update({
        where: { 
          id: input.fileId,
        },
        data: {
          viewCount: { increment: 1 },
        },
      })
    }),

  // Delete file
  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      // Delete all messages associated with the file first
      await db.message.deleteMany({
        where: {
          fileId: input.id,
        },
      })

      // Then delete the file
      await db.file.delete({
        where: {
          id: input.id,
        },
      })

      return { success: true, deletedFile: file }
    }),

  // Get file by key
  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      return file
    }),

  // Get file upload status
  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        },
      })

      if (!file) return { status: 'PENDING' as const }

      return { status: file.uploadStatus }
    }),

  // Get file messages with pagination
  getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx
      const { fileId, cursor } = input
      const limit = input.limit ?? INFINITE_QUERY_LIMIT

      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem?.id
      }

      return {
        messages,
        nextCursor,
      }
    }),

  // Create message (deprecated - use sendMessage instead)
  createMessage: privateProcedure
    .input(z.object({
      fileId: z.string(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      // Verify file ownership
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      if (file.uploadStatus !== 'SUCCESS') {
        throw new TRPCError({ 
          code: 'PRECONDITION_FAILED', 
          message: 'File is still processing. Please wait for upload to complete.' 
        })
      }

      // Create user message
      const userMessage = await db.message.create({
        data: {
          text: input.message,
          isUserMessage: true,
          userId,
          fileId: input.fileId,
        },
      })

      return { userMessage }
    }),

  // Send message with AI processing (new endpoint)
  sendMessage: privateProcedure
    .input(z.object({
      fileId: z.string(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      // This will redirect to the API route for proper streaming/AI processing
      // The actual AI processing happens in /api/message route
      const { userId } = ctx

      // Verify file ownership and status
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      if (file.uploadStatus !== 'SUCCESS') {
        throw new TRPCError({ 
          code: 'PRECONDITION_FAILED', 
          message: 'File is still processing. Please wait for upload to complete.' 
        })
      }

      // Return success - actual message processing happens in API route
      return { success: true, fileId: input.fileId, message: input.message }
    }),

  // Stripe session creation
  createStripeSession: privateProcedure
    .input(z.object({ interval: z.enum(['month', 'year']).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      const billingUrl = absoluteUrl('/dashboard/billing')
      const successUrl = absoluteUrl('/dashboard?upgrade=success')
      const interval = input.interval ?? 'month'

      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const dbUser = await db.user.findFirst({
        where: {
          id: userId,
        },
      })

      if (!dbUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const subscriptionPlan = await getUserSubscriptionPlan()

      if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
        const stripeSession = await stripe.billingPortal.sessions.create({
          customer: dbUser.stripeCustomerId,
          return_url: successUrl,
        })

        return { url: stripeSession.url }
      }

      const proPlan = PLANS.find((plan) => plan.name === 'Pro')
      const priceMode = process.env.NODE_ENV === 'production' ? 'production' : 'test'
      const priceId =
        interval === 'year'
          ? proPlan?.price.yearlyPriceIds[priceMode]
          : proPlan?.price.priceIds[priceMode]

      if (!priceId) {
        const priceVariable =
          interval === 'year'
            ? priceMode === 'production'
              ? 'STRIPE_PRO_YEARLY_PRICE_ID_PRODUCTION'
              : 'STRIPE_PRO_YEARLY_PRICE_ID'
            : priceMode === 'production'
              ? 'STRIPE_PRO_MONTHLY_PRICE_ID_PRODUCTION'
              : 'STRIPE_PRO_MONTHLY_PRICE_ID'
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Stripe ${interval}ly price is not configured. Set ${priceVariable}.`,
        })
      }

      const stripeSession = await stripe.checkout.sessions.create({
        success_url: successUrl,
        cancel_url: billingUrl,
        payment_method_types: ['card'],
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId,
        },
      })

      return { url: stripeSession.url }
    }),

  // Export user data
  exportUserData: privateProcedure
    .mutation(async ({ ctx }) => {
      const { userId } = ctx

      const userData = await db.user.findFirst({
        where: {
          id: userId,
        },
        include: {
          File: {
            include: {
              Message: true,
              PdfHighlight: true,
            },
          },
        },
      })

      if (!userData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      return {
        user: {
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
          createdAt: userData.createdAt,
          settings: {
            theme: userData.theme,
            accentColor: userData.accentColor,
            fontSize: userData.fontSize,
            defaultZoom: userData.defaultZoom,
            autoSave: userData.autoSave,
            defaultHighlightColor: userData.defaultHighlightColor,
            autoDelete: userData.autoDelete,
            emailNotifications: userData.emailNotifications,
            processingAlerts: userData.processingAlerts,
            weeklyDigest: userData.weeklyDigest,
            browserNotifications: userData.browserNotifications,
            analyticsOptOut: userData.analyticsOptOut,
            shareUsageData: userData.shareUsageData,
            publicProfile: userData.publicProfile,
          },
        },
        files: userData.File.map(file => ({
          id: file.id,
          name: file.name,
          uploadStatus: file.uploadStatus,
          createdAt: file.createdAt,
          messageCount: file.Message.length,
          highlights: file.PdfHighlight,
        })),
        statistics: {
          totalFiles: userData.File.length,
          totalMessages: userData.File.reduce((acc, file) => acc + file.Message.length, 0),
        },
      }
    }),

  // Clear user cache
  clearUserCache: privateProcedure
    .mutation(async () => {
    
    
      return { success: true, clearedAt: new Date() }
    }),

  // Delete user account
  deleteUserAccount: privateProcedure
    .mutation(async ({ ctx }) => {
      const { userId } = ctx

      // Delete all user data in correct order (foreign key constraints)
      await db.$transaction([
        // Delete user messages first
        db.message.deleteMany({
          where: {
            userId: userId,
          },
        }),
        // Delete user files
        db.file.deleteMany({
          where: {
            userId: userId,
          },
        }),
        // Delete user last
        db.user.delete({
          where: {
            id: userId,
          },
        }),
      ])

      return { success: true }
    }),
})

export type AppRouter = typeof appRouter