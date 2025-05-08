import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET() {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            orderBy: {
                id: 'asc'
            }
        })
        
        // Serialize the data
        const serializedUsers = users.map(user => ({
            ...user,
            id: Number(user.id),
            password: undefined, // Don't send password
            createdAt: user.createdAt?.toISOString(),
            updatedAt: user.updatedAt?.toISOString()
        }))
        
        return NextResponse.json(serializedUsers)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}