'use client'
import { useFavorites } from '@/hooks/favorites'
import ProductCard from '@/components/ProductCard'
import Loader from '@/components/Loader'
import { useAuth } from '@/hooks/auth'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

const FavoritesPage = () => {
    const { favorites, isLoading } = useFavorites()
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()

    if (isLoading) {
        return <Loader />
    }

    if (!user) {
        router.push('/login')
        return null
    }

    return (
        <> 
        <Header title="Избранные"/>
        <div className="container mx-auto px-4 py-8">
            {favorites?.items?.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">You haven't added any products to favorites yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites?.items?.map(favorite => (
                        <ProductCard key={favorite.product_id} product={favorite.products} />
                    ))}
                </div>
            )}
        </div></>
    )
}

export default FavoritesPage