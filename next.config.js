/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'next-js-client-for-next-laravel-production.up.railway.app',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'api-deploy-production-a967.up.railway.app',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'parpol.ru',
                pathname: '/**',
            }
        ],
        domains: ['localhost'],
        unoptimized: process.env.NODE_ENV !== 'production',
    },
}

module.exports = nextConfig

