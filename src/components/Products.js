'use client'
import { useEffect, useState, useCallback } from 'react'
import useSWR from 'swr'
import axios from '@/lib/axios'
import ProductCard from '@/components/ProductCard'
import Pagination from '@/components/Pagination'
import Loader from '@/components/Loader'
import WelcomeBoard from '@/components/WelcomeBoard'
import debounce from 'lodash/debounce'
import ProductFilters from '@/components/ProductFilters'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

const Products = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
    const [sortType, setSortType] = useState('default')
    const [priceRange, setPriceRange] = useState('all')
    const [filterState, setFilterState] = useState({
        currentRange: { min: 0, max: 100000 },
        isFiltered: false,
    })
    const [clickedProductId, setClickedProductId] = useState(null)
    const router = useRouter()

    const handleProductClick = productId => {
        setClickedProductId(productId)
        router.push(`/product/${productId}`)
    }
    // Add debounced search function
    const debouncedSearch = useCallback(
        debounce(query => {
            setDebouncedSearchQuery(query)
        }, 500),
        [],
    )

    const handleSearchChange = e => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    const handleSort = newSortType => {
        setSortType(newSortType)
        setCurrentPage(1)
    }

    const handlePriceFilter = (range, currentRange, isFiltered) => {
        setPriceRange(range)
        setFilterState({ currentRange, isFiltered })
        setCurrentPage(1)
    }

    const {
        data: products,
        error,
        isLoading,
    } = useSWR(
        `/api/products?page=${currentPage}&search=${debouncedSearchQuery}&sort=${sortType}&priceRange=${priceRange}`,
        () =>
            axios
                .get(
                    `/api/products?page=${currentPage}&search=${debouncedSearchQuery}&sort=${sortType}&priceRange=${priceRange}`,
                )
                .then(res => res.data),
    )
    if (isLoading) return <Loader />
    if (error) return <div>Ошибка загрузки товаров</div>

    return (
        <div className="container mx-auto px-4 py-4">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative mb-6 group">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Поиск товаров..."
                            className="w-full p-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-[#4438ca] focus:ring-2 focus:ring-[#4438ca]/20 transition-all duration-300 outline-none"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <motion.div
                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{ translateY: '-50%' }}>
                            <svg
                                className="w-6 h-6 text-[#4438ca] transition-colors duration-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </motion.div>
                    </div>
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4438ca] origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: searchQuery ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                    />
                </motion.div>
            </AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}>
                {(() => {
                    if (currentPage === 1 && !searchQuery)
                        return <WelcomeBoard />
                })()}
            </motion.div>

            <ProductFilters
                onSort={handleSort}
                onFilter={handlePriceFilter}
                filterState={filterState}
                initialSort={sortType} // Pass the current sort value
            />

            {products?.data?.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12">
                    <svg
                        className="w-16 h-16 mx-auto text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        Ничего не найдено
                    </h3>
                    <p className="text-gray-500">
                        Попробуйте изменить параметры поиска
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products?.data?.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 30 }}
                            exit={{ opacity: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{
                                duration: 0.4,
                                delay:
                                    (index % 3) * 0.1 +
                                    Math.floor(index / 3) * 0.1,
                            }}
                            onClick={() => handleProductClick(product.id)}
                            className="relative">
                            <ProductCard product={product} />
                            {clickedProductId === product.id && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-[#4438ca] border-t-transparent rounded-full animate-spin" />
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
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
