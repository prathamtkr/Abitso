import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Metadata } from 'next'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || '3000'}`)
}

export function absoluteUrl(path: string) {
  if (typeof window !== 'undefined') return path
  return `${getSiteUrl().replace(/\/$/, '')}${path}`
}

export function constructMetadata({
  title = "Abitso – Chat with your PDFs",
  description = "Turn your PDFs into interactive conversations. Ask questions, find insights, and see where answers come from.",
  image = "/thumbnail.png",
  icons = "/icon.svg",
  noIndex = false
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image
        }
      ]
    },
    icons,
    metadataBase: new URL(getSiteUrl()),
  }
}
