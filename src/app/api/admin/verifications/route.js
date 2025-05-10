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

        // Get all users with pending verification
        const pendingVerifications = await prisma.user.findMany({
            where: {
                verification_status: 'pending'
            },
            orderBy: {
                verification_requested_at: 'desc'
            }
        })
        
        // Serialize the data
        const serializedVerifications = pendingVerifications.map(user => ({
            ...user,
            id: Number(user.id),
            password: undefined, // Don't send password
            createdAt: user.createdAt?.toISOString(),
            updatedAt: user.updatedAt?.toISOString(),
            verification_requested_at: user.verification_requested_at?.toISOString()
        }))
        
        return NextResponse.json(serializedVerifications)
    } catch (error) {
        console.error('Error fetching verification requests:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}