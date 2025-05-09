'use client'
import useSWR from 'swr'
import axios from '@/lib/axios'
import { useSession } from 'next-auth/react'

export const useCart = () => {
    const { data: session } = useSession()

    const { data: cart, error, mutate } = useSWR(
        session ? '/api/cart' : null,
        () =>
            axios
                .get('/api/cart')
                .then(res => res.data)
                .catch(error => {
                    if (error.response?.status === 401) {
                        return null
                    }
                    throw error
                }),
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true
        }
    )

    const addToCart = async (productId) => {
        try {
            const response = await axios.post('/api/cart', {
                product_id: productId,
                // Remove quantity parameter
            })
            await mutate()
            return response.data
        } catch (error) {
            console.error('Error in addToCart:', error.response?.data || error)
            throw error
        }
    }

    const removeFromCart = async (cartItemId) => {
        try {
            await axios.delete(`/api/cart/${cartItemId}`)
            await mutate()
        } catch (error) {
            throw error
        }
    }

    // Remove or modify updateQuantity function since we don't need it anymore
    const clearCart = async () => {
        try {
            await axios.delete('/api/cart')
            await mutate()
        } catch (error) {
            throw error
        }
    }

    return {
        cart,
        error,
        isLoading: !error && !cart,
        addToCart,
        removeFromCart,
        clearCart,
        mutateCart: mutate,
    }
}