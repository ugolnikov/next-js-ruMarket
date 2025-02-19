import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page')) || 1
        const search = searchParams.get('search') || ''
        const limit = 9 // количество товаров на странице

        const { products, total } = await db.getProducts({ page, search, limit })
        
        // Вычисляем метаданные для пагинации
        const last_page = Math.ceil(total / limit)

        // Convert BigInt to Number in the products array
        const serializedProducts = products.map(product => {
            const { seller, ...rest } = product
            return {
                ...rest,
                id: Number(product.id),
                seller_id: product.seller_id ? Number(product.seller_id) : null,
                seller: seller ? {
                    ...seller,
                    id: Number(seller.id)
                } : null,
                price: Number(product.price),
                createdAt: product.createdAt?.toISOString(),
                updatedAt: product.updatedAt?.toISOString()
            }
        })

        return NextResponse.json({
            data: serializedProducts,
            meta: {
                current_page: page,
                last_page: last_page,
                total: total,
                per_page: limit
            }
        })
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function POST(request) {
    try {
        const data = await request.json()
        const product = await db.createProduct(data)
        return NextResponse.json({ data: product }, { status: 201 })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
} 