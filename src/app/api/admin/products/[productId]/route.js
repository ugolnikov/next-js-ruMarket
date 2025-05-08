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
                User: {
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
            seller_id: Number(product.seller_id),
            price: Number(product.price),
            User: product.User ? {
                ...product.User,
                id: Number(product.User.id)
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
        
        // Remove any fields that might cause issues
        const { id, User, ...cleanData } = data
        
        // Convert seller_id to BigInt if it exists
        if (cleanData.seller_id) {
            cleanData.seller_id = BigInt(cleanData.seller_id)
        }
        
        const product = await prisma.product.update({
            where: { id: BigInt(productId) },
            data: cleanData
        })
        
        // Serialize the data
        const serializedProduct = {
            ...product,
            id: Number(product.id),
            seller_id: Number(product.seller_id),
            price: Number(product.price),
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

        await prisma.product.delete({
            where: { id: BigInt(productId) }
        })
        
        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}