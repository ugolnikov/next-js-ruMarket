import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request) {
    try {
        const { name, email, password, password_confirmation } = await request.json()

        // Валидация
        if (!name || !email || !password || !password_confirmation) {
            return NextResponse.json(
                { error: 'Все поля обязательны для заполнения' },
                { status: 400 }
            )
        }

        if (password !== password_confirmation) {
            return NextResponse.json(
                { error: 'Пароли не совпадают' },
                { status: 400 }
            )
        }

        // Проверка существования пользователя
        const existingUser = await db.findUser(email)
        if (existingUser) {
            return NextResponse.json(
                { error: 'Пользователь с таким email уже существует' },
                { status: 400 }
            )
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10)

        // Создание пользователя
        const user = await db.createUser({
            name,
            email,
            password: hashedPassword,
            role: 'customer'
        })

        return NextResponse.json({ user }, { status: 201 })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Ошибка при регистрации' },
            { status: 500 }
        )
    }
} 