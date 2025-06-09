import React from 'react'
import Header from '@/components/Header'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function handleClose(id) {
  'use server'
  await prisma.supportTicket.update({
    where: { id },
    data: { status: 'closed' },
  })
  revalidatePath('/admin/support')
}

async function handleDelete(id) {
  'use server'
  await prisma.supportTicket.delete({
    where: { id },
  })
  revalidatePath('/admin/support')
}

export default async function AdminSupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <Header title="Обращения в поддержку" />
      <div className="bg-white/90 rounded-lg shadow p-6 border border-[#4438ca]/10 mt-6">
        <h2 className="text-2xl font-bold text-[#4438ca] mb-6">Список обращений</h2>
        {tickets.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-lg">Пока нет обращений</div>
        ) : (
          <div className="overflow-x-auto animate-fade-in">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#4438ca]/90">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Сообщение</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#f3f4fa] transition">
                    <td className="px-4 py-3 font-mono text-[#4438ca]">{ticket.id}</td>
                    <td className="px-4 py-3">{ticket.name}</td>
                    <td className="px-4 py-3 text-blue-700 underline"><a href={`mailto:${ticket.email}`}>{ticket.email}</a></td>
                    <td className="px-4 py-3 max-w-xs truncate" title={ticket.message}>{ticket.message}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(ticket.createdAt).toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{ticket.status === 'open' ? 'Открыто' : 'Закрыто'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {ticket.status === 'open' && (
                          <form action={async () => { 'use server'; await handleClose(ticket.id) }}>
                            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold transition">Закрыть</button>
                          </form>
                        )}
                        <form action={async () => { 'use server'; await handleDelete(ticket.id) }}>
                          <button type="submit" className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-bold transition">Удалить</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 