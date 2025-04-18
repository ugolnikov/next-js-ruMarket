import { useState, useEffect, useRef, createRef } from 'react'
import Button from './Button'
import Image from 'next/image'
import axios from '@/lib/axios'
import Loader from './Loader'
import ImageFallback from './ImageFallback'

export default function ProductForm({ initialData = {}, onSubmit, isLoading }) {
    // Ensure initialData is an object even if null is passed
    const safeInitialData = initialData || {};
    
    const [formData, setFormData] = useState({
        name: safeInitialData.name || '',
        price: safeInitialData.price || '',
        description: safeInitialData.description || '',
        full_description: safeInitialData.full_description || '',
        unit: safeInitialData.unit || 'штука',
        image_preview: safeInitialData.image_preview || '',
        image_urls: safeInitialData.image_urls || [], // Initialize as empty array
        // Add any other fields you need
    });
    
    const [errors, setErrors] = useState({})
    const [uploadingPreview, setUploadingPreview] = useState(false)
    const [uploadingImages, setUploadingImages] = useState([])
    
    const previewFileInputRef = useRef(null)
    const additionalFileInputRefs = useRef([])

    // Обработчик для обычных полей формы
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setErrors(prev => ({
            ...prev,
            [name]: undefined
        }))
    }
    
    // Обработчик для URL изображений
    const handleImageUrlChange = (index, value) => {
        const newImageUrls = [...formData.image_urls]
        newImageUrls[index] = value
        setFormData(prev => ({ ...prev, image_urls: newImageUrls }))
    }
    
    // Добавление нового поля для URL изображения
    const addImageUrl = () => {
        setFormData(prev => ({
            ...prev,
            image_urls: [...(prev.image_urls || []), '']
        }))
        setUploadingImages(prev => [...prev, false])
        
        // Добавляем новый ref для нового поля
        additionalFileInputRefs.current.push(React.createRef())
    }
    
    // Удаление URL изображения
    const removeImageUrl = (index) => {
        const newImageUrls = [...formData.image_urls]
        newImageUrls.splice(index, 1)
        setFormData(prev => ({ ...prev, image_urls: newImageUrls }))
        
        const newUploadingImages = [...uploadingImages]
        newUploadingImages.splice(index, 1)
        setUploadingImages(newUploadingImages)
        
        // Удаляем ref
        additionalFileInputRefs.current.splice(index, 1)
    }

    // Загрузка превью изображения
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
                setFormData(prev => ({
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
    
    // Загрузка дополнительного изображения
    const handleAdditionalImageUpload = async (index, e) => {
        const file = e.target.files[0]
        if (!file) return
        
        // Обновляем состояние загрузки для конкретного изображения
        const newUploadingImages = [...uploadingImages]
        newUploadingImages[index] = true
        setUploadingImages(newUploadingImages)
        
        try {
            const formData = new FormData()
            formData.append('file', file)
            
            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            
            if (response.data.success) {
                const newImageUrls = [...formData.image_urls]
                newImageUrls[index] = response.data.url
                setFormData(prev => ({
                    ...prev,
                    image_urls: newImageUrls
                }))
            }
        } catch (error) {
            console.error('Error uploading additional image:', error)
        } finally {
            newUploadingImages[index] = false
            setUploadingImages(newUploadingImages)
        }
    }

    // Инициализация refs для дополнительных изображений
    useEffect(() => {
        additionalFileInputRefs.current = formData.image_urls.map(() => createRef())
        setUploadingImages(formData.image_urls.map(() => false))
    }, [])

    // Валидация и отправка формы
    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationErrors = {}

        if (!formData.name) validationErrors.name = 'Введите название товара'
        if (!formData.price) validationErrors.price = 'Введите цену'
        if (!formData.description) validationErrors.description = 'Введите краткое описание'
        if (!formData.full_description) validationErrors.full_description = 'Введите полное описание'
        if (!formData.image_preview) validationErrors.image_preview = 'Добавьте главное изображение'

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }

        // Подготовка данных для отправки
        const dataToSubmit = {
            ...formData,
            images: formData.image_urls.filter(url => url.trim() !== '')
        }
        
        onSubmit(dataToSubmit)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Название товара</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setErrors(prev => ({ ...prev, name: undefined }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4438ca] focus:ring-[#4438ca]"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
        
            <div>
                <label className="block text-sm font-medium text-gray-700">Цена</label>
                <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    onFocus={() => setErrors(prev => ({ ...prev, price: undefined }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4438ca] focus:ring-[#4438ca]"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
        
            <div>
                <label className="block text-sm font-medium text-gray-700">Единица измерения</label>
                <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4438ca] focus:ring-[#4438ca]">
                    <option value="штука">штука</option>
                    <option value="упаковка">упаковка</option>
                </select>
            </div>
        
            <div>
                <label className="block text-sm font-medium text-gray-700">Краткое описание</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    onFocus={() => setErrors(prev => ({ ...prev, description: undefined }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4438ca] focus:ring-[#4438ca]"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
        
            <div>
                <label className="block text-sm font-medium text-gray-700">Полное описание</label>
                <textarea
                    name="full_description"
                    value={formData.full_description}
                    onChange={handleChange}
                    onFocus={() => setErrors(prev => ({ ...prev, full_description: undefined }))}
                    rows={5}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4438ca] focus:ring-[#4438ca]"
                />
                {errors.full_description && <p className="mt-1 text-sm text-red-600">{errors.full_description}</p>}
            </div>
        
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                    Главное изображение
                </label>
                
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        name="image_preview"
                        value={formData.image_preview}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4438ca] focus:ring-[#4438ca]"
                        placeholder="URL изображения или загрузите файл"
                    />
                    <input 
                        type="file"
                        accept="image/*"
                        ref={previewFileInputRef}
                        onChange={handlePreviewUpload}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        onClick={() => previewFileInputRef.current.click()}
                        disabled={uploadingPreview}
                        className="whitespace-nowrap"
                    >
                        {uploadingPreview ? 'Загрузка...' : 'Загрузить'}
                    </Button>
                </div>
                
                {formData.image_preview && (
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">Предпросмотр:</p>
                        <div className="relative w-full h-64 mt-2">
                            <ImageFallback 
                                src={formData.image_preview} 
                                alt="Preview" 
                                fill
                                style={{ objectFit: 'contain' }}
                                className="rounded-lg"
                            />
                        </div>
                    </div>
                )}
                {errors.image_preview && <p className="mt-1 text-sm text-red-600">{errors.image_preview}</p>}
            </div>
            
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                    Дополнительные изображения
                </label>
                
                {formData.image_urls && formData.image_urls.map((url, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4438ca] focus:ring-[#4438ca]"
                                placeholder="URL изображения или загрузите файл"
                            />
                            <input 
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleAdditionalImageUpload(index, e)}
                                className="hidden"
                                ref={el => additionalFileInputRefs.current[index] = el}
                            />
                            <Button
                                type="button"
                                onClick={() => additionalFileInputRefs.current[index].click()}
                                disabled={uploadingImages[index]}
                                className="whitespace-nowrap"
                            >
                                {uploadingImages[index] ? 'Загрузка...' : 'Загрузить'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => removeImageUrl(index)}
                                className="p-2 text-red-500 hover:text-red-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        
                        {url && (
                            <div className="mt-2">
                                <div className="relative w-full h-32">
                                    <ImageFallback 
                                        src={url} 
                                        alt={`Image ${index + 1}`} 
                                        fill
                                        style={{ objectFit: 'contain' }}
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                <button
                    type="button"
                    onClick={addImageUrl}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Добавить еще изображение
                </button>
            </div>
        
            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={isLoading || uploadingPreview || uploadingImages.some(status => status)}
                    className="rounded">
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </div>
        </form>
    )
}