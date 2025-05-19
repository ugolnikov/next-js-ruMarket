"use client"
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function SettingsPage() {
  const [commission, setCommission] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchCommission() {
      try {
        setLoading(true);
        const res = await axios.get('/api/admin/settings');
        setCommission(res.data.commission || '');
      } catch (e) {
        setError('Ошибка загрузки комиссии');
      } finally {
        setLoading(false);
      }
    }
    fetchCommission();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.put('/api/admin/settings', { commission });
      setSuccess(true);
    } catch (e) {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Настройки маркетплейса</h1>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Комиссия маркетплейса (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commission}
              onChange={e => setCommission(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {success && <p className="text-green-600 mt-2">Сохранено!</p>}
        </>
      )}
    </div>
  );
} 