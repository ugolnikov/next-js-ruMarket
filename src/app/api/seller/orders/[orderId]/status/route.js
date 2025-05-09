import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(request, { params }) {
    try {
        console.log('Received request to update order status:', params)
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is a seller
        if (session.user.role !== 'seller' && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only sellers can access this endpoint' }, { status: 403 })
        }

        const resolvedParams = await params
        const orderId = resolvedParams.orderId
        
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        const data = await request.json()
        const { is_send } = data

        if (is_send === undefined) {
            return NextResponse.json({ error: 'is_send field is required' }, { status: 400 })
        }

        console.log(`Updating order ${orderId} with is_send=${is_send}`)

        // Find the order
        const order = await prisma.order.findUnique({
            where: { id: BigInt(orderId) },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        console.log('Found order:', JSON.stringify(order, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
        ))

        // Check if the seller owns any products in this order
        const sellerItems = order.items.filter(item => 
            item.product && BigInt(item.product.seller_id) === BigInt(session.user.id)
        )

        console.log('Seller items:', sellerItems.length)

        if (sellerItems.length === 0) {
            return NextResponse.json({ error: 'No items from this seller in the order' }, { status: 403 })
        }

        // Update the order items that belong to this seller
        const updatedItems = await Promise.all(sellerItems.map(item => {
            console.log(`Updating item ${item.id} with is_send=${is_send}`)
            return prisma.orderItem.update({
                where: { id: item.id },
                data: { is_send: is_send }
            })
        }))

        console.log('Updated items:', updatedItems)

        // If all items are shipped, update the order status
        const allItemsShipped = await prisma.orderItem.findMany({
            where: { orderId: BigInt(orderId) }
        })
        
        const allShipped = allItemsShipped.every(item => item.is_send)
        
        if (allShipped && order.status === 'processing') {
            console.log('All items shipped, updating order status to shipped')
            await prisma.order.update({
                where: { id: BigInt(orderId) },
                data: { status: 'shipped' }
            })
        }

        return NextResponse.json({ 
            success: true,
            message: 'Order items updated successfully'
        })
    } catch (error) {
        console.error('Error updating order status:', error)
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 })
    }
}