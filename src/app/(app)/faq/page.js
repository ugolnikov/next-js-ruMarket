import Header from '@/components/Header'
import React from 'react'

export const metadata = {
  title: 'FAQ — Часто задаваемые вопросы',
  description: 'Ответы на популярные вопросы о работе маркетплейса ruMarket',
}

const faqs = [
  {
    question: 'Как купить товар на ruMarket?',
    answer:
      'Выберите нужный товар, добавьте его в корзину и оформите заказ. После оплаты продавец отправит вам товар, а вы сможете отслеживать статус заказа в личном кабинете.',
  },
  {
    question: 'Как стать продавцом?',
    answer:
      'Зарегистрируйтесь, перейдите в личный кабинет и подайте заявку на получение статуса продавца. После одобрения вы сможете публиковать свои товары.',
  },
  {
    question: 'Какая комиссия взимается с продавцов?',
    answer:
      'Размер комиссии устанавливается администрацией и отображается при оформлении заказа. Актуальную ставку можно узнать на странице оформления заказа или в разделе настроек.',
  },
  {
    question: 'Как связаться с поддержкой?',
    answer:
      'Вы можете воспользоваться формой обратной связи на странице "Поддержка" или написать нам в соц. сети, указанную внизу сайта.',
  },
  {
    question: 'Безопасно ли покупать на ruMarket?',
    answer:
      'Мы используем современные методы защиты данных и проверяем продавцов. Все платежи проходят через защищённые каналы.',
  },
]

export default function FAQPage() {
  return (
    <>
    <Header title="FAQ — Часто задаваемые вопросы" />
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white/80 rounded-lg shadow p-6 border border-[#4438ca]/10">
            <h2 className="text-xl font-semibold text-[#4438ca] mb-2">{faq.question}</h2>
            <p className="text-gray-800 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
    </>
  )
} 