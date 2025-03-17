'use client'
import useSWR from 'swr'
import axios from '@/lib/axios'
import { useSession } from 'next-auth/react'

export const useFavorites = () => {
    const { data: session } = useSession()

    const { data: favorites, error, mutate } = useSWR(
        session ? '/api/favorites' : null,
        () =>
            axios
                .get('/api/favorites')
                .then(res => res.data)
                .catch(error => {
                    if (error.response?.status === 401) {
                        return null
                    }
                    throw error
                }),
    )

    const addToFavorites = async (productId) => {
        try {
            const response = await axios.post('/api/favorites', {
                product_id: productId,
            })
            await mutate()
            return response.data
        } catch (error) {
            throw error
        }
    }

    const removeFromFavorites = async (productId) => {
        try {
            await axios.delete(`/api/favorites/${productId}`)
            await mutate()
        } catch (error) {
            throw error
        }
    }

    return {
        favorites,
        addToFavorites,
        removeFromFavorites,
        isLoading: !error && !favorites,
        isError: error,
    }
}