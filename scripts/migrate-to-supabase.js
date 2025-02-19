import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'
import 'dotenv/config';
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateData() {
  try {
    // Читаем данные из JSON файлов
    const usersData = JSON.parse(await fs.readFile(join(__dirname, '..', 'src/data/users.json'), 'utf8'))
    const productsData = JSON.parse(await fs.readFile(join(__dirname, '..', 'src/data/products.json'), 'utf8'))
    const ordersData = JSON.parse(await fs.readFile(join(__dirname, '..', 'src/data/orders.json'), 'utf8'))
    const cartsData = JSON.parse(await fs.readFile(join(__dirname, '..', 'src/data/carts.json'), 'utf8'))

    // Мигрируем пользователей
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert(usersData.users.map(user => ({
        id: Number(user.id),
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role.toLowerCase(),
        phone: user.phone || null,
        company_name: user.company_name || null,
        inn: user.inn || null,
        address: user.address || null,
        logo: user.logo || null,
        is_verify: false,
        created_at: new Date(user.createdAt).toISOString(),
        updated_at: new Date(user.updatedAt).toISOString()
      })))

    if (usersError) throw usersError

    // Мигрируем продукты
    const { data: products, error: productsError } = await supabase
      .from('products')
      .upsert(productsData.products.map(product => ({
        id: Number(product.id),
        name: product.name,
        description: product.description || '',
        full_description: product.full_description || '',
        price: Number(product.price),
        unit: product.unit || 'шт',
        image_preview: product.image_preview || null,
        is_published: true,
        seller_id: Number(product.sellerId) || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))

    if (productsError) throw productsError

    // Мигрируем заказы
    for (const order of ordersData.orders) {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .upsert({
          id: Number(order.id),
          order_number: order.order_number,
          user_id: Number(order.user_id),
          status: order.status || 'pending',
          email: order.shipping_address.email,
          phone: order.shipping_address.phone,
          address: order.shipping_address.address,
          full_name: order.shipping_address.fullName,
          total_amount: Number(order.total_amount),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (orderError) throw orderError

      // Мигрируем элементы заказа
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .upsert(order.items.map(item => ({
          order_id: Number(order.id),
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          price: Number(item.price),
          is_send: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))

      if (orderItemsError) throw orderItemsError
    }

    // Мигрируем корзины
    for (const cart of cartsData.carts) {
      if (cart.userId) {
        const { error: cartItemsError } = await supabase
          .from('cart_items')
          .upsert(cart.items.map(item => ({
            user_id: Number(cart.userId),
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })))

        if (cartItemsError) throw cartItemsError
      }
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

migrateData() 