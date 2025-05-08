'use client'
import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const UsersManagement = () => {
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState({})
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get('/api/admin/users')
            console.log(response.data)
            setUsers(response.data)
        } catch (err) {
            console.error('Error fetching users:', err)
            setError('Не удалось загрузить пользователей')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (user) => {
        setEditingUser(user.id)
        setFormData({
            name: user.name,
            email: user.email,
            company_name: user.company_name,
            role: user.role,
            is_verify: user.is_verify,
            is_admin: user.is_admin
        })
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSave = async () => {
        try {
            await axios.put(`/api/admin/users/${editingUser}`, formData)
            setEditingUser(null)
            fetchUsers()
        } catch (err) {
            console.error('Error updating user:', err)
            alert('Не удалось обновить пользователя')
        }
    }

    const handleDelete = async (userId) => {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return
        
        try {
            await axios.delete(`/api/admin/users/${userId}`)
            fetchUsers()
        } catch (err) {
            console.error('Error deleting user:', err)
            alert('Не удалось удалить пользователя')
        }
    }

    const handleCancel = () => {
        setEditingUser(null)
    }

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold mb-8">Управление пользователями</h1>
            
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Поиск пользователей..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Компания</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Верификация</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Админ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name || ''}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
                                            />
                                        ) : (
                                            user.name
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email || ''}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
                                            />
                                        ) : (
                                            user.email
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <select
                                                name="role"
                                                value={formData.role || 'customer'}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
                                            >
                                                <option value="customer">Покупатель</option>
                                                <option value="seller">Продавец</option>
                                                <option value="admin">Администратор</option>
                                            </select>
                                        ) : (
                                            getRoleText(user.role)
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <input
                                                type="text"
                                                name="company_name"
                                                value={formData.company_name || ''}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
                                            >
                                            </input>
                                        ) : (
                                            user.company_name || '-'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <input
                                                type="checkbox"
                                                name="is_verify"
                                                checked={formData.is_verify || false}
                                                onChange={handleChange}
                                                className="h-4 w-4"
                                            />
                                        ) : (
                                            user.is_verify ? 'Да' : 'Нет'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <input
                                                type="checkbox"
                                                name="is_admin"
                                                checked={formData.is_admin || false}
                                                onChange={handleChange}
                                                className="h-4 w-4"
                                            />
                                        ) : (
                                            user.is_admin ? 'Да' : 'Нет'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleSave}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <CheckIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
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
        </div>
    )
}

const getRoleText = (role) => {
    switch (role) {
        case 'customer':
            return 'Покупатель'
        case 'seller':
            return 'Продавец'
        case 'admin':
            return 'Администратор'
        default:
            return role
    }
}

export default UsersManagement