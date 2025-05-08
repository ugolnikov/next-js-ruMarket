'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Button from '@/components/Button'
import Loader from '@/components/Loader'
import Image from 'next/image'

export default function EditProduct({ params }) {
    const router = useRouter()
    const [product, setProduct] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        full_description: '',
        price: 0,
        unit: 'штука',
        image_preview: '',
        images: [],
        is_published: true,
        seller_id: null
    })
    
    // Refs for file inputs
    const previewFileRef = useRef(null)
    const additionalImagesRef = useRef(null)
    
    // Preview image file state
    const [previewFile, setPreviewFile] = useState(null)
    const [additionalFiles, setAdditionalFiles] = useState([])
    
    const productId = params.productId
    
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true)
                if (productId === 'new') {
                    setIsLoading(false)
                    return
                }
                
                const response = await axios.get(`/api/admin/products/${productId}`)
                const productData = response.data
                
                setProduct(productData)
                setFormData({
                    name: productData.name || '',
                    description: productData.description || '',
                    full_description: productData.full_description || '',
                    price: productData.price || 0,
                    unit: productData.unit || 'штука',
                    image_preview: productData.image_preview || '',
                    images: productData.images || [],
                    is_published: productData.is_published !== false,
                    seller_id: productData.seller_id || null
                })
            } catch (error) {
                console.error('Error fetching product:', error)
                setError('Ошибка при загрузке товара: ' + (error.response?.data?.error || error.message))
            } finally {
                setIsLoading(false)
            }
        }

        fetchProduct()
    }, [productId])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                   name === 'price' ? parseFloat(value) : value
        }))
    }

    const handlePreviewFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPreviewFile(e.target.files[0])
        }
    }

    const handleAdditionalFilesChange = (e) => {
        if (e.target.files) {
            setAdditionalFiles(Array.from(e.target.files))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)
        
        try {
            // Upload preview image if selected
            let imagePreviewUrl = formData.image_preview
            if (previewFile) {
                setUploadProgress(10)
                const uploadResult = await uploadFile(previewFile, 'products', 'images')
                if (uploadResult && uploadResult.url) {
                    imagePreviewUrl = uploadResult.url
                }
                setUploadProgress(40)
            }
            
            // Upload additional images if selected
            let additionalImagesUrls = [...formData.images]
            if (additionalFiles.length > 0) {
                const uploadPromises = additionalFiles.map(file => uploadFile(file, 'products', 'images'))
                const uploadResults = await Promise.all(uploadPromises)
                
                const newUrls = uploadResults
                    .filter(result => result && result.url)
                    .map(result => result.url)
                
                additionalImagesUrls = [...additionalImagesUrls, ...newUrls]
                setUploadProgress(70)
            }
            
            const productData = {
                name: formData.name,
                description: formData.description,
                full_description: formData.full_description,
                price: formData.price,
                unit: formData.unit,
                image_preview: imagePreviewUrl,
                images: additionalImagesUrls,
                is_published: formData.is_published,
                seller_id: formData.seller_id
            }
            
            setUploadProgress(80)
            
            if (productId === 'new') {
                await axios.post('/api/admin/products', productData)
            } else {
                await axios.put(`/api/admin/products/${productId}`, productData)
            }
            
            setUploadProgress(100)
            router.push('/admin/products')
        } catch (error) {
            console.error('Error saving product:', error)
            setError('Ошибка при сохранении товара: ' + (error.response?.data?.error || error.message))
        } finally {
            setIsSaving(false)
            setUploadProgress(0)
        }
    }

    if (isLoading) return <Loader />

    return (
        <div className="container mx-auto px-4 py-8">
            <Button
                onClick={() => router.back()}
                className="mb-6 rounded">
                ← Назад к списку товаров
            </Button>
            
            <h1 className="text-3xl font-bold mb-6">
                {productId === 'new' ? 'Добавление нового товара' : 'Редактирование товара'}
            </h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Название товара</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Краткое описание</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={3}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Полное описание</label>
                            <textarea
                                name="full_description"
                                value={formData.full_description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={6}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Цена (₽)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Единица измерения</label>
                                <input
                                    type="text"
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Изображение товара</label>
                            <input
                                type="file"
                                ref={previewFileRef}
                                onChange={handlePreviewFileChange}
                                className="w-full px-3 py-2 border rounded-lg"
                                accept="image/*"
                            />
                            {formData.image_preview && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-1">Текущее изображение:</p>
                                    <img 
                                        src={formData.image_preview} 
                                        alt="Preview" 
                                        className="h-32 object-contain border rounded"
                                    />
                                </div>
                            )}
                            {previewFile && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-1">Новое изображение:</p>
                                    <img 
                                        src={URL.createObjectURL(previewFile)} 
                                        alt="New Preview" 
                                        className="h-32 object-contain border rounded"
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Дополнительные изображения</label>
                            <input
                                type="file"
                                ref={additionalImagesRef}
                                onChange={handleAdditionalFilesChange}
                                className="w-full px-3 py-2 border rounded-lg"
                                accept="image/*"
                                multiple
                            />
                            {formData.images.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-1">Текущие дополнительные изображения:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.images.map((url, index) => (
                                            <img 
                                                key={index}
                                                src={url} 
                                                alt={`Image ${index + 1}`} 
                                                className="h-20 w-20 object-cover border rounded"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {additionalFiles.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-1">Новые дополнительные изображения:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {additionalFiles.map((file, index) => (
                                            <img 
                                                key={index}
                                                src={URL.createObjectURL(file)} 
                                                alt={`New Image ${index + 1}`} 
                                                className="h-20 w-20 object-cover border rounded"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_published"
                                checked={formData.is_published}
                                onChange={handleChange}
                                className="h-4 w-4 mr-2"
                            />
                            <label className="text-gray-700 font-bold">Опубликован</label>
                        </div>
                    </div>
                </div>
                
                {uploadProgress > 0 && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Загрузка: {uploadProgress}%</p>
                    </div>
                )}
                
                <div className="mt-8 flex justify-end">
                    <Button
                        type="button"
                        onClick={() => router.back()}
                        className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800"
                    >
                        Отмена
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isSaving ? 'Сохранение...' : 'Сохранить товар'}
                    </Button>
                </div>
            </form>
        </div>
    )
}