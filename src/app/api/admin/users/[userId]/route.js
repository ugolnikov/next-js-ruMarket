import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Get a specific user
export async function GET(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const userId = resolvedParams.userId
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: BigInt(userId) }
        })
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        // Serialize the data
        const serializedUser = {
            ...user,
            id: Number(user.id),
            password: undefined, // Don't send password
            createdAt: user.createdAt?.toISOString(),
            updatedAt: user.updatedAt?.toISOString()
        }
        
        return NextResponse.json(serializedUser)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Update a user
export async function PUT(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const userId = resolvedParams.userId
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const data = await request.json()
        
        // Validate data
        const { name, email, role, company_name, is_verify, is_admin } = data
        
        const updatedUser = await prisma.user.update({
            where: { id: BigInt(userId) },
            data: {
                name,
                email,
                role,
                company_name,
                is_verify,
                is_admin
            }
        })
        
        // Serialize the data
        const serializedUser = {
            ...updatedUser,
            id: Number(updatedUser.id),
            password: undefined, // Don't send password
            createdAt: updatedUser.createdAt?.toISOString(),
            updatedAt: updatedUser.updatedAt?.toISOString()
        }
        
        return NextResponse.json(serializedUser)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Delete a user
export async function DELETE(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const userId = resolvedParams.userId
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        
        // Check if trying to delete self
        if (Number(userId) === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
        }

        await prisma.user.delete({
            where: { id: BigInt(userId) }
        })
        
        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}