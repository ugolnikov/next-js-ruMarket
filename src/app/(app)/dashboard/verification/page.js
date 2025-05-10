'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Button from '@/components/Button'
import Loader from '@/components/Loader'

const VerificationPage = () => {
    const router = useRouter()
    const { user, mutate } = useAuth({ middleware: 'auth' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    
    // Form state
    const [sellerType, setSellerType] = useState('individual')
    const [companyName, setCompanyName] = useState('')
    const [inn, setInn] = useState('')
    const [address, setAddress] = useState('')
    const [phone, setPhone] = useState(user?.phone || '')
    const [passportNumber, setPassportNumber] = useState('')
    const [passportIssuedBy, setPassportIssuedBy] = useState('')
    const [passportIssueDate, setPassportIssueDate] = useState('')
    
    // Validation errors
    const [errors, setErrors] = useState({
        phone: '',
        passportNumber: '',
        passportIssuedBy: '',
        passportIssueDate: '',
        companyName: '',
        inn: '',
        address: ''
    })
    
    // Load existing data if resubmitting
    useEffect(() => {
        if (user) {
            if (user.seller_type) {
                setSellerType(user.seller_type)
            }
            if (user.company_name) {
                setCompanyName(user.company_name)
            }
            if (user.inn) {
                setInn(user.inn)
            }
            if (user.address) {
                setAddress(user.address)
            }
            if (user.phone) {
                setPhone(user.phone)
            }
            if (user.passport_number) {
                setPassportNumber(user.passport_number)
            }
            if (user.passport_issued_by) {
                setPassportIssuedBy(user.passport_issued_by)
            }
            if (user.passport_issue_date) {
                // Format date for input field
                const date = new Date(user.passport_issue_date)
                if (!isNaN(date.getTime())) {
                    setPassportIssueDate(date.toISOString().split('T')[0])
                }
            }
        }
    }, [user])
    
    // Validate phone number
    const validatePhone = (value) => {
        const phoneRegex = /^\+?[0-9]{10,15}$/
        if (!value) {
            return 'Телефон обязателен'
        }
        if (!phoneRegex.test(value)) {
            return 'Введите корректный номер телефона (10-15 цифр)'
        }
        return ''
    }
    
    // Validate passport number
    const validatePassportNumber = (value) => {
        if (!value) {
            return 'Номер паспорта обязателен'
        }
        if (value.length < 6) {
            return 'Номер паспорта должен содержать не менее 6 символов'
        }
        return ''
    }
    
    // Validate passport issuer
    const validatePassportIssuedBy = (value) => {
        if (!value) {
            return 'Поле "Кем выдан" обязательно'
        }
        if (value.length < 3) {
            return 'Поле должно содержать не менее 3 символов'
        }
        return ''
    }
    
    // Validate passport issue date
    const validatePassportIssueDate = (value) => {
        if (!value) {
            return 'Дата выдачи обязательна'
        }
        
        const selectedDate = new Date(value)
        const today = new Date()
        
        if (isNaN(selectedDate.getTime())) {
            return 'Введите корректную дату'
        }
        
        if (selectedDate > today) {
            return 'Дата выдачи не может быть в будущем'
        }
        
        const minDate = new Date()
        minDate.setFullYear(minDate.getFullYear() - 100)
        
        if (selectedDate < minDate) {
            return 'Дата выдачи слишком давняя'
        }
        
        return ''
    }
    
    // Validate company name
    const validateCompanyName = (value) => {
        if (!value) {
            return 'Название компании обязательно'
        }
        if (value.length < 2) {
            return 'Название компании должно содержать не менее 2 символов'
        }
        return ''
    }
    
    // Validate INN
    const validateInn = (value) => {
        const innRegex = /^[0-9]{10,12}$/
        if (!value) {
            return 'ИНН обязателен'
        }
        if (!innRegex.test(value)) {
            return 'ИНН должен содержать 10-12 цифр'
        }
        return ''
    }
    
    // Validate address
    const validateAddress = (value) => {
        if (!value) {
            return 'Адрес обязателен'
        }
        if (value.length < 5) {
            return 'Адрес должен содержать не менее 5 символов'
        }
        return ''
    }
    
    // Validate all fields
    const validateForm = () => {
        const newErrors = {
            phone: validatePhone(phone),
            passportNumber: sellerType === 'individual' ? validatePassportNumber(passportNumber) : '',
            passportIssuedBy: sellerType === 'individual' ? validatePassportIssuedBy(passportIssuedBy) : '',
            passportIssueDate: sellerType === 'individual' ? validatePassportIssueDate(passportIssueDate) : '',
            companyName: sellerType === 'company' ? validateCompanyName(companyName) : '',
            inn: sellerType === 'company' ? validateInn(inn) : '',
            address: sellerType === 'company' ? validateAddress(address) : ''
        }
        
        setErrors(newErrors)
        
        // Check if there are any errors
        return !Object.values(newErrors).some(error => error !== '')
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        try {
            // Validate form
            if (!validateForm()) {
                setLoading(false)
                return
            }
            
            // Format date properly for ISO-8601 DateTime
            let formattedDate = null
            if (passportIssueDate) {
                // Ensure the date is in the correct format with time component
                const date = new Date(passportIssueDate)
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toISOString()
                }
            }
            
            // Prepare data for API
            const verificationData = {
                role: 'seller',
                seller_type: sellerType,
                phone,
                // Include fields based on seller type
                ...(sellerType === 'individual' 
                    ? {
                        passport_number: passportNumber,
                        passport_issued_by: passportIssuedBy,
                        passport_issue_date: formattedDate,
                        // Clear company fields if switching to individual
                        company_name: null,
                        inn: null,
                        address: null
                    } 
                    : {
                        company_name: companyName,
                        inn,
                        address,
                        // Clear passport fields if switching to company
                        passport_number: null,
                        passport_issued_by: null,
                        passport_issue_date: null
                    }
                )
            }
            
            // Submit verification request
            await axios.put(`/api/dashboard/${user.id}`, verificationData)
            
            setSuccess(true)
            mutate() // Update user data
            
            // Redirect after short delay
            router.push('/dashboard')
            
        } catch (error) {
            console.error('Verification error:', error)
            setError(error.response?.data?.error || 'Произошла ошибка при отправке заявки')
        } finally {
            setLoading(false)
        }
    }
    
    // Redirect if user is already a seller and verified
    useEffect(() => {
        if (user && user.role === 'seller' && user.is_verify) {
            router.push('/dashboard')
        }
    }, [user, router])
    
    if (!user) return <Loader />
    
    // Show different title based on verification status
    const getPageTitle = () => {
        if (user.verification_status === 'rejected') {
            return 'Повторная подача заявки на верификацию'
        }
        return 'Верификация продавца'
    }
    
    return (
        <>
            <Header title={getPageTitle()} />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-[#4438ca] mb-6">
                                {getPageTitle()}
                            </h2>
                            
                            {user.verification_status === 'rejected' && (
                                <div className="bg-red-50 p-4 rounded-md mb-6">
                                    <p className="text-red-700">
                                        <strong>Причина отклонения:</strong> {user.verification_rejection_reason || 'Не указана'}
                                    </p>
                                    <p className="text-red-700 mt-2">
                                        Пожалуйста, исправьте указанные проблемы и отправьте заявку повторно.
                                    </p>
                                </div>
                            )}
                            
                            {user.verification_status === 'pending' && (
                                <div className="bg-yellow-50 p-4 rounded-md mb-6">
                                    <p className="text-yellow-700">
                                        У вас уже есть заявка на рассмотрении. Пожалуйста, дождитесь решения администратора.
                                    </p>
                                    <div className="mt-4">
                                        <Button
                                            onClick={() => router.push('/dashboard')}
                                            className="bg-[#4438ca] hover:bg-[#3a30b0]"
                                        >
                                            Вернуться в личный кабинет
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            {success ? (
                                <div className="bg-green-50 p-4 rounded-md mb-6">
                                    <p className="text-green-700">
                                        Ваша заявка на верификацию успешно отправлена! Ожидайте рассмотрения администратором.
                                    </p>
                                </div>
                            ) : (
                                user.verification_status !== 'pending' && (
                                    <form onSubmit={handleSubmit}>
                                        {error && (
                                            <div className="bg-red-50 p-4 rounded-md mb-6">
                                                <p className="text-red-700">{error}</p>
                                            </div>
                                        )}
                                        
                                        <div className="mb-6">
                                            <label className="block text-gray-700 font-bold mb-2">
                                                Тип продавца
                                            </label>
                                            <div className="flex gap-4">
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="form-radio text-[#4438ca]"
                                                        name="sellerType"
                                                        value="individual"
                                                        checked={sellerType === 'individual'}
                                                        onChange={() => setSellerType('individual')}
                                                    />
                                                    <span className="ml-2">Физическое лицо</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="form-radio text-[#4438ca]"
                                                        name="sellerType"
                                                        value="company"
                                                        checked={sellerType === 'company'}
                                                        onChange={() => setSellerType('company')}
                                                    />
                                                    <span className="ml-2">Юридическое лицо</span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-6">
                                            <label className="block text-gray-700 font-bold mb-2">
                                                Телефон *
                                            </label>
                                            <input
                                                type="tel"
                                                className={`border-gray-300 focus:border-[#4438ca] focus:ring-[#4438ca] rounded-md shadow-sm w-full ${errors.phone ? 'border-red-500' : ''}`}
                                                placeholder="+7XXXXXXXXXX"
                                                value={phone}
                                                onChange={(e) => {
                                                    setPhone(e.target.value)
                                                    setErrors({...errors, phone: validatePhone(e.target.value)})
                                                }}
                                            />
                                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                        </div>
                                        
                                        {sellerType === 'individual' ? (
                                            <>
                                                <div className="mb-6">
                                                    <label className="block text-gray-700 font-bold mb-2">
                                                        Номер паспорта *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`border-gray-300 focus:border-[#4438ca] focus:ring-[#4438ca] rounded-md shadow-sm w-full ${errors.passportNumber ? 'border-red-500' : ''}`}
                                                        placeholder="XXXX XXXXXX"
                                                        value={passportNumber}
                                                        onChange={(e) => {
                                                            setPassportNumber(e.target.value)
                                                            setErrors({...errors, passportNumber: validatePassportNumber(e.target.value)})
                                                        }}
                                                    />
                                                    {errors.passportNumber && <p className="text-red-500 text-sm mt-1">{errors.passportNumber}</p>}
                                                </div>
                                                
                                                <div className="mb-6">
                                                    <label className="block text-gray-700 font-bold mb-2">
                                                        Кем выдан *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`border-gray-300 focus:border-[#4438ca] focus:ring-[#4438ca] rounded-md shadow-sm w-full ${errors.passportIssuedBy ? 'border-red-500' : ''}`}
                                                        placeholder="Кем выдан паспорт"
                                                        value={passportIssuedBy}
                                                        onChange={(e) => {
                                                            setPassportIssuedBy(e.target.value)
                                                            setErrors({...errors, passportIssuedBy: validatePassportIssuedBy(e.target.value)})
                                                        }}
                                                    />
                                                    {errors.passportIssuedBy && <p className="text-red-500 text-sm mt-1">{errors.passportIssuedBy}</p>}
                                                </div>
                                                
                                                <div className="mb-6">
                                                    <label className="block text-gray-700 font-bold mb-2">
                                                        Дата выдачи *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className={`border-gray-300 focus:border-[#4438ca] focus:ring-[#4438ca] rounded-md shadow-sm w-full ${errors.passportIssueDate ? 'border-red-500' : ''}`}
                                                        value={passportIssueDate}
                                                        onChange={(e) => {
                                                            setPassportIssueDate(e.target.value)
                                                            setErrors({...errors, passportIssueDate: validatePassportIssueDate(e.target.value)})
                                                        }}
                                                    />
                                                    {errors.passportIssueDate && <p className="text-red-500 text-sm mt-1">{errors.passportIssueDate}</p>}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="mb-6">
                                                    <label className="block text-gray-700 font-bold mb-2">
                                                        Название компании *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`border-gray-300 focus:border-[#4438ca] focus:ring-[#4438ca] rounded-md shadow-sm w-full ${errors.companyName ? 'border-red-500' : ''}`}
                                                        placeholder="ООО 'Компания'"
                                                        value={companyName}
                                                        onChange={(e) => {
                                                            setCompanyName(e.target.value)
                                                            setErrors({...errors, companyName: validateCompanyName(e.target.value)})
                                                        }}
                                                    />
                                                    {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                                                </div>
                                                
                                                <div className="mb-6">
                                                    <label className="block text-gray-700 font-bold mb-2">
                                                        ИНН *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`border-gray-300 focus:border-[#4438ca] focus:ring-[#4438ca] rounded-md shadow-sm w-full ${errors.inn ? 'border-red-500' : ''}`}
                                                        placeholder="XXXXXXXXXX"
                                                        value={inn}
                                                        onChange={(e) => {
                                                            setInn(e.target.value)
                                                            setErrors({...errors, inn: validateInn(e.target.value)})
                                                        }}
                                                    />
                                                    {errors.inn && <p className="text-red-500 text-sm mt-1">{errors.inn}</p>}
                                                </div>
                                                
                                                <div className="mb-6">
                                                    <label className="block text-gray-700 font-bold mb-2">
                                                        Юридический адрес *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`border-gray-300 focus:border-[#4438ca] focus:ring-[#4438ca] rounded-md shadow-sm w-full ${errors.address ? 'border-red-500' : ''}`}
                                                        placeholder="Адрес компании"
                                                        value={address}
                                                        onChange={(e) => {
                                                            setAddress(e.target.value)
                                                            setErrors({...errors, address: validateAddress(e.target.value)})
                                                        }}
                                                    />
                                                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                className="rounded mr-4 bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                onClick={() => router.push('/dashboard')}
                                                disabled={loading}
                                            >
                                                Отмена
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-[#4438ca] hover:bg-[#3a30b0] rounded"
                                                disabled={loading}
                                            >
                                                {loading ? 'Отправка...' : 'Отправить заявку'}
                                            </Button>
                                        </div>
                                    </form>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default VerificationPage