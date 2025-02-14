import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcryptjs'

const DATA_DIR = path.join(process.cwd(), 'src/data')

class Database {
  constructor() {
    this.cache = new Map()
    this.usersPath = path.join(process.cwd(), 'src/data/users.json')
    this.cartsPath = path.join(process.cwd(), 'src/data/carts.json')
    this.productsPath = path.join(process.cwd(), 'src/data/products.json')
    this.ordersPath = path.join(process.cwd(), 'src/data/orders.json')
  }

  async readFile(filename) {
    if (this.cache.has(filename)) {
      return this.cache.get(filename)
    }

    const filePath = path.join(DATA_DIR, filename)
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'))
    this.cache.set(filename, data)
    return data
  }

  async writeFile(filename, data) {
    const filePath = path.join(DATA_DIR, filename)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    this.cache.set(filename, data)
  }

  // Users
  async findUser(email) {
    const { users } = await this.readFile('users.json')
    return users.find(user => user.email === email)
  }

  async findUserById(id) {
    const { users } = await this.readFile('users.json')
    return users.find(user => user.id === id)
  }

  async createUser(userData) {
    const { users = [] } = await this.readFile('users.json')
    
    // Генерируем ID для нового пользователя
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1

    const newUser = {
        id,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }

    users.push(newUser)
    await this.writeFile('users.json', { users })

    // Возвращаем пользователя без пароля
    const { password, ...userWithoutPassword } = newUser
    return userWithoutPassword
  }

  // Products
  async findProducts({ page = 1, limit = 10, search = '' }) {
    const { products } = await this.readFile('products.json')
    let filtered = products

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      )
    }

    const total = filtered.length
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit)

    return {
      data: items,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit)
      }
    }
  }

  async findProductById(id) {
    const { products = [] } = await this.readFile('products.json')
    const product = products.find(p => p.id === id)
    
    if (product && product.image_preview && !product.image_preview.startsWith('/')) {
        product.image_preview = `/${product.image_preview}`
    }
    
    return product
  }

  async getProducts({ page = 1, search = '', limit = 9 } = {}) {
    const { products = [] } = await this.readFile('products.json')
    
    let filteredProducts = products
    if (search) {
        const searchLower = search.toLowerCase()
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower)
        )
    }

    const start = (page - 1) * limit
    const paginatedProducts = filteredProducts.slice(start, start + limit)

    return {
        products: paginatedProducts,
        total: filteredProducts.length
    }
  }

  async createProduct(data) {
    const { products } = await this.readFile('products.json')
    
    const newProduct = {
        id: Date.now(),
        ...data,
        is_published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }

    products.push(newProduct)
    await this.writeFile('products.json', { products })
    
    return newProduct
  }

  async updateProduct(id, data) {
    const { products } = await this.readFile('products.json')
    const index = products.findIndex(p => p.id === id)
    
    if (index === -1) return null

    const updatedProduct = {
        ...products[index],
        ...data,
        updatedAt: new Date().toISOString()
    }

    products[index] = updatedProduct
    await this.writeFile('products.json', { products })
    
    return updatedProduct
  }

  async deleteProduct(id) {
    const { products } = await this.readFile('products.json')
    const index = products.findIndex(p => p.id === id)
    
    if (index === -1) return false

    products.splice(index, 1)
    await this.writeFile('products.json', { products })
    
    return true
  }

  // Cart
  async getCart(userId) {
    try {
      const cartsData = await fs.readFile(this.cartsPath, 'utf8')
      const carts = JSON.parse(cartsData)
      return carts.carts.find(cart => cart.userId === userId) || { userId, items: [] }
    } catch (error) {
      console.error('Error getting cart:', error)
      return { userId, items: [] }
    }
  }

  async getProduct(productId) {
    try {
      const productsData = await fs.readFile(this.productsPath, 'utf8')
      const products = JSON.parse(productsData)
      return products.products.find(product => product.id === productId) || null
    } catch (error) {
      console.error('Error getting product:', error)
      return null
    }
  }

  async addToCart(userId, productId, quantity) {
    try {
      const cartsData = await fs.readFile(this.cartsPath, 'utf8')
      let carts = JSON.parse(cartsData)
      
      // Находим корзину пользователя или создаем новую
      let userCartIndex = carts.carts.findIndex(cart => cart.userId === userId)
      if (userCartIndex === -1) {
        carts.carts.push({
          userId,
          items: []
        })
        userCartIndex = carts.carts.length - 1
      }

      // Получаем информацию о продукте
      const product = await this.getProduct(productId)
      if (!product) {
        throw new Error('Product not found')
      }

      // Проверяем, есть ли уже такой товар в корзине
      const existingItemIndex = carts.carts[userCartIndex].items.findIndex(
        item => item.product_id === productId
      )

      if (existingItemIndex !== -1) {
        // Если товар уже есть, увеличиваем количество
        carts.carts[userCartIndex].items[existingItemIndex].quantity += quantity
      } else {
        // Если товара нет, добавляем новый
        carts.carts[userCartIndex].items.push({
          id: Date.now(),
          product_id: productId,
          product: product,
          quantity: quantity
        })
      }

      // Сохраняем обновленные данные
      await fs.writeFile(this.cartsPath, JSON.stringify(carts, null, 2))
      
      // Возвращаем обновленную корзину пользователя
      return carts.carts[userCartIndex]
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  async updateCartItem(userId, itemId, quantity) {
    const { cartItems } = await this.readFile('cart.json')
    const index = cartItems.findIndex(
        item => item.id === itemId && item.userId === userId
    )

    if (index === -1) throw new Error('Cart item not found')

    cartItems[index].quantity = quantity
    cartItems[index].updatedAt = new Date().toISOString()

    await this.writeFile('cart.json', { cartItems })
    return this.getCart(userId)
  }

  async removeFromCart(userId, itemId) {
    const { cartItems } = await this.readFile('cart.json')
    const index = cartItems.findIndex(
        item => item.id === itemId && item.userId === userId
    )

    if (index === -1) throw new Error('Cart item not found')

    cartItems.splice(index, 1)
    await this.writeFile('cart.json', { cartItems })
    return this.getCart(userId)
  }

  // Orders
  async createOrder(userId, orderData) {
    try {
        const ordersData = await fs.readFile(this.ordersPath, 'utf8')
        const orders = JSON.parse(ordersData)
        
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        
        const newOrder = {
            id: Date.now(),
            order_number: orderNumber,
            user_id: userId,
            status: 'pending',
            items: orderData.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            })),
            shipping_address: orderData.shipping_address,
            total_amount: orderData.items.reduce(
                (sum, item) => sum + (item.price * item.quantity),
                0
            ),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        orders.orders.push(newOrder)
        await fs.writeFile(this.ordersPath, JSON.stringify(orders, null, 2))
        
        // Очищаем корзину пользователя после создания заказа
        await this.clearCart(userId)
        
        return newOrder
    } catch (error) {
        console.error('Error creating order:', error)
        throw error
    }
  }

  async getUserOrders(userId) {
    try {
        const ordersData = await fs.readFile(this.ordersPath, 'utf8')
        const orders = JSON.parse(ordersData)
        const userOrders = orders.orders.filter(order => order.user_id === userId)
        return userOrders
    } catch (error) {
        console.error('Error getting user orders:', error)
        if (error.code === 'ENOENT') {
            // Если файл не существует, создаем его с пустым массивом заказов
            await fs.writeFile(this.ordersPath, JSON.stringify({ orders: [] }))
            return []
        }
        throw error
    }
  }

  async getOrderByNumber(orderNumber) {
    try {
      const ordersData = await fs.readFile(this.ordersPath, 'utf8')
      const orders = JSON.parse(ordersData)
      return orders.orders.find(order => order.order_number === orderNumber)
    } catch (error) {
      console.error('Error getting order by number:', error)
      throw error
    }
  }

  async getOrder(orderId) {
    try {
      const ordersData = await fs.readFile(this.ordersPath, 'utf8')
      const orders = JSON.parse(ordersData)
      return orders.orders.find(order => order.id === orderId)
    } catch (error) {
      console.error('Error getting order:', error)
      throw error
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const ordersData = await fs.readFile(this.ordersPath, 'utf8')
      const orders = JSON.parse(ordersData)
      
      const orderIndex = orders.orders.findIndex(order => order.id === orderId)
      if (orderIndex === -1) {
        throw new Error('Order not found')
      }

      orders.orders[orderIndex].status = status
      orders.orders[orderIndex].updated_at = new Date().toISOString()

      await fs.writeFile(this.ordersPath, JSON.stringify(orders, null, 2))
      return orders.orders[orderIndex]
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  async clearCart(userId) {
    try {
        const cartsData = await fs.readFile(this.cartsPath, 'utf8')
        const carts = JSON.parse(cartsData)
        
        const userCartIndex = carts.carts.findIndex(cart => cart.user_id === userId)
        
        if (userCartIndex !== -1) {
            carts.carts[userCartIndex].items = []
            await fs.writeFile(this.cartsPath, JSON.stringify(carts, null, 2))
        }
        
        return true
    } catch (error) {
        console.error('Error clearing cart:', error)
        throw error
    }
  }
}

export const db = new Database() 