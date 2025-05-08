'use client'
import { useState, useEffect, useRef } from 'react'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'

const ProductsManagement = () => {
    const [products, setProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingProduct, setEditingProduct] = useState(null)
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        full_description: '',
        price: 0,
        unit: 'штука',
        image_preview: '',
        is_published: true,
        seller_id: null
    })
    const [isSaving, setIsSaving] = useState(false)
    const [uploadingPreview, setUploadingPreview] = useState(false)
    const [errors, setErrors] = useState({})
    const [uploadProgress, setUploadProgress] = useState(0) // Added missing state variable
    const [previewFile, setPreviewFile] = useState(null) // Added missing state variable
    const previewFileRef = useRef(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get('/api/admin/products')
            console.log('Products:', response.data)
            setProducts(response.data)
        } catch (err) {
            console.error('Error fetching products:', err)
            setError('Не удалось загрузить товары')
        } finally {
            setIsLoading(false)
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

    const handleEdit = (product) => {
        setEditingProduct(product.id)
        setEditFormData({
            name: product.name || '',
            description: product.description || '',
            full_description: product.full_description || '',
            price: product.price || 0,
            unit: product.unit || 'штука',
            image_preview: product.image_preview || '',
            is_published: product.is_published !== false,
            seller_id: product.seller_id || null
        })
        setPreviewFile(null)
    }

    const handleCancelEdit = () => {
        setEditingProduct(null)
        setPreviewFile(null)
        setUploadProgress(0)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                   name === 'price' ? parseFloat(value) : value
        }))
    }

    const handlePreviewUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        setUploadingPreview(true)
        
        try {
            const formData = new FormData()
            formData.append('file', file)
            
            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            
            if (response.data.success) {
                setEditFormData(prev => ({
                    ...prev,
                    image_preview: response.data.url
                }))
            }
        } catch (error) {
            console.error('Error uploading preview image:', error)
            setErrors(prev => ({
                ...prev,
                image_preview: 'Ошибка загрузки изображения'
            }))
        } finally {
            setUploadingPreview(false)
        }
    }

    const handleSaveEdit = async () => {
        setIsSaving(true)
        
        try {
            const productData = {
                ...editFormData
            }
            
            await axios.put(`/api/admin/products/${editingProduct}`, productData)
            
            // Update the product in the local state
            setProducts(prevProducts => 
                prevProducts.map(product => 
                    product.id === editingProduct 
                        ? { ...product, ...productData } 
                        : product
                )
            )
            
            setEditingProduct(null)
            setErrors({})
        } catch (error) {
            console.error('Error saving product:', error)
            alert('Ошибка при сохранении товара: ' + (error.response?.data?.error || error.message))
        } finally {
            setIsSaving(false)
        }
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Изображение</th>
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
                                <tr key={product.id} className={editingProduct === product.id ? "bg-blue-50" : ""}>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingProduct === product.id ? (
                                            <div className="space-y-2">
                                                {editFormData.image_preview && (
                                                    <div className="mb-2">
                                                        <p className="text-sm text-gray-500 mb-1">Текущее изображение:</p>
                                                        <img 
                                                            src={editFormData.image_preview} 
                                                            alt="Preview" 
                                                            className="h-20 w-20 object-cover border rounded"
                                                        />
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={previewFileRef}
                                                    onChange={handlePreviewUpload}
                                                    className="w-full text-sm"
                                                    accept="image/*"
                                                    disabled={uploadingPreview}
                                                />
                                                {uploadingPreview && <p className="text-sm text-blue-500">Загрузка...</p>}
                                                {errors.image_preview && <p className="text-sm text-red-500">{errors.image_preview}</p>}
                                            </div>
                                        ) : (
                                            product.image_preview && (
                                                <img 
                                                    src={product.image_preview} 
                                                    alt={product.name} 
                                                    className="h-10 w-10 object-cover rounded"
                                                />
                                            )
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingProduct === product.id ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={editFormData.name}
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
                                                value={editFormData.description}
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
                                                value={editFormData.price}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
                                                min="0"
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
                                                value={editFormData.unit}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
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
                                                checked={editFormData.is_published}
                                                onChange={handleChange}
                                                className="h-4 w-4"
                                            />
                                        ) : (
                                            product.is_published ? 'Да' : 'Нет'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.seller?.company_name || 'Нет данных'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingProduct === product.id ? (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    disabled={isSaving}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                >
                                                    <CheckIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
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
            
            {uploadProgress > 0 && (
                <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg w-64">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-500">Загрузка: {uploadProgress}%</p>
                </div>
            )}
        </div>
    )
}

export default ProductsManagement