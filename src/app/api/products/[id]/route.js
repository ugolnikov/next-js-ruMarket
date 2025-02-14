import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request, { params }) {
    try {
        const id = await params.id
        const product = await db.findProductById(parseInt(id))
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Убедимся, что путь к изображению начинается с /
        if (product.image_preview && !product.image_preview.startsWith('/')) {
            product.image_preview = `/${product.image_preview}`
        }

        return NextResponse.json({ data: product })
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
} 