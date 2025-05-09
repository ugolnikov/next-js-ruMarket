'use client'
import { useState } from 'react'
import Button from '@/components/Button'

const CardPaymentForm = ({ amount, onPaymentSuccess, onCancel }) => {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  })
  const [errors, setErrors] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    // Format card number with spaces every 4 digits
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      formattedValue = formattedValue.substring(0, 19) // Limit to 16 digits + 3 spaces
    }

    // Format expiry date as MM/YY
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length > 2) {
        formattedValue = `${formattedValue.substring(0, 2)}/${formattedValue.substring(2, 4)}`
      }
    }

    // Limit CVV to 3 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3)
    }

    setCardData({ ...cardData, [name]: formattedValue })
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Введите 16-значный номер карты'
    }
    
    if (!cardData.cardHolder) {
      newErrors.cardHolder = 'Введите имя держателя карты'
    }
    
    if (!cardData.expiryDate || !cardData.expiryDate.includes('/')) {
      newErrors.expiryDate = 'Введите дату в формате ММ/ГГ'
    } else {
      const [month, year] = cardData.expiryDate.split('/')
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Неверный месяц'
      }
    }
    
    if (!cardData.cvv || cardData.cvv.length !== 3) {
      newErrors.cvv = 'Введите 3-значный CVV код'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsProcessing(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate a random payment ID
      const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      // Call the success callback with the payment ID
      onPaymentSuccess(paymentId)
    } catch (error) {
      console.error('Payment error:', error)
      setErrors({ form: 'Ошибка обработки платежа. Пожалуйста, попробуйте снова.' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Оплата банковской картой</h2>
      <p className="text-gray-600 mb-4">Сумма к оплате: {amount.toLocaleString('ru-RU')} ₽</p>
      
      {errors.form && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardNumber">
            Номер карты
          </label>
          <input
            id="cardNumber"
            name="cardNumber"
            type="text"
            placeholder="0000 0000 0000 0000"
            value={cardData.cardNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isProcessing}
          />
          {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardHolder">
            Имя держателя карты
          </label>
          <input
            id="cardHolder"
            name="cardHolder"
            type="text"
            placeholder="IVAN IVANOV"
            value={cardData.cardHolder}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.cardHolder ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isProcessing}
          />
          {errors.cardHolder && <p className="text-red-500 text-xs mt-1">{errors.cardHolder}</p>}
        </div>
        
        <div className="flex space-x-4 mb-4">
          <div className="w-1/2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expiryDate">
              Срок действия
            </label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="text"
              placeholder="MM/YY"
              value={cardData.expiryDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isProcessing}
            />
            {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
          </div>
          
          <div className="w-1/2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cvv">
              CVV
            </label>
            <input
              id="cvv"
              name="cvv"
              type="text"
              placeholder="123"
              value={cardData.cvv}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.cvv ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isProcessing}
            />
            {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
            disabled={isProcessing}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            className="bg-[#4438ca] hover:bg-[#19144d] rounded text-center"
            disabled={isProcessing}
          >
            {isProcessing ? 'Обработка...' : 'Оплатить'}
          </Button>
        </div>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Это тестовая форма оплаты. Никакие реальные платежи не будут обработаны.</p>
        <p>Для тестирования используйте любые данные карты в правильном формате.</p>
      </div>
    </div>
  )
}

export default CardPaymentForm