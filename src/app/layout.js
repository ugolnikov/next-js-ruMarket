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
        <CookiesProvider>
        <SpeedInsights/>
        <html lang="ru" className={nunitoFont.className}>
            <head>
            <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
            <title>ruMarket</title>
            </head>
            <body className="antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
        </CookiesProvider>
    )
}


export default RootLayout
