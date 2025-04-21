import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Проверяем, что пользователь является продавцом
        if (session.user.role !== 'seller' && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only sellers can access this endpoint' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page')) || 1
        const limit = parseInt(searchParams.get('limit')) || 10
        const skip = (page - 1) * limit

        // Получаем товары продавца
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: { 
                    seller_id: session.user.id 
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.product.count({
                where: { seller_id: session.user.id }
            })
        ])

        // Сериализуем данные
        const serializedProducts = products.map(product => ({
            ...product,
            id: Number(product.id),
            seller_id: Number(product.seller_id),
            price: Number(product.price),
            createdAt: product.createdAt?.toISOString(),
            updatedAt: product.updatedAt?.toISOString()
        }))

        return NextResponse.json({
            data: serializedProducts,
            meta: {
                current_page: page,
                last_page: Math.ceil(total / limit),
                total,
                per_page: limit
            }
        })
    } catch (error) {
        console.error('Error fetching seller products:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Проверяем, что пользователь является продавцом
        if (session.user.role !== 'seller' && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only sellers can access this endpoint' }, { status: 403 })
        }

        // Получаем данные как JSON вместо FormData
        const data = await request.json()
        
        // Remove any id field and images field that might be causing conflicts
        const { id, images, seller_id, ...cleanData } = data
        
        // Добавляем ID продавца к данным товара
        const productData = {
            ...cleanData,
            seller_id: BigInt(session.user.id),
            is_published: true
        }

        const product = await prisma.product.create({
            data: productData
        })

        // Сериализуем данные
        const serializedProduct = {
            ...product,
            id: Number(product.id),
            seller_id: Number(product.seller_id),
            price: Number(product.price),
            createdAt: product.createdAt?.toISOString(),
            updatedAt: product.updatedAt?.toISOString()
        }

        return NextResponse.json({ data: serializedProduct }, { status: 201 })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ 
            error: `Internal Server Error: ${error.message || 'Unknown error'}` 
        }, { status: 500 })
    }
}