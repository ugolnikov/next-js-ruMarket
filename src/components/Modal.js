import { useEffect } from 'react'
import Button from './Button'
import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({ isOpen, onClose, title, children, onConfirm, actionType = 'delete' }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose()
        }
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className="fixed inset-0 bg-black opacity-40"
                        onClick={onClose} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        className="relative bg-white rounded-lg shadow-xl max-w-lg w-full transform -translate-y-1/2 -translate-x-1/2 p-6"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    >
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
                        <div className="mt-2">{children}</div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <motion.button 
                                onClick={onClose} 
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Отмена
                            </motion.button>
                            {onConfirm && (
                                <motion.button 
                                    onClick={onConfirm} 
                                    className={`font-medium py-2 px-4 rounded ${
                                        actionType === 'delete' 
                                            ? 'bg-red-500 hover:bg-red-600' 
                                            : actionType === 'publish'
                                                ? 'bg-green-500 hover:bg-green-600'
                                                : 'bg-red-500 hover:bg-red-600'
                                    } text-white`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Подтвердить
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 