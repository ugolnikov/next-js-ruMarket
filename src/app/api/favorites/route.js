import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/favorites
export async function GET(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const favorites = await prisma.favorites.findMany({
            where: {
                user_id: session.user.id
            },
            include: {
                products: true
            }
        })

        // Serialize BigInt values
        const serializedFavorites = favorites.map(favorite => ({
            ...favorite,
            id: Number(favorite.id),
            user_id: Number(favorite.user_id),
            product_id: Number(favorite.product_id),
            products: favorite.products ? {
                ...favorite.products,
                id: Number(favorite.products.id),
                seller_id: favorite.products.seller_id ? Number(favorite.products.seller_id) : null,
                price: Number(favorite.products.price),
                createdAt: favorite.products.createdAt?.toISOString(),
                updatedAt: favorite.products.updatedAt?.toISOString()
            } : null
        }))

        return NextResponse.json({ items: serializedFavorites })
    } catch (error) {
        console.error('Error fetching favorites:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/favorites
export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { product_id } = await request.json()
        
        if (!product_id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const favorite = await prisma.favorites.create({
            data: {
                user_id: session.user.id,
                product_id: Number(product_id)
            },
            include: {
                products: true
            }
        })

        // Convert BigInt to Number before JSON serialization
        const serializedFavorite = {
            ...favorite,
            id: Number(favorite.id),
            user_id: Number(favorite.user_id),
            product_id: Number(favorite.product_id),
            products: favorite.products ? {
                ...favorite.products,
                id: Number(favorite.products.id),
                seller_id: favorite.products.seller_id ? Number(favorite.products.seller_id) : null,
                price: Number(favorite.products.price),
                createdAt: favorite.products.createdAt?.toISOString(),
                updatedAt: favorite.products.updatedAt?.toISOString()
            } : null
        }

        return NextResponse.json(serializedFavorite)
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Already in favorites' }, { status: 400 })
        }
        console.error('Error adding to favorites:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}