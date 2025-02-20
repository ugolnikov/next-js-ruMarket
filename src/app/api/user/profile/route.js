import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { phone } = await request.json()
        
        const updatedUser = await prisma.user.update({
            where: { id: BigInt(session.user.id) },
            data: { phone }
        })

        return NextResponse.json({
            success: true,
            user: {
                ...updatedUser,
                id: Number(updatedUser.id)
            }
        })
    } catch (error) {
        console.error('Error updating user profile:', error)
        return NextResponse.json({ 
            success: false,
            errors: { phone: ['Failed to update phone number'] }
        }, { status: 500 })
    }
}