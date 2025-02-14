'use client'
import useSWR from 'swr'
import axios from '@/lib/axios'

export const useOrders = () => {
    const { data: orders, error, mutate } = useSWR('/api/orders', () =>
        axios
            .get('/api/orders')
            .then(res => Array.isArray(res.data) ? res.data : [])
            .catch(error => {
                console.error('Error fetching orders:', error)
                return []
            }),
    )

    const loadOrder = async (orderNumber) => {
        try {
            const response = await axios.get(`/api/orders/${orderNumber}`)
            return response.data
        } catch (error) {
            console.error('Error loading order:', error)
            return null
        }
    }

    const createOrder = async (orderData) => {
        try {
            const response = await axios.post('/api/orders', orderData)
            await mutate()
            return response.data
        } catch (error) {
            throw error
        }
    }

    const updateOrderStatus = async (orderId, status) => {
        try {
            const response = await axios.put(`/api/orders/${orderId}/status`, { status })
            await mutate()
            return response.data
        } catch (error) {
            throw error
        }
    }

    return {
        orders: orders || [],
        error,
        isLoading: !error && !orders,
        loadOrder,
        createOrder,
        updateOrderStatus,
        mutateOrders: mutate,
    }
} 