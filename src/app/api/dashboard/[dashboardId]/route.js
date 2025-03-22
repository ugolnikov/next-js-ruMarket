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
        if (session.user.id !== targetUserId) {
            return NextResponse.json({ error: 'Forbidden ' }, { status: 403 })
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
        console.error('Error updating user:', error)
        return NextResponse.json(
            // Use optional chaining to safely access error.message
            { error: error?.message || 'Internal Server Error' },
            { status: 500 }
        )
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

        // Check if INN already exists for another user
        if (updateData.inn) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    inn: updateData.inn,
                    id: { not: targetUserId } // Exclude current user
                }
            })

            if (existingUser) {
                return NextResponse.json(
                    { error: 'ИНН уже используется другим продавцом' },
                    { status: 400 }
                )
            }
        }

        // Update user in database with all seller fields
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: {
                role: updateData.role,
                company_name: updateData.company_name,
                inn: updateData.inn,
                address: updateData.address,
                phone: updateData.phone,
                ...(updateData.role === 'seller' && updateData.inn && updateData.company_name && updateData.phone && updateData.address
                    ? { is_verify: true }
                    : {})
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                company_name: true,
                inn: true,
                address: true,
                is_verify: true,
                logo: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Формируем ответ
        return NextResponse.json({
            user: {
                ...updatedUser,
                id: Number(updatedUser.id),
                createdAt: updatedUser.createdAt.toISOString(),
                updatedAt: updatedUser.updatedAt.toISOString()
            },
            signOut: updateData.role && updateData.role !== session.user.role
        });

    } catch (error) {
        console.error('Ошибка обновления:', error);
        
        // Всегда возвращаем валидный JSON
        return NextResponse.json(
            { 
                error: error?.message || 'Внутренняя ошибка сервера',
                details: error?.stack?.split('\n') 
            },
            { status: 500 }
        );
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
        console.error('Error updating user:', error)
        return NextResponse.json(
            // Use optional chaining to safely access error.message
            { error: error?.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}