import { GET, POST } from '@/lib/auth'

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export { GET, POST } 