'use client'
import { useState, useCallback } from 'react'
import useSWR from 'swr'
import axios from '@/lib/axios'
import ProductCard from '@/components/ProductCard'
import Pagination from '@/components/Pagination'
import Loader from '@/components/Loader'
import debounce from 'lodash/debounce'

const Products = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

    // Debounce function to delay the search query update
    const debouncedSearch = useCallback(
        debounce((query) => {
            setDebouncedSearchQuery(query)
        }, 500),
        []
    )

    // Update the search query and trigger the debounced search
    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    // Fetch products using the debounced search query
    const { data: products, error, isLoading } = useSWR(
        `/api/products?page=${currentPage}&search=${debouncedSearchQuery}`,
        () =>
            axios
                .get(`/api/products?page=${currentPage}&search=${debouncedSearchQuery}`)
                .then(res => res.data),
    )

    if (isLoading) return <Loader />
    if (error) return <div>Ошибка загрузки товаров</div>

    return (
        <div className="container mx-auto px-4 py-4">
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Поиск товаров..."
                    className="w-full p-2 border rounded"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.data.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {products?.meta && (
                <Pagination
                    currentPage={currentPage}
                    lastPage={products.meta.last_page}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    )
}

export default Products