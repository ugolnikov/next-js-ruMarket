import { PrismaClient } from '@prisma/client'

let prisma

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient()
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient()
    }
    prisma = global.prisma
}

// Ensure prisma is initialized
if (!prisma) {
    prisma = new PrismaClient()
}

export { prisma }

export const db = {
  async findUser(email) {
    return await prisma.user.findUnique({
      where: { email }
    })
  },

  async getCart(userId) {
    return await prisma.cart_items.findMany({
      where: { user_id: userId },
      include: {
        products: true
      }
    })
  },

  async addToCart(userId, productId, quantity) {
    const existingItem = await prisma.cart_items.findFirst({
      where: {
        user_id: userId,
        product_id: productId
      }
    })

    if (existingItem) {
      return existingItem;
    }

    return await prisma.cart_items.create({
      data: {
        user_id: userId,
        product_id: productId,
        quantity
      },
      include: {
        products: true
      }
    })
  },

  async updateCartItemQuantity(userId, cartItemId, quantity) {
    // Find the cart item first
    const cartItem = await prisma.cart_items.findFirst({
      where: {
        id: cartItemId,
        user_id: userId
      }
    });
    
    if (!cartItem) {
      throw new Error('Cart item not found');
    }
    
    return await prisma.cart_items.update({
      where: {
        id: cartItemId,
        user_id: userId
      },
      data: { quantity: 1 },
      include: {
        products: true
      }
    })
  },

  async removeFromCart(userId, cartItemId) {
    return await prisma.cart_items.delete({
      where: {
        id: cartItemId,
        user_id: userId
      }
    })
  },

  async clearCart(userId) {
    return await prisma.cart_items.deleteMany({
      where: { user_id: userId }
    })
  },

  async getOrder(orderNumber) {
    return await prisma.order.findUnique({
      where: {
        orderNumber: orderNumber
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
  },

  async getUserOrders(userId) {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  async createOrder(userId, orderData) {
    const { items, shipping_address } = orderData

    // Calculate total amount and convert to Decimal
    const totalAmount = items.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity))
    }, 0)

    // Generate a unique order number: ORD-YYYYMMDD-XXXX
    const date = new Date()
    const dateStr = date.getFullYear().toString() +
                   (date.getMonth() + 1).toString().padStart(2, '0') +
                   date.getDate().toString().padStart(2, '0')
    
    // Get the latest order number for today to increment
    const latestOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: `ORD-${dateStr}`
        }
      },
      orderBy: {
        orderNumber: 'desc'
      }
    })

    let sequence = 1
    if (latestOrder) {
      const lastSequence = parseInt(latestOrder.orderNumber.split('-')[2])
      sequence = lastSequence + 1
    }

    const orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`

    return await prisma.order.create({
      data: {
        userId: BigInt(userId),
        orderNumber,
        status: 'pending',
        email: shipping_address.email,
        phone: shipping_address.phone,
        address: shipping_address.address,
        fullName: shipping_address.fullName,
        totalAmount: totalAmount.toFixed(2),
        items: {
          create: items.map(item => ({
            productId: BigInt(item.product_id),
            quantity: Number(item.quantity),
            price: Number(item.price).toFixed(2)
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
  },

  async updateOrderStatus(id, status) {
    return await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
  },

  async findUserById(id) {
    return await prisma.user.findUnique({
      where: { id }
    })
  },

  async createUser(data) {
    return await prisma.user.create({
      data: {
        ...data,
        role: 'customer'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
  },

  async updateUserRole(id) {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) throw new Error('User not found')

    return await prisma.user.update({
      where: { id },
      data: {
        role: user.role === 'customer' ? 'seller' : 'customer'
      }
    })
  },

  async getProducts({ page = 1, search = '', limit = 9 }) {
    const skip = (page - 1) * limit

    const where = {
      is_published: true,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              company_name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.count({ where })
    ])

    return {
      products,
      total
    }
  },

  async getProduct(id) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            company_name: true,
            phone: true,
            email: true
          }
        }
      }
    })
  },

  async updateProduct(id, data) {
    return await prisma.product.update({
      where: { id },
      data,
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
  },

  async deleteProduct(id) {
    return await prisma.product.delete({
      where: { id }
    })
  },

  async getSellerProducts(sellerId, { page = 1, limit = 10 } = {}) {
      const skip = (page - 1) * limit
      
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: { seller_id: sellerId },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.product.count({ where: { seller_id: sellerId } })
      ])
      
      return {
        products,
        total
      }
    }
}