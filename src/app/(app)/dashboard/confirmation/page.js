'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/auth'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Button from '@/components/Button'
import Image from 'next/image'
import Header from '@/components/Header'
import { useSession } from 'next-auth/react'

const ProfileConfirmation = () => {
    const router = useRouter()
    const { user } = useAuth({ middleware: 'auth' })
    const { update } = useSession()
    const [logoFile, setLogoFile] = useState(null)
    const [sellerType, setSellerType] = useState('company') // 'company' or 'individual'
    const [profile, setProfile] = useState({
        company_name: user?.company_name || '',
        inn: user?.inn || '',
        address: user?.address || '',
        phone: user?.phone || '',
        logo: user?.logo || '',
        passport_number: user?.passport_number || '',
        passport_issued_by: user?.passport_issued_by || '',
        passport_issue_date: user?.passport_issue_date ? new Date(user.passport_issue_date).toISOString().split('T')[0] : '',
        verification_documents: user?.verification_documents || [],
    })
    const [companyData, setCompanyData] = useState(null)
    const [errors, setErrors] = useState({})
    const [success, setSuccess] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [logoError, setLogoError] = useState('')
    const [logoSuccess, setLogoSuccess] = useState('')
    const [isINNVerified, setIsINNVerified] = useState(false)
    const [isCheckingINN, setIsCheckingINN] = useState(false)
    const [isLogoUploaded, setIsLogoUploaded] = useState(!!user?.logo)
    const [documents, setDocuments] = useState([])
    const [uploadingDocuments, setUploadingDocuments] = useState(false)

    useEffect(() => {
        if (user?.verification_status === 'pending') {
            setSuccess('Ваша заявка на верификацию находится на рассмотрении')
        } else if (user?.verification_status === 'rejected') {
            setErrors({
                general: `Ваша заявка была отклонена: ${user.verification_rejection_reason || 'Причина не указана'}`
            })
        }
    }, [user])

    // Add INN validation function
    const validateINN = async () => {
        setIsCheckingINN(true)
        setErrors({})
        
        try {
            const response = await axios.post('/api/validate/inn', {
                inn: profile.inn
            })
            
            setCompanyData(response.data)
            setProfile(prev => ({
                ...prev,
                company_name: response.data.name,
                address: response.data.address
            }))
            setIsINNVerified(true)
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                inn: error.response?.data?.error || 'Ошибка проверки ИНН'
            }))
            setIsINNVerified(false)
        } finally {
            setIsCheckingINN(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setProfile(prev => ({
            ...prev,
            [name]: value
        }))
        
        // Reset INN verification if INN is changed
        if (name === 'inn') {
            setIsINNVerified(false)
            setCompanyData(null)
        }
    }

    const handleDocumentUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setUploadingDocuments(true)
        setErrors({})

        try {
            // Here you would implement document upload to your storage
            // For example, using Supabase storage or another service
            // This is a placeholder for the actual implementation
            const uploadedUrls = await Promise.all(
                files.map(async (file) => {
                    // Mock upload - replace with actual upload code
                    return URL.createObjectURL(file)
                })
            )

            setDocuments(prev => [...prev, ...uploadedUrls])
            setProfile(prev => ({
                ...prev,
                verification_documents: [...(prev.verification_documents || []), ...uploadedUrls]
            }))
        } catch (error) {
            console.error('Error uploading documents:', error)
            setErrors(prev => ({
                ...prev,
                documents: 'Ошибка при загрузке документов'
            }))
        } finally {
            setUploadingDocuments(false)
        }
    }

    const handleSubmit = async e => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrors({})
        setSuccess('')

        try {
            // Добавляем проверку наличия user.id
            if (!user?.id) {
                setErrors({ general: 'Пользователь не авторизован' })
                return
            }

            // Validate based on seller type
            if (sellerType === 'company') {
                // Проверка формата ИНН
                if (!/^\d{10,12}$/.test(profile.inn)) {
                    setErrors({ inn: 'Некорректный формат ИНН' })
                    return
                }

                // Проверка верификации ИНН
                if (!isINNVerified) {
                    setErrors({ inn: 'Необходимо проверить ИНН' })
                    return
                }

                // Валидация обязательных полей для компании
                const requiredFields = {
                    company_name: 'Название компании',
                    inn: 'ИНН',
                    address: 'Адрес'
                }

                const missingFields = Object.entries(requiredFields)
                    .filter(([key]) => !profile[key])
                    .map(([_, value]) => value)

                if (missingFields.length > 0) {
                    setErrors({
                        general: `Заполните обязательные поля: ${missingFields.join(', ')}`
                    })
                    return
                }
            } else {
                // Валидация обязательных полей для физ. лица
                const requiredFields = {
                    passport_number: 'Номер паспорта',
                    passport_issued_by: 'Кем выдан',
                    passport_issue_date: 'Дата выдачи',
                    address: 'Адрес',
                    phone: 'Телефон'
                }

                const missingFields = Object.entries(requiredFields)
                    .filter(([key]) => !profile[key])
                    .map(([_, value]) => value)

                if (missingFields.length > 0) {
                    setErrors({
                        general: `Заполните обязательные поля: ${missingFields.join(', ')}`
                    })
                    return
                }
            }

            // Check for verification documents
            if (!profile.verification_documents || profile.verification_documents.length === 0) {
                setErrors({
                    documents: 'Необходимо загрузить документы для верификации'
                })
                return
            }

            // Подготовка данных
            const payload = {
                ...profile,
                seller_type: sellerType,
                role: 'seller', // This will be set to 'pending' on the server
                verification_status: 'pending'
            }

            // Отправка данных
            const response = await axios.put(
                `/api/dashboard/${user.id}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (response.data.signOut) {
                router.push('/login')
                return
            }

            setSuccess('Ваша заявка на верификацию отправлена и ожидает рассмотрения администратором')
            await update()
        } catch (error) {
            console.error('Детали ошибки:', error.response?.data)
            setErrors({
                general: error.response?.data?.error || 
                        'Ошибка сервера при отправке заявки'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Header title="Верификация продавца" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {user?.verification_status === 'pending' ? (
                                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                                    <h3 className="text-lg font-medium text-yellow-800">Заявка на рассмотрении</h3>
                                    <p className="mt-2 text-yellow-700">
                                        Ваша заявка на верификацию находится на рассмотрении администратором. 
                                        Мы свяжемся с вами после проверки документов.
                                    </p>
                                </div>
                            ) : user?.verification_status === 'rejected' ? (
                                <div className="bg-red-50 p-4 rounded-lg mb-6">
                                    <h3 className="text-lg font-medium text-red-800">Заявка отклонена</h3>
                                    <p className="mt-2 text-red-700">
                                        Ваша заявка была отклонена: {user.verification_rejection_reason || 'Причина не указана'}
                                    </p>
                                    <p className="mt-2 text-red-700">
                                        Вы можете отправить новую заявку, исправив указанные проблемы.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Тип продавца
                                        </label>
                                        <div className="flex space-x-4">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    name="seller_type"
                                                    value="company"
                                                    checked={sellerType === 'company'}
                                                    onChange={() => setSellerType('company')}
                                                    className="form-radio h-4 w-4 text-indigo-600"
                                                />
                                                <span className="ml-2">Юридическое лицо</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    name="seller_type"
                                                    value="individual"
                                                    checked={sellerType === 'individual'}
                                                    onChange={() => setSellerType('individual')}
                                                    className="form-radio h-4 w-4 text-indigo-600"
                                                />
                                                <span className="ml-2">Физическое лицо</span>
                                            </label>
                                        </div>
                                    </div>

                                    {sellerType === 'company' ? (
                                        <>
                                            {/* Company fields */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    ИНН организации
                                                </label>
                                                <div className="mt-1 flex space-x-2">
                                                    <input
                                                        type="text"
                                                        name="inn"
                                                        value={profile.inn}
                                                        onChange={handleChange}
                                                        disabled={isINNVerified}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        pattern="\d{10}|\d{12}"
                                                        title="ИНН должен содержать 10 или 12 цифр"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={validateINN}
                                                        disabled={isCheckingINN || isINNVerified}
                                                        className="whitespace-nowrap">
                                                        {isCheckingINN ? 'Проверка...' : 'Проверить ИНН'}
                                                    </Button>
                                                </div>
                                                {errors.inn && (
                                                    <p className="mt-2 text-sm text-red-600">{errors.inn}</p>
                                                )}
                                            </div>

                                            {/* Company details after INN verification */}
                                            {isINNVerified && companyData && (
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold mb-2">Данные организации:</h4>
                                                    <div className="space-y-2">
                                                        <p>Название: {companyData.name}</p>
                                                        <p>ИНН: {companyData.inn}</p>
                                                        {companyData.kpp && <p>КПП: {companyData.kpp}</p>}
                                                        <p>Адрес: {companyData.address}</p>
                                                        {companyData.management_name && (
                                                            <p>Руководитель: {companyData.management_name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Название компании
                                                </label>
                                                <input
                                                    type="text"
                                                    name="company_name"
                                                    value={profile.company_name}
                                                    onChange={handleChange}
                                                    disabled={isINNVerified}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Individual fields */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Номер паспорта
                                                </label>
                                                <input
                                                    type="text"
                                                    name="passport_number"
                                                    value={profile.passport_number}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="Серия и номер паспорта"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Кем выдан
                                                </label>
                                                <input
                                                    type="text"
                                                    name="passport_issued_by"
                                                    value={profile.passport_issued_by}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="Орган, выдавший паспорт"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Дата выдачи
                                                </label>
                                                <input
                                                    type="date"
                                                    name="passport_issue_date"
                                                    value={profile.passport_issue_date}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Common fields for both types */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Адрес
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={profile.address}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="Полный адрес"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Телефон
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="+7 (XXX) XXX-XX-XX"
                                        />
                                    </div>

                                    {/* Document upload section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Документы для верификации
                                        </label>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {sellerType === 'company' 
                                                ? 'Загрузите документы компании (свидетельство о регистрации, выписка из ЕГРЮЛ и т.д.)' 
                                                : 'Загрузите скан паспорта (разворот с фото и страница с регистрацией)'}
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleDocumentUpload}
                                            className="mt-1 block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-md file:border-0
                                                file:text-sm file:font-medium
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100"
                                        />
                                        {uploadingDocuments && (
                                            <p className="mt-2 text-sm text-gray-600">Загрузка документов...</p>
                                        )}
                                        {errors.documents && (
                                            <p className="mt-2 text-sm text-red-600">{errors.documents}</p>
                                        )}
                                        
                                        {/* Preview uploaded documents */}
                                        {documents.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Загруженные документы:</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {documents.map((doc, index) => (
                                                        <div key={index} className="relative">
                                                            <div className="h-24 w-full bg-gray-100 rounded-md flex items-center justify-center">
                                                                <Image 
                                                                    src={doc} 
                                                                    alt={`Document ${index + 1}`} 
                                                                    width={100} 
                                                                    height={100} 
                                                                    className="object-contain h-full"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newDocs = [...documents];
                                                                    newDocs.splice(index, 1);
                                                                    setDocuments(newDocs);
                                                                    setProfile(prev => ({
                                                                        ...prev,
                                                                        verification_documents: newDocs
                                                                    }));
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Logo upload section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Логотип {sellerType === 'company' ? 'компании' : 'продавца'} (необязательно)
                                        </label>
                                        <div className="mt-1 flex items-center space-x-4">
                                            <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md overflow-hidden">
                                                {profile.logo ? (
                                                    <Image
                                                        src={profile.logo}
                                                        alt="Logo"
                                                        width={64}
                                                        height={64}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setLogoFile(e.target.files[0]);
                                                        // Here you would typically upload the logo
                                                        // For now, just create a local URL
                                                        const logoUrl = URL.createObjectURL(e.target.files[0]);
                                                        setProfile(prev => ({
                                                            ...prev,
                                                            logo: logoUrl
                                                        }));
                                                    }
                                                }}
                                                className="text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-md file:border-0
                                                    file:text-sm file:font-medium
                                                    file:bg-indigo-50 file:text-indigo-700
                                                    hover:file:bg-indigo-100"
                                            />
                                        </div>
                                        {logoError && (
                                            <p className="mt-2 text-sm text-red-600">{logoError}</p>
                                        )}
                                        {logoSuccess && (
                                            <p className="mt-2 text-sm text-green-600">{logoSuccess}</p>
                                        )}
                                    </div>

                                    {/* Error and success messages */}
                                    {errors.general && (
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <p className="text-sm text-red-700">{errors.general}</p>
                                        </div>
                                    )}
                                    
                                    {success && (
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-green-700">{success}</p>
                                        </div>
                                    )}

                                    {/* Submit button */}
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="ml-3">
                                            {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProfileConfirmation
