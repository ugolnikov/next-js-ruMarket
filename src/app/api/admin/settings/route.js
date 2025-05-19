import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initializeSettings() {
    try {
        // Проверяем существование записи с комиссией
        const existingSetting = await prisma.setting.findFirst({
            where: {
                key: 'commission'
            }
        })

        // Если записи нет, создаем её с значением по умолчанию
        if (!existingSetting) {
            await prisma.setting.create({
                data: {
                    key: 'commission',
                    value: '10'
                }
            })
        }
    } catch (error) {
        console.error('Ошибка инициализации настроек:', error)
    }
}

async function getCommission() {
    try {
        const setting = await prisma.setting.findFirst({
            where: {
                key: 'commission'
            }
        })
        return setting ? Number(setting.value) : 10
    } catch (error) {
        console.error('Ошибка получения комиссии:', error)
        return 10 // Возвращаем значение по умолчанию в случае ошибки
    }
}

async function updateCommission(value) {
    try {
        const setting = await prisma.setting.upsert({
            where: {
                key: 'commission'
            },
            update: {
                value: value.toString()
            },
            create: {
                key: 'commission',
                value: value.toString()
            }
        })
        return Number(setting.value)
    } catch (error) {
        console.error('Ошибка обновления комиссии:', error)
        throw error
    }
}

// Инициализируем настройки при запуске
initializeSettings()

export async function GET() {
    try {
        const commission = await getCommission()
        return NextResponse.json({ commission })
    } catch (error) {
        console.error('Ошибка получения комиссии:', error)
        return NextResponse.json({ commission: 10 }) // Возвращаем значение по умолчанию
    }
}

export async function PUT(request) {
    try {
        const data = await request.json()
        if (typeof data.commission === 'undefined') {
            return NextResponse.json({ error: 'commission is required' }, { status: 400 })
        }
        
        const commission = await updateCommission(Number(data.commission))
        return NextResponse.json({ commission })
    } catch (error) {
        console.error('Ошибка сохранения комиссии:', error)
        return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 })
    }
} 