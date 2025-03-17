import { Nunito } from 'next/font/google'
import { CookiesProvider } from 'next-client-cookies/server'
import '@/app/global.css'
import { Providers } from './providers'
import { SpeedInsights } from "@vercel/speed-insights/next"

const nunitoFont = Nunito({
    subsets: ['latin'],
    display: 'swap',
})

export const metadata = {
    title: {
        template: '%s | ruMarket',
        default: 'ruMarket - Маркетплейс',
    },
    description: 'Онлайн маркетплейс ruMarket',
}

const RootLayout = ({ children }) => {
    return (
        <html lang="ru" className={nunitoFont.className}>
            <head>
                <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
            </head>
            <body className="antialiased">
                <CookiesProvider>
                    <Providers>
                        {children}
                        <SpeedInsights />
                    </Providers>
                </CookiesProvider>
            </body>
        </html>
    )
}

export default RootLayout
