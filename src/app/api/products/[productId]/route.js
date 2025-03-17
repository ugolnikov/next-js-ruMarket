import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request) {
    try {
        const id = request.url.split('/').pop()
        if (!id) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        company_name: true,
                        phone: true,
                        email: true,
                        address: true,
                        logo: true,
                        inn: true
                    }
                }
            }
        })
        
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Serialize the product data
        const serializedProduct = {
            ...product,
            id: Number(product.id),
            seller_id: Number(product.seller_id),
            price: Number(product.price),
            createdAt: product.createdAt?.toISOString(),
            updatedAt: product.updatedAt?.toISOString(),
            seller: product.seller ? {
                ...product.seller,
                id: Number(product.seller.id)
            } : null
        }

        // Ensure image path starts with /
        if (serializedProduct.image_preview && !serializedProduct.image_preview.startsWith('/')) {
            serializedProduct.image_preview = `/${serializedProduct.image_preview}`
        }

        return NextResponse.json(serializedProduct)
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get ID from URL
        const id = request.url.split('/').pop()
        if (!id) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        const productData = await request.json()
        const product = await prisma.product.findUnique({
            where: { id: Number(id) }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Проверяем права доступа
        if (Number(product.seller_id) !== session.user.id && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: productData
        })

        // Serialize the updated product
        const serializedProduct = {
            ...updatedProduct,
            id: Number(updatedProduct.id),
            seller_id: Number(updatedProduct.seller_id),
            price: Number(updatedProduct.price),
            createdAt: updatedProduct.createdAt?.toISOString(),
            updatedAt: updatedProduct.updatedAt?.toISOString()
        }

        return NextResponse.json(serializedProduct)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get ID from URL
        const id = request.url.split('/').pop()
        if (!id) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        const product = await prisma.product.findUnique({
            where: { id: Number(id) }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Проверяем права доступа
        if (Number(product.seller_id) !== session.user.id && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.product.delete({
            where: { id: Number(id) }
        })

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}