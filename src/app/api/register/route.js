import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(request) {
    try {
        const { name, email, password, password_confirmation } = await request.json()

        // Validation
        if (!name || !email || !password || !password_confirmation) {
            return NextResponse.json(
                { error: 'Все поля обязательны для заполнения' },
                { status: 422 }
            )
        }

        if (password !== password_confirmation) {
            return NextResponse.json(
                { error: 'Пароли не совпадают' },
                { status: 422 }
            )
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Пользователь с таким email уже существует' },
                { status: 422 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'customer'
            }
        })

        // Remove password and serialize BigInt values
        const { password: _, ...userData } = user
        const serializedUser = {
            ...userData,
            id: Number(userData.id),
            createdAt: userData.createdAt?.toISOString(),
            updatedAt: userData.updatedAt?.toISOString()
        }

        return NextResponse.json({ user: serializedUser }, { status: 201 })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Ошибка при регистрации' },
            { status: 500 }
        )
    }
}