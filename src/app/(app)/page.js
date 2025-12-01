import ProductList from '@/components/Products'
import { prisma } from '@/lib/db'

export const metadata = {
    title: 'Главная',
}

async function getInitialProducts() {
    const page = 1
    const limit = 9

    const where = {
        is_published: true,
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: { seller: true },
        }),
        prisma.product.count({ where }),
    ])

    const serializedProducts = products.map(product => {
        const { seller, ...rest } = product
        return {
            ...rest,
            id: Number(product.id),
            seller_id: product.seller_id ? Number(product.seller_id) : null,
            seller: seller
                ? {
                    ...seller,
                    id: Number(seller.id),
                }
                : null,
            price: Number(product.price),
            createdAt: product.createdAt?.toISOString(),
            updatedAt: product.updatedAt?.toISOString(),
        }
    })

    return {
        data: serializedProducts,
        meta: {
            current_page: page,
            last_page: Math.ceil(total / limit),
            total,
            per_page: limit,
        },
    }
}

const Home = async () => {
    const initialProducts = await getInitialProducts()

    return (
        <div className="min-h-screen bg-white">
            <div className="relative flex items-top min-h-screen sm:items-top sm:pt-0 w-full">
                <div className="pt-0 text-black bg-white p-2 sm:p-5 rounded w-full">
                    <ProductList initialData={initialProducts} />
                </div>
            </div>
        </div>
    )
}

export default Home
