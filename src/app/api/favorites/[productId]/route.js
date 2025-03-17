import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const productId = request.url.split('/').pop()

        await prisma.favorites.deleteMany({
            where: {
                user_id: session.user.id,
                product_id: Number(productId)
            }
        })

        return NextResponse.json({ message: 'Removed from favorites' })
    } catch (error) {
        console.error('Error removing from favorites:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}