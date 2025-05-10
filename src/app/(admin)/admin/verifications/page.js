'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/hooks/auth'
import Button from '@/components/Button'
import Image from 'next/image'

const VerificationRequests = () => {
    const router = useRouter()
    const { user } = useAuth({ middleware: 'auth' })
    const [verifications, setVerifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (user && !user.is_admin) {
            router.push('/dashboard')
        }
    }, [user, router])

    useEffect(() => {
        const fetchVerifications = async () => {
            try {
                setLoading(true)
                const response = await axios.get('/api/admin/verifications')
                setVerifications(response.data)
                setError(null)
            } catch (err) {
                setError('Не удалось загрузить заявки на верификацию')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        if (user?.is_admin) {
            fetchVerifications()
        }
    }, [user])

    const handleViewDetails = async (userId) => {
        try {
            const response = await axios.get(`/api/admin/verifications/${userId}`)
            setSelectedRequest(response.data)
        } catch (err) {
            console.error('Ошибка при загрузке деталей:', err)
        }
    }

    const handleApprove = async (userId) => {
        try {
            setProcessing(true)
            await axios.put(`/api/admin/verifications/${userId}`, {
                action: 'approve'
            })
            
            // Update the list
            setVerifications(verifications.filter(v => v.id !== userId))
            setSelectedRequest(null)
            
        } catch (err) {
            console.error('Ошибка при одобрении заявки:', err)
        } finally {
            setProcessing(false)
        }
    }

    const handleReject = async (userId) => {
        if (!rejectionReason) {
            alert('Пожалуйста, укажите причину отклонения')
            return
        }
        
        try {
            setProcessing(true)
            await axios.put(`/api/admin/verifications/${userId}`, {
                action: 'reject',
                rejection_reason: rejectionReason
            })
            
            // Update the list
            setVerifications(verifications.filter(v => v.id !== userId))
            setSelectedRequest(null)
            setRejectionReason('')
            
        } catch (err) {
            console.error('Ошибка при отклонении заявки:', err)
        } finally {
            setProcessing(false)
        }
    }

    if (!user || !user.is_admin) {
        return null
    }

    return (
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h1 className="text-2xl font-semibold mb-6">Заявки на верификацию продавцов</h1>
                            
                            {loading ? (
                                <p>Загрузка заявок...</p>
                            ) : error ? (
                                <div className="bg-red-50 p-4 rounded-md">
                                    <p className="text-red-700">{error}</p>
                                </div>
                            ) : verifications.length === 0 ? (
                                <p>Нет активных заявок на верификацию</p>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-full md:w-1/3">
                                        <h2 className="text-lg font-medium mb-4">Список заявок</h2>
                                        <div className="space-y-2">
                                            {verifications.map(verification => (
                                                <div 
                                                    key={verification.id}
                                                    className={`p-4 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedRequest?.id === verification.id ? 'bg-indigo-50 border-indigo-300' : ''}`}
                                                    onClick={() => handleViewDetails(verification.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">{verification.name}</p>
                                                            <p className="text-sm text-gray-600">{verification.email}</p>
                                                            <p className="text-xs text-gray-500">
                                                                Тип: {verification.seller_type === 'company' ? 'Компания' : 'Физическое лицо'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Запрос от: {new Date(verification.verification_requested_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-2/3">
                                        {selectedRequest ? (
                                            <div className="border rounded-md p-6">
                                                <h2 className="text-xl font-medium mb-4">Детали заявки</h2>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-500">Основная информация</h3>
                                                        <p className="mt-1"><span className="font-medium">Имя:</span> {selectedRequest.name}</p>
                                                        <p><span className="font-medium">Email:</span> {selectedRequest.email}</p>
                                                        <p><span className="font-medium">Телефон:</span> {selectedRequest.phone || 'Не указан'}</p>
                                                        <p><span className="font-medium">Адрес:</span> {selectedRequest.address || 'Не указан'}</p>
                                                        <p><span className="font-medium">Тип продавца:</span> {selectedRequest.seller_type === 'company' ? 'Компания' : 'Физическое лицо'}</p>
                                                    </div>
                                                    
                                                    {selectedRequest.seller_type === 'company' ? (
                                                        <div>
                                                            <h3 className="text-sm font-medium text-gray-500">Информация о компании</h3>
                                                            <p className="mt-1"><span className="font-medium">Название компании:</span> {selectedRequest.company_name || 'Не указано'}</p>
                                                            <p><span className="font-medium">ИНН:</span> {selectedRequest.inn || 'Не указан'}</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <h3 className="text-sm font-medium text-gray-500">Паспортные данные</h3>
                                                            <p className="mt-1"><span className="font-medium">Номер паспорта:</span> {selectedRequest.passport_number || 'Не указан'}</p>
                                                            <p><span className="font-medium">Кем выдан:</span> {selectedRequest.passport_issued_by || 'Не указано'}</p>
                                                            <p><span className="font-medium">Дата выдачи:</span> {selectedRequest.passport_issue_date ? new Date(selectedRequest.passport_issue_date).toLocaleDateString() : 'Не указана'}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {selectedRequest.verification_documents && selectedRequest.verification_documents.length > 0 && (
                                                    <div className="mb-6">
                                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Загруженные документы</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {selectedRequest.verification_documents.map((doc, index) => (
                                                                <div key={index} className="relative">
                                                                    <div className="h-32 w-full bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                                                        <Image 
                                                                            src={doc} 
                                                                            alt={`Документ ${index + 1}`} 
                                                                            width={150} 
                                                                            height={150} 
                                                                            className="object-contain h-full"
                                                                        />
                                                                    </div>
                                                                    <a 
                                                                        href={doc} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs text-blue-600 hover:underline mt-1 block"
                                                                    >
                                                                        Открыть в новом окне
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {selectedRequest.logo && (
                                                    <div className="mb-6">
                                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Логотип</h3>
                                                        <div className="h-32 w-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                                            <Image 
                                                                src={selectedRequest.logo} 
                                                                alt="Логотип" 
                                                                width={100} 
                                                                height={100} 
                                                                className="object-contain h-full"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="border-t pt-4 mt-4">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Действия</h3>
                                                    
                                                    <div className="flex flex-col space-y-4">
                                                        <div>
                                                            <Button
                                                                onClick={() => handleApprove(selectedRequest.id)}
                                                                className="bg-green-600 hover:bg-green-700 w-full rounded"
                                                                disabled={processing}
                                                            >
                                                                {processing ? 'Обработка...' : 'Одобрить заявку'}
                                                            </Button>
                                                        </div>
                                                        
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Причина отклонения
                                                            </label>
                                                            <textarea
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                                rows={3}
                                                                placeholder="Укажите причину отклонения заявки"
                                                            />
                                                            <Button
                                                                onClick={() => handleReject(selectedRequest.id)}
                                                                className="bg-red-600 hover:bg-red-700 w-full mt-2 rounded"
                                                                disabled={processing}
                                                            >
                                                                {processing ? 'Обработка...' : 'Отклонить заявку'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border rounded-md p-6 flex items-center justify-center h-full">
                                                <p className="text-gray-500">Выберите заявку для просмотра деталей</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default VerificationRequests