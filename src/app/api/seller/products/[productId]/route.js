import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request, { params }) {
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

        // Сериализуем данные
        const serializedProduct = {
            ...product,
            id: Number(product.id),
            seller_id: Number(product.seller_id),
            price: Number(product.price),
            createdAt: product.createdAt?.toISOString(),
            updatedAt: product.updatedAt?.toISOString()
        }

        return NextResponse.json({ data: serializedProduct })
    } catch (error) {
        console.error('Error fetching seller product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Add PUT method for updating products
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

        // Await params before accessing properties
        const resolvedParams = await params
        const productId = resolvedParams.productId
        
        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        // Получаем данные как JSON
        const data = await request.json()
        
        // Remove any fields that might cause issues
        const { id, seller_id, images, ...cleanData } = data
        
        // Fix field name mismatch - map short_description to description
        if (cleanData.short_description) {
            cleanData.description = cleanData.short_description;
            delete cleanData.short_description;
        }
        
        // Обновляем товар
        const product = await prisma.product.update({
            where: { 
                id: BigInt(productId),
            },
            data: cleanData
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

        return NextResponse.json({ data: serializedProduct })
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
export async function DELETE(request, { params }) {
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

        // Проверяем, что товар принадлежит продавцу
        const product = await prisma.product.findFirst({
            where: { 
                id: BigInt(productId),
                seller_id: BigInt(session.user.id)
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found or you do not have permission to delete it' }, { status: 404 })
        }
        
        // Удаляем товар
        await prisma.product.delete({
            where: { id: BigInt(productId) }
        })
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}