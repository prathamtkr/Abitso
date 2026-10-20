/** @type {import('next').NextConfig} */
const isLocalUrl = (url) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(url || '')

// Kinde's SDK reads these values from the build-time environment. A local .env
// file may also be synced to Vercel, so replace localhost values with the
// current deployment origin there. Keep localhost defaults for local dev.
const vercelDomain = process.env.VERCEL_ENV === 'production'
  ? (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL)
  : process.env.VERCEL_URL
const vercelOrigin = vercelDomain ? `https://${vercelDomain}` : undefined
const configuredKindeSiteUrl = process.env.KINDE_SITE_URL
const kindeSiteUrl = vercelOrigin && isLocalUrl(configuredKindeSiteUrl)
  ? vercelOrigin
  : (configuredKindeSiteUrl || vercelOrigin)
const localOrUnset = (url) => !url || isLocalUrl(url)
const kindePostLoginRedirectUrl = localOrUnset(process.env.KINDE_POST_LOGIN_REDIRECT_URL)
  ? (kindeSiteUrl ? `${kindeSiteUrl.replace(/\/$/, '')}/dashboard` : process.env.KINDE_POST_LOGIN_REDIRECT_URL)
  : process.env.KINDE_POST_LOGIN_REDIRECT_URL
const kindePostLogoutRedirectUrl = localOrUnset(process.env.KINDE_POST_LOGOUT_REDIRECT_URL)
  ? kindeSiteUrl
  : process.env.KINDE_POST_LOGOUT_REDIRECT_URL

const nextConfig = {
  env: {
    KINDE_SITE_URL: kindeSiteUrl,
    KINDE_POST_LOGIN_REDIRECT_URL: kindePostLoginRedirectUrl,
    KINDE_POST_LOGOUT_REDIRECT_URL: kindePostLogoutRedirectUrl,
  },
  async redirects() {
    return [
      {
        source: '/sign-in',
        destination: '/api/auth/login?prompt=login',
        permanent: false,
      },
      {
        source: '/sign-up',
        destination: '/api/auth/register',
        permanent: true,
      },
      {
        source: '/sign-out',
        destination: '/api/auth/logout',
        permanent: true,
      },
    ]
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, webpack }
  ) => {
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    return config
  },
  images: {
    domains: [
      'images.pexels.com',
      'gravatar.com',
      'www.gravatar.com',
      'uploadthing.com',
      'utfs.io',
      'lh3.googleusercontent.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.uploadthing.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
}

export default nextConfig;
