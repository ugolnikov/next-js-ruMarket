import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const productId = resolvedParams.productId
        
        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const product = await prisma.product.findUnique({
            where: { id: BigInt(productId) },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company_name: true
                    }
                }
            }
        })
        
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }
        
        // Serialize the data
        const serializedProduct = {
            ...product,
            id: Number(product.id),
            seller_id: product.seller_id ? Number(product.seller_id) : null,
            price: Number(product.price),
            seller: product.seller ? {
                ...product.seller,
                id: Number(product.seller.id)
            } : null,
            createdAt: product.createdAt?.toISOString(),
            updatedAt: product.updatedAt?.toISOString()
        }
        
        return NextResponse.json(serializedProduct)
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const productId = resolvedParams.productId
        
        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }
        
        const data = await request.json()
        
        // Validate required fields
        if (!data.name || data.price === undefined) {
            return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
        }
        
        // Update the product
        const product = await prisma.product.update({
            where: { id: BigInt(productId) },
            data: {
                name: data.name,
                description: data.description || '',
                full_description: data.full_description || '',
                price: data.price,
                unit: data.unit || 'штука',
                image_preview: data.image_preview || '',
                is_published: data.is_published !== undefined ? data.is_published : true,
                seller_id: data.seller_id ? BigInt(data.seller_id) : null
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        company_name: true
                    }
                }
            }
        })
        
        // Serialize the data
        const serializedProduct = {
            ...product,
            id: Number(product.id),
            seller_id: product.seller_id ? Number(product.seller_id) : null,
            price: Number(product.price),
            seller: product.seller ? {
                ...product.seller,
                id: Number(product.seller.id)
            } : null,
            createdAt: product.createdAt?.toISOString(),
            updatedAt: product.updatedAt?.toISOString()
        }
        
        return NextResponse.json(serializedProduct)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const productId = resolvedParams.productId
        
        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }
        
        // Delete the product
        await prisma.product.delete({
            where: { id: BigInt(productId) }
        })
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}