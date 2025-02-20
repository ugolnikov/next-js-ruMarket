'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/auth'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Button from '@/components/Button'
import Image from 'next/image'
import Header from '@/components/Header'
import { useSession } from 'next-auth/react' // Add this import at the top

const ProfileConfirmation = () => {
    const router = useRouter()
    const { user } = useAuth({ middleware: 'auth' })
    const { update } = useSession() // Add this line
    const [logoFile, setLogoFile] = useState(null)
    const [profile, setProfile] = useState({
        company_name: user?.company_name || '',
        inn: user?.inn || '',
        address: user?.address || '',
        phone: user?.phone || '',
        logo: user?.logo || '',
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

            // Валидация обязательных полей
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

            // Подготовка данных
            const payload = {
                ...profile,
                inn: profile.inn.trim(), // Убираем пробелы, оставляем как строку
                role: 'seller',
                is_verify: true
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

            setSuccess('Профиль успешно обновлен')
            await update()
            router.push('/dashboard')
        } catch (error) {
            console.error('Детали ошибки:', error.response?.data)
            setErrors({
                general: error.response?.data?.error || 
                        'Ошибка сервера при обновлении профиля'
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
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* ИНН field with validation button */}
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
                                {/* Existing fields */}
                                {/* ... rest of your form fields ... */}
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !isINNVerified}>
                                        {isSubmitting ? 'Сохранение...' : 'Подтвердить и стать продавцом'}
                                    </Button>
                                </div>
                                {success && (
                                    <p className="mt-2 text-sm text-green-600">{success}</p>
                                )}
                                {errors.general && (
                                    <p className="mt-2 text-sm text-red-600">{errors.general}</p>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProfileConfirmation
