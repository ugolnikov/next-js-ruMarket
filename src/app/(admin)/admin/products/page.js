'use client'
import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const ProductsManagement = () => {
    const [products, setProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState({})
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get('/api/admin/products')
            setProducts(response.data)
        } catch (err) {
            console.error('Error fetching products:', err)
            setError('Не удалось загрузить товары')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (product) => {
        setEditingProduct(product.id)
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            unit: product.unit,
            is_published: product.is_published
        })
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                   name === 'price' ? parseFloat(value) : value
        }))
    }

    const handleSave = async () => {
        try {
            await axios.put(`/api/admin/products/${editingProduct}`, formData)
            setEditingProduct(null)
            fetchProducts()
        } catch (err) {
            console.error('Error updating product:', err)
            alert('Не удалось обновить товар')
        }
    }

    const handleDelete = async (productId) => {
        if (!confirm('Вы уверены, что хотите удалить этот товар?')) return
        
        try {
            await axios.delete(`/api/admin/products/${productId}`)
            fetchProducts()
        } catch (err) {
            console.error('Error deleting product:', err)
            alert('Не удалось удалить товар')
        }
    }

    const handleCancel = () => {
        setEditingProduct(null)
    }

    const filteredProducts = products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) return <Loader />

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Управление товарами</h1>
                <Link 
                    href="/admin/products/new" 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Добавить товар
                </Link>
            </div>
            
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Поиск товаров..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ед. изм.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Опубликован</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Продавец</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingProduct === product.id ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name || ''}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
                                            />
                                        ) : (
                                            product.name
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">
                                        {editingProduct === product.id ? (
                                            <textarea
                                                name="description"
                                                value={formData.description || ''}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
                                                rows={2}
                                            />
                                        ) : (
                                            product.description
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingProduct === product.id ? (
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price || 0}
                                                onChange={handleChange}
                                                className="w-24 px-2 py-1 border rounded"
                                                step="0.01"
                                            />
                                        ) : (
                                            `₽${product.price}`
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingProduct === product.id ? (
                                            <input
                                                type="text"
                                                name="unit"
                                                value={formData.unit || ''}
                                                onChange={handleChange}
                                                className="w-20 px-2 py-1 border rounded"
                                            />
                                        ) : (
                                            product.unit
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingProduct === product.id ? (
                                            <input
                                                type="checkbox"
                                                name="is_published"
                                                checked={formData.is_published || false}
                                                onChange={handleChange}
                                                className="h-4 w-4"
                                            />
                                        ) : (
                                            product.is_published ? 'Да' : 'Нет'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {product.User?.name || 'Нет данных'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingProduct === product.id ? (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleSave}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <CheckIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default ProductsManagement