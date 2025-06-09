"use client"
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import Loader from "@/components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import Header from "@/components/Header";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, color, icon, change }) => (
  <motion.div
    className="bg-white rounded-lg shadow p-6 flex flex-col items-start"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className={`mb-2 text-2xl ${color}`}>{icon}</div>
    <div className="text-gray-500 text-sm mb-1">{title}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    {typeof change === "number" && (
      <div className={`mt-1 text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
        {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
      </div>
    )}
  </motion.div>
);

export default function SalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "seller") {
      router.push("/login");
      return;
    }
    fetchOrders();
    // eslint-disable-next-line
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seller/orders");
      if (!res.ok) throw new Error("Ошибка загрузки продаж");
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Фильтруем только завершённые продажи (статус заказа 'completed')
  const completedItems = useMemo(() => {
    if (!orders.length) return [];
    let items = [];
    orders.forEach(order => {
      if (order.status === 'completed') {
        order.items.forEach(item => {
          items.push({
            id: item.id,
            orderId: order.id,
            createdAt: order.createdAt,
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            is_send: item.is_send,
            status: order.status
          });
        });
      }
    });
    return items;
  }, [orders]);

  // Статистика
  const stats = useMemo(() => {
    if (!completedItems.length) return null;
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItems = 0;
    let dates = {};
    completedItems.forEach((item) => {
      totalOrders++;
      totalRevenue += item.price * item.quantity;
      totalItems += item.quantity;
      const date = item.createdAt.slice(0, 10);
      dates[date] = (dates[date] || 0) + item.price * item.quantity;
    });
    const averageOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
    return { totalRevenue, totalOrders, totalItems, averageOrder, dates };
  }, [completedItems]);

  // Данные для графика
  const chartData = useMemo(() => {
    if (!stats) return null;
    const labels = Object.keys(stats.dates).sort();
    return {
      labels,
      datasets: [
        {
          label: "Выручка (₽)",
          data: labels.map((d) => stats.dates[d]),
          borderColor: "#4438ca",
          backgroundColor: "rgba(68,56,202,0.2)",
          tension: 0.3,
        },
      ],
    };
  }, [stats]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="text-center text-red-500 py-10">{error}</div>
    );

  return (
    <>
    <Header title="Мои продажи"/>
    
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Выручка"
            value={stats.totalRevenue.toLocaleString("ru-RU") + " ₽"}
            color="text-[#4438ca]"
            icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 3v18m0 0c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" stroke="#4438ca" strokeWidth="2"/></svg>}
          />
          <StatCard
            title="Количество заказов"
            value={stats.totalOrders}
            color="text-[#22c55e]"
            icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18" stroke="#22c55e" strokeWidth="2"/></svg>}
          />
          <StatCard
            title="Проданных товаров"
            value={stats.totalItems}
            color="text-[#19144d]"
            icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#19144d" strokeWidth="2"/></svg>}
          />
          <StatCard
            title="Средний чек"
            value={stats.averageOrder.toLocaleString("ru-RU") + " ₽"}
            color="text-[#4438ca]"
            icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" stroke="#4438ca" strokeWidth="2"/></svg>}
          />
        </div>
      )}
      {completedItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 80, delay: 0.2 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <svg width="80" height="80" fill="none" viewBox="0 0 80 80" className="mb-6">
            <circle cx="40" cy="40" r="38" stroke="#4438ca" strokeWidth="4" fill="#f3f4f6" />
            <path d="M25 55c2.5-5 7.5-8 15-8s12.5 3 15 8" stroke="#4438ca" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="32" cy="35" r="3" fill="#4438ca" />
            <circle cx="48" cy="35" r="3" fill="#4438ca" />
          </svg>
          <motion.h2
            className="text-2xl sm:text-3xl font-bold mb-2 text-[#4438ca] text-center drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            У вас ещё нет продаж
          </motion.h2>
          <motion.p
            className="text-lg text-gray-700 text-center max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Не расстраивайтесь! Ваши первые продажи уже на подходе.<br />
            Добавьте больше товаров, оформите их красиво и расскажите о себе покупателям — и успех не заставит себя ждать!
          </motion.p>
        </motion.div>
      ) : (
      <>
      {chartData && (
        <motion.div
          className="bg-white rounded-lg shadow p-6 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-[#4438ca]">График выручки по дням</h2>
          <div className="h-72">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </motion.div>
      )}
      <motion.h2
        className="text-2xl font-bold mb-4 text-[#4438ca]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Все продажи
      </motion.h2>
      <div className="w-full overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 hidden sm:table">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Id</th>
              <th className="py-3 px-6 text-left">Дата</th>
              <th className="py-3 px-6 text-left">Товар</th>
              <th className="py-3 px-6 text-left">Кол-во</th>
              <th className="py-3 px-6 text-left">Сумма</th>
              <th className="py-3 px-6 text-left">Статус</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            <AnimatePresence>
              {completedItems.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  className="border-b border-gray-300 hover:bg-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <td className="py-3 px-6">{item.orderId}</td>
                  <td className="py-3 px-6">{new Date(item.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td className="py-3 px-6">{item.product?.name || "-"}</td>
                  <td className="py-3 px-6">{item.quantity}</td>
                  <td className="py-3 px-6">{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</td>
                  <td className="py-3 px-6">
                    <span className="text-green-600">Продано</span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {/* Мобильная версия: карточки */}
        <div className="flex flex-col gap-4 sm:hidden">
          <AnimatePresence>
            {completedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: idx * 0.04 }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">
                    {item.product?.name || "-"}
                  </span>
                  <span className="text-green-600">Продано</span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                  <span>Кол-во: <b>{item.quantity}</b></span>
                  <span>Сумма: <b>{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</b></span>
                </div>
                <div className="text-sm text-gray-700">Дата: {new Date(item.createdAt).toLocaleDateString("ru-RU")}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      </>
      )}
    </div>
    </>
  );
} 