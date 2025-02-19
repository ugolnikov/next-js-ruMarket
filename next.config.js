/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    images: {
        domains: ['parpol.ru', 'placeholder.com', 'via.placeholder.com', 'placehold.co', 'localhost', 'stokenwmuhlhaubnvubs.supabase.co'],
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
                hostname: 'stokenwmuhlhaubnvubs.supabase.co',
                pathname: '/**',
            }
        ]
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb'
        }
    },
    // Отключаем статическую оптимизацию для API роутов
    typescript: {
        ignoreBuildErrors: true
    },
    webpack: (config) => {
        config.experiments = {
            ...config.experiments,
            topLevelAwait: true
        }
        return config
    }
}

export default nextConfig
