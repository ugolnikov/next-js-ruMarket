import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Helper function to recursively serialize all BigInt values
const serializeData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return Number(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    if (data instanceof Date) {
      return data.toISOString();
    }
    
    const result = {};
    for (const key in data) {
      result[key] = serializeData(data[key]);
    }
    return result;
  }
  
  return data;
};

export async function GET(request, { params }) {
    try {
        const session = await auth()

        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Await params before accessing properties
        const resolvedParams = await params
        const orderId = resolvedParams.orderId
        
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        const order = await prisma.order.findUnique({
            where: { id: BigInt(orderId) },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Use the recursive serialization function to handle all BigInt values
        const serializedOrder = serializeData(order);

        return NextResponse.json(serializedOrder)
    } catch (error) {
        console.error('Error fetching order:', error)
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
        const orderId = resolvedParams.orderId
        
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        const data = await request.json()
        
        // Only allow updating certain fields
        const { status, tracking_number, notes, payment_method, payment_status, shipping_method, paid } = data
        
        // Create update data object with only defined values
        const updateData = {}
        if (status) updateData.status = status
        if (tracking_number !== undefined) updateData.tracking_number = tracking_number
        if (notes !== undefined) updateData.notes = notes
        if (payment_method) updateData.payment_method = payment_method
        if (payment_status) updateData.payment_status = payment_status
        if (shipping_method) updateData.shipping_method = shipping_method
        
        // Ensure paid is a boolean if it's defined
        if (paid !== undefined) {
            // Convert to boolean explicitly
            updateData.paid = paid === true || paid === 'true'
        }

        const order = await prisma.order.update({
            where: { id: BigInt(orderId) },
            data: updateData,
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })
        
        // Use the serializeData helper function to handle all BigInt values
        const serializedOrder = serializeData(order);

        return NextResponse.json(serializedOrder)
    } catch (error) {
        console.error('Error updating order:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
