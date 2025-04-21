'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import ProductForm from '@/components/ProductForm'
import Button from '@/components/Button'
import Modal from '@/components/Modal'

export default function CreateProduct() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [modalMessage, setModalMessage] = useState('')

    const handleSubmit = async (formData) => {
        setIsLoading(true)
        try {
            // Ensure all required fields are present and properly formatted
            // Remove fields that don't exist in the database schema
            const productData = {
                name: formData.name,
                price: parseFloat(formData.price), // Ensure price is a number
                unit: formData.unit,
                description: formData.description,
                full_description: formData.full_description || formData.description,
                image_preview: formData.image_preview
                // Removed 'images' field as it doesn't exist in your database schema
            }

    
            const response = await axios.post('/api/seller/products', productData)
            
            setModalMessage('Товар успешно создан!')
            setShowModal(true)
            
            // Перенаправление после закрытия модального окна
            setTimeout(() => {
                router.push('/dashboard/goods')
            }, 2000)
        } catch (error) {
            console.error('Error creating product:', error)
            setModalMessage('Ошибка при создании товара: ' + (error.response?.data?.error || error.message))
            setShowModal(true)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Создание нового товара</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <ProductForm 
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </div>
            
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Уведомление"
            >
                <p>{modalMessage}</p>
                <div className="mt-4 flex justify-end">
                    <Button onClick={() => setShowModal(false)}>
                        Закрыть
                    </Button>
                </div>
            </Modal>
        </div>
    )
}