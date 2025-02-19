import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(request) {
    try {
        const { name, email, password, password_confirmation } = await request.json()

        // Валидация
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

        // Проверяем, существует ли пользователь
        const existingUser = await db.findUser(email)
        if (existingUser) {
            return NextResponse.json(
                { error: 'Пользователь с таким email уже существует' },
                { status: 422 }
            )
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10)

        // Создаем пользователя
        const user = await db.createUser({
            name,
            email,
            password: hashedPassword,
            role: 'customer' // По умолчанию роль customer
        })

        // Удаляем пароль из ответа
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Ошибка при регистрации' },
            { status: 500 }
        )
    }
} 