import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET() {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const products = await prisma.product.findMany({
            orderBy: {
                id: 'asc'
            },
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
        
        // Serialize the data
        const serializedProducts = products.map(product => ({
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
        }))
        
        return NextResponse.json(serializedProducts)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await request.json()
        
        // Remove any id field that might be causing conflicts
        const { id, ...cleanData } = data
        
        const product = await prisma.product.create({
            data: {
                ...cleanData,
                seller_id: BigInt(cleanData.seller_id || session.user.id),
                is_published: true
            }
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
        
        return NextResponse.json(serializedProduct, { status: 201 })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}