import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Получение данных пользователя
export async function GET(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get ID from URL
        const id = request.url.split('/').pop()
        if (!id) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
        }

        const targetUserId = Number(id)

        // Проверяем, что пользователь имеет доступ к этим данным
        if (session.user.id !== targetUserId && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const userData = await prisma.user.findUnique({
            where: { id: targetUserId }
        })
        
        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Serialize the response data
        const serializedUser = {
            ...userData,
            id: Number(userData.id),
            createdAt: userData.createdAt?.toISOString(),
            updatedAt: userData.updatedAt?.toISOString()
        }
        
        // Добавляем заголовки для предотвращения кэширования
        return new NextResponse(JSON.stringify(serializedUser), {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        })
    } catch (error) {
        console.error('Error getting user data:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Обновление данных пользователя
export async function PUT(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get ID from URL
        const id = request.url.split('/').pop()
        if (!id) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
        }

        const targetUserId = Number(id)
        const updateData = await request.json()

        // Special handling for role changes
        if (updateData.role) {
            // Only allow users to change their own role
            // if (session.user.id !== targetUserId) {
            //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            // }
            
            // Only allow switching between customer and seller
            if (!['customer', 'seller'].includes(updateData.role)) {
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
            }
        }
        // } else {
        //     // For other updates, maintain the original permission check
        //     // if (session.user.id !== targetUserId && session.user.role !== 'admin') {
        //     //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        //     // }
        // }

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: updateData
        })
        
        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Serialize the response data
        const serializedUser = {
            ...updatedUser,
            id: Number(updatedUser.id),
            createdAt: updatedUser.createdAt?.toISOString(),
            updatedAt: updatedUser.updatedAt?.toISOString()
        }
        
        // If role was changed, indicate that the user should be signed out
        const shouldSignOut = updateData.role && updateData.role !== session.user.role
        
        // Добавляем заголовки для предотвращения кэширования
        return new NextResponse(JSON.stringify({
            ...serializedUser,
            signOut: shouldSignOut
        }), {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Удаление пользователя
export async function DELETE(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Только админ может удалять пользователей
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get ID from URL
        const id = request.url.split('/').pop()
        if (!id) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
        }

        const targetUserId = Number(id)
        await prisma.user.delete({
            where: { id: targetUserId }
        })
        
        // Добавляем заголовки для предотвращения кэширования
        return new NextResponse(JSON.stringify({ message: 'User deleted successfully' }), {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}