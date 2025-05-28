import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function PUT(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Проверяем, что пользователь является продавцом
        if (session.user.role !== 'seller' && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only sellers can access this endpoint' }, { status: 403 })
        }

        const productId = params.productId
        
        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        // Получаем товар продавца
        const product = await prisma.product.findFirst({
            where: { 
                id: BigInt(productId),
                seller_id: BigInt(session.user.id)
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Инвертируем статус публикации
        const updatedProduct = await prisma.product.update({
            where: { id: BigInt(productId) },
            data: { is_published: !product.is_published }
        })

        // Сериализуем данные
        const serializedProduct = {
            ...updatedProduct,
            id: Number(updatedProduct.id),
            seller_id: Number(updatedProduct.seller_id),
            price: Number(updatedProduct.price),
            createdAt: updatedProduct.createdAt?.toISOString(),
            updatedAt: updatedProduct.updatedAt?.toISOString()
        }

        return NextResponse.json({ data: serializedProduct })
    } catch (error) {
        console.error('Error toggling product publish status:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}