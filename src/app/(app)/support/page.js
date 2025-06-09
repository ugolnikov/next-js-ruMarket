"use client"
import Header from '@/components/Header'
import React, { useState } from 'react'


export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('')
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setStatus('Ваше сообщение отправлено! Мы свяжемся с вами в ближайшее время.')
      setForm({ name: '', email: '', message: '' })
    } else {
      setStatus('Ошибка отправки. Попробуйте позже.')
    }
  }

  return (
    <>
      <Header title="Поддержка" />
      <div className="max-w-xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white/80 rounded-lg shadow p-8 border border-[#4438ca]/10 space-y-6">
          <div>
            <label className="block text-[#4438ca] font-semibold mb-2">Ваше имя</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4438ca]"
            />
          </div>
          <div>
            <label className="block text-[#4438ca] font-semibold mb-2">Email для связи</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4438ca]"
            />
          </div>
          <div>
            <label className="block text-[#4438ca] font-semibold mb-2">Сообщение</label>
            <textarea
              name="message"
              required
              rows={5}
              value={form.message}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4438ca]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#4438ca] text-white font-bold py-2 px-4 rounded hover:bg-[#362fa0] transition"
          >
            Отправить
          </button>
          {status && <div className="text-center text-[#4438ca] mt-4">{status}</div>}
        </form>
      </div>
    </>
  )
} 