'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import Button from '@/components/Button'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Modal from '@/components/Modal'
import Header from '@/components/Header'
import { motion, AnimatePresence } from 'framer-motion'

export default function RequestsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [modalMessage, setModalMessage] = useState('')
    const [selectedRequestId, setSelectedRequestId] = useState(null)

    useEffect(() => {
        if (!user || user.role !== 'seller') {
            router.push('/login')
            return
        }
        fetchRequests()
    }, [user])

    const fetchRequests = async () => {
        try {
            const response = await axios.get('/api/seller/orders')
            console.log('Fetched requests:', response.data) // Add logging to see the data
            setRequests(response.data)
        } catch (err) {
            console.error('Error fetching requests:', err)
            setError('Ошибка при загрузке заявок')
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async requestId => {
        setSelectedRequestId(requestId)
        setModalMessage('Вы уверены, что отправили этот товар?')
        setShowModal(true)
    }

    const confirmSend = async () => {
        try {
            console.log('Sending request to update status for order:', selectedRequestId)
            const response = await axios.put(`/api/seller/orders/${selectedRequestId}/status`, {
                is_send: true
            })
            console.log('Update response:', response.data)
            setModalMessage('Товар успешно отправлен')
            
            // Fetch updated requests after successful update
            await fetchRequests()
            
            // Close modal after a delay
            setTimeout(() => setShowModal(false), 2000)
        } catch (error) {
            console.error('Error sending item:', error)
            setModalMessage(`Ошибка при отправлении товара: ${error.response?.data?.error || error.message}`)
        }
    }

    if (loading) return <Loader />
    if (error) return <div className="text-center text-red-500">{error}</div>
    return (
        <>
            <Header title="Управление заявками" />
            <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
                {requests.length === 0 ? (
                    <p>У вас нет заявок</p>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-300 hidden sm:table">
                            <thead>
                                <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">Id</th>
                                    <th className="py-3 px-6 text-left">Наименование продукта</th>
                                    <th className="py-3 px-6 text-left">Цена за ед.</th>
                                    <th className="py-3 px-6 text-left">Кол-во</th>
                                    <th className="py-3 px-6 text-left">Итоговая цена</th>
                                    <th className="py-3 px-6 text-left">Адрес</th>
                                    <th className="py-3 px-6 text-left">Статус</th>
                                    <th className="py-3 px-6 text-left">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                <AnimatePresence>
                                {requests.map((request, idx) => (
                                    <motion.tr
                                        key={request.id}
                                        className="border-b border-gray-300 hover:bg-gray-100"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <td className="py-3 px-6">{request.id}</td>
                                        <td className="py-3 px-6">{request.items[0].product.name}</td>
                                        <td className="py-3 px-6">{request.items[0].price}₽</td>
                                        <td className="py-3 px-6">{request.items[0].quantity}</td>
                                        <td className="py-3 px-6">{(request.items[0].price * request.items[0].quantity)}₽</td>
                                        <td className="py-3 px-6">{request.address}</td>
                                        <td className="py-3 px-6">{request.items[0].is_send ? (<span className='text-green-600'>Отправлен</span>) : (<span className='text-red-600'>Не отправлен</span>)}</td>
                                        {!request.items[0].is_send &&
                                        (<td className="py-3 px-6">
                                            <motion.button
                                                className='rounded bg-[#4438ca] hover:bg-[#19144d] text-white px-3 py-2 text-sm font-medium shadow'
                                                whileHover={{ scale: 1.07 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => handleSend(request.id)}
                                            >
                                                Отправить
                                            </motion.button>
                                        </td>)}
                                    </motion.tr>
                                ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                        {/* Мобильная версия: карточки */}
                        <div className="flex flex-col gap-4 sm:hidden">
                            <AnimatePresence>
                            {requests.map((request, idx) => (
                                <motion.div
                                    key={request.id}
                                    className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col gap-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-base">{request.items[0].product.name}</span>
                                        <span className={request.items[0].is_send ? 'text-green-600' : 'text-red-600'}>
                                            {request.items[0].is_send ? 'Отправлен' : 'Не отправлен'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                                        <span>Цена: <b>{request.items[0].price}₽</b></span>
                                        <span>Кол-во: <b>{request.items[0].quantity}</b></span>
                                        <span>Итого: <b>{request.items[0].price * request.items[0].quantity}₽</b></span>
                                    </div>
                                    <div className="text-sm text-gray-700">Адрес: {request.address}</div>
                                    {!request.items[0].is_send && (
                                        <motion.button
                                            className='rounded bg-[#4438ca] hover:bg-[#19144d] text-white px-4 py-2 text-base font-medium mt-2 shadow'
                                            whileHover={{ scale: 1.07 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleSend(request.id)}
                                        >
                                            Отправить
                                        </motion.button>
                                    )}
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Подтверждение"
                    onConfirm={
                        modalMessage ===
                        'Вы уверены, что отправили этот товар?'
                            ? confirmSend
                            : undefined
                    }>
                    <p>{modalMessage}</p>
                </Modal>
            </div>
        </>
    )
}
