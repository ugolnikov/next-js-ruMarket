"use client"
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApplicationLogo from '@/components/ApplicationLogo';
export default function WelcomeScreen({ onContinue }) {
  return (
    <AnimatePresence>
      <motion.div
        key="welcome-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
        className='min-h-[90vh] sm:min-h-[100vh]'
        style={{
          width: '100vw',
          background: 'url(/grass-bg.jpg) repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 10000
        }}
      >
        <motion.div
          className="rounded-lg shadow-lg p-10 flex flex-col items-center max-w-2xl w-full mx-4 border-4"
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderColor: '#4438ca',
            boxShadow: '0 8px 32px 0 rgba(68,56,202,0.15)'
          }}
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
        >
          <motion.p
            className="text-center mb-2"
            style={{ color: '#22223b' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            ГБПОУ "Пермский краевой колледж &laquo;ОНИКС&raquo;"
          </motion.p>
          <motion.h1
            className="text-3xl font-bold mb-4 text-center"
            style={{ color: '#4438ca' }}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Дипломный проект
          </motion.h1>
          <motion.p
            className="mb-2"
            style={{ color: '#22223b' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Маркетплейс <span className="font-bold" style={{ color: '#4438ca' }}>ruMarket</span>
          </motion.p>
          <ApplicationLogo
            alt="ruMarket"
            className="my-4"
            style={{ maxWidth: 220, maxHeight: 220 }}

          />
          
          <motion.p
            className="text-center mb-2"
            style={{ color: '#22223b' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            Разработчик: студент группы 2-ИС Угольников Даниил Олегович
          </motion.p>
          <motion.p
            className="text-center mb-4 text-sm"
            style={{ color: '#22223b' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
          >
            Специальность: 09.02.07 &laquo;Информационные системы и программирование&raquo;
          </motion.p>
          <motion.button
            onClick={onContinue}
            className="font-bold py-2 px-6 rounded mb-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition"
            style={{
              background: '#4438ca',
              color: '#fff',
              border: 'none',
              boxShadow: '0 2px 8px 0 rgba(34,197,94,0.10)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.07, backgroundColor: '#22c55e', color: '#fff' }}
            whileTap={{ scale: 0.97 }}
            transition={{ delay: 1.2, duration: 0.3 }}
          >
            Перейти
          </motion.button>
          <motion.p
            className="text-center mt-2 text-sm"
            style={{ color: '#4438ca' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.3 }}
          >
            Пермь, 2025
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 