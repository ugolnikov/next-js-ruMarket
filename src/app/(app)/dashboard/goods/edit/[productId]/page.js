'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import ProductForm from '@/components/ProductForm'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import Loader from '@/components/Loader'
import { use } from 'react'

export default function EditProduct({ params }) {
    const router = useRouter()
    const [product, setProduct] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [modalMessage, setModalMessage] = useState('')
    
    // Unwrap params using React.use()
    const resolvedParams = use(params)
    const productId = resolvedParams.productId

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`/api/seller/products/${productId}`)
                setProduct(response.data.data)
            } catch (error) {
                console.error('Error fetching product:', error)
                setModalMessage('Ошибка при загрузке товара: ' + (error.response?.data?.error || error.message))
                setShowModal(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProduct()
    }, [productId]) // Now using the unwrapped productId

    const handleSubmit = async (formData) => {
        setIsSaving(true)
        try {
            // Изменяем на отправку JSON вместо FormData
            const productData = {
                name: formData.name,
                price: formData.price,
                unit: formData.unit,
                short_description: formData.description,
                full_description: formData.full_description,
                image_preview: formData.image_preview,
                images: formData.image_urls?.filter(url => url.trim() !== '')
            }

            await axios.put(`/api/seller/products/${productId}`, productData)
            
            setModalMessage('Товар успешно обновлен!')
            setShowModal(true)
            
            // Перенаправление после закрытия модального окна
            setTimeout(() => {
                router.push('/dashboard/goods')
            }, 2000)
        } catch (error) {
            console.error('Error updating product:', error)
            setModalMessage('Ошибка при обновлении товара: ' + (error.response?.data?.error || error.message))
            setShowModal(true)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <Loader />

    return (
        <div className="container mx-auto px-4 py-8">
            <Button
                onClick={() => router.back()}
                className="mb-6 rounded">
                Назад
            </Button>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Редактирование товара</h1>
                
                {isLoading ? (
                    <Loader />
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {product ? (
                            <ProductForm 
                                initialData={product}
                                onSubmit={handleSubmit}
                                isLoading={isSaving}
                            />
                        ) : (
                            <p>Товар не найден</p>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Уведомление">
                <p>{modalMessage}</p>
            </Modal>
        </div>
    )
}