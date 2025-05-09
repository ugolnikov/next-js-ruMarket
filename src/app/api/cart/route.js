import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'


// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Получение корзины
export async function GET() {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const cartItems = await prisma.cart_items.findMany({
            where: { user_id: session.user.id },
            include: {
                products: true
            }
        })
        
        // Convert BigInt to Number in cart items and restructure the data
        const serializedItems = cartItems.map(item => ({
            id: Number(item.id),
            quantity: Number(item.quantity),
            product: {
                ...item.products,
                id: Number(item.products.id),
                seller_id: Number(item.products.seller_id),
                price: Number(item.products.price),
                createdAt: item.products.createdAt?.toISOString(),
                updatedAt: item.products.updatedAt?.toISOString()
            }
        }))
        
        return NextResponse.json({
            items: serializedItems
        })
    } catch (error) {
        console.error('Error getting cart:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Добавление в корзину
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

        // Check if product already exists in cart
        const existingItem = await prisma.cart_items.findFirst({
            where: {
                user_id: session.user.id,
                product_id: product_id
            }
        })

        if (existingItem) {
            return NextResponse.json(
                { error: 'Product already in cart' }, 
                { status: 409 }
            )
        }

        // Always add with quantity 1 - using Prisma directly
        const cartItem = await prisma.cart_items.create({
            data: {
                user_id: session.user.id,
                product_id: product_id,
                quantity: 1
            },
            include: {
                products: true
            }
        })
        
        // Serialize the cart item
        const serializedItem = {
            id: Number(cartItem.id),
            quantity: Number(cartItem.quantity),
            product: {
                ...cartItem.products,
                id: Number(cartItem.products.id),
                seller_id: Number(cartItem.products.seller_id),
                price: Number(cartItem.products.price),
                createdAt: cartItem.products.createdAt?.toISOString(),
                updatedAt: cartItem.products.updatedAt?.toISOString()
            }
        }
        
        return NextResponse.json(serializedItem)
    } catch (error) {
        console.error('Error adding to cart:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Очистка корзины
export async function DELETE() {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.cart_items.deleteMany({
            where: { user_id: session.user.id }
        })

        return NextResponse.json({ message: 'Cart cleared successfully' })
    } catch (error) {
        console.error('Error clearing cart:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}