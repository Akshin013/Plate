'use client';
import { useEffect, useState } from 'react';
import EventLocationPicker from './EventLocationPickerLoader';

const emptyEvent = {
  title: '',
  type: 'Автовстреча',
  city: 'Баку',
  address: '',
  latitude: '',
  longitude: '',
  event_date: '',
  event_time: '',
  description: '',
  image: '',
  organizer: '',
  contact: '',
  status: 'approved',
};

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadEvents() {
    try {
      const response = await fetch('/api/admin/events', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Ошибка загрузки');

      setEvents(data.events || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function startEdit(event) {
    setEditingId(event.id);
    setForm({
      ...emptyEvent,
      ...event,
      latitude: String(event.latitude ?? ''),
      longitude: String(event.longitude ?? ''),
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyEvent);
    setMessage('');
  }

  async function uploadImage(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Выберите изображение.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setMessage('Максимальный размер изображения — 8 МБ.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const signatureResponse = await fetch('/api/admin/cloudinary-signature', {
        method: 'POST',
      });

      const signature = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(signature.error || 'Не удалось получить подпись Cloudinary.');
      }

      const cloudName = signature.cloudName || signature.cloud_name;
      const formData = new FormData();

      formData.append('file', file);
      formData.append('api_key', signature.apiKey || signature.api_key);
      formData.append('timestamp', signature.timestamp);
      formData.append('signature', signature.signature);

      if (signature.folder) {
        formData.append('folder', signature.folder);
      }

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      const uploaded = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploaded.error?.message || 'Ошибка загрузки изображения.');
      }

      updateField('image', uploaded.secure_url);
      setMessage('Фото загружено.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveEvent(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          id: editingId || undefined,
          action: editingId ? 'update' : 'create',
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Не удалось сохранить мероприятие.');

      setMessage(editingId ? 'Мероприятие обновлено.' : 'Мероприятие добавлено.');
      resetForm();
      await loadEvents();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id) {
    if (!window.confirm('Удалить это мероприятие?')) return;

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Не удалось удалить мероприятие.');

      setEvents(current => current.filter(event => event.id !== id));
      setMessage('Мероприятие удалено.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="admin-events">
      <div className="admin-events-heading">
        <div>
          <h2>Автомероприятия</h2>
          <p>Добавление и управление событиями на карте Plate</p>
        </div>
        <span>{events.length} событий</span>
      </div>

      <form className="admin-event-form" onSubmit={saveEvent}>
        <h3>{editingId ? 'Редактировать мероприятие' : 'Новое мероприятие'}</h3>

        <div className="admin-event-fields">
          <label>
            Название *
            <input
              required
              maxLength={120}
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="Например, Baku Car Meet"
            />
          </label>

          <label>
            Тип события
            <select value={form.type} onChange={e => updateField('type', e.target.value)}>
              <option>Автовстреча</option>
              <option>Выставка</option>
              <option>Дрифт</option>
              <option>Гонки</option>
              <option>Автоклуб</option>
              <option>Другое</option>
            </select>
          </label>

          <label>
            Город *
            <input
              required
              maxLength={60}
              value={form.city}
              onChange={e => updateField('city', e.target.value)}
              placeholder="Баку"
            />
          </label>

          <label>
            Адрес
            <input
              value={form.address}
              onChange={e => updateField('address', e.target.value)}
              placeholder="Место проведения"
            />
          </label>

<div className="admin-event-map-field">
  <EventLocationPicker
    latitude={form.latitude}
    longitude={form.longitude}
    onSelect={({ latitude, longitude }) => {
      setForm(current => ({
        ...current,
        latitude,
        longitude,
      }));
    }}
  />

  <input
    type="hidden"
    value={form.latitude}
    required
    readOnly
  />

  <input
    type="hidden"
    value={form.longitude}
    required
    readOnly
  />
</div>

          <label>
            Дата *
            <input
              required
              type="date"
              value={form.event_date}
              onChange={e => updateField('event_date', e.target.value)}
            />
          </label>

          <label>
            Время
            <input
              type="time"
              value={form.event_time}
              onChange={e => updateField('event_time', e.target.value)}
            />
          </label>

          <label>
            Организатор
            <input
              value={form.organizer}
              onChange={e => updateField('organizer', e.target.value)}
              placeholder="Имя или клуб"
            />
          </label>

          <label>
            Контакт
            <input
              value={form.contact}
              onChange={e => updateField('contact', e.target.value)}
              placeholder="Instagram или телефон"
            />
          </label>

          {editingId && (
            <label>
              Статус
              <select
                value={form.status}
                onChange={e => updateField('status', e.target.value)}
              >
                <option value="approved">Опубликовано</option>
                <option value="pending">На проверке</option>
                <option value="rejected">Отклонено</option>
              </select>
            </label>
          )}
        </div>

        <label className="admin-event-description">
          Описание
          <textarea
            rows={4}
            maxLength={2000}
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder="Расскажи о мероприятии..."
          />
        </label>

        <div className="admin-event-upload">
          <label>
            Обложка мероприятия
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={e => uploadImage(e.target.files?.[0])}
            />
          </label>

          {form.image && (
            <div className="admin-event-preview">
              <img src={form.image} alt="Обложка мероприятия" />
              <button type="button" onClick={() => updateField('image', '')}>
                Удалить фото
              </button>
            </div>
          )}
        </div>

        <div className="admin-event-actions">
          <button type="submit" disabled={saving || uploading}>
            {saving ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Добавить мероприятие'}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>

        {message && <p className="admin-event-message">{message}</p>}
      </form>

      <div className="admin-event-list">
        <h3>Все мероприятия</h3>

        {loading ? (
          <p>Загрузка...</p>
        ) : events.length === 0 ? (
          <p>Пока мероприятий нет.</p>
        ) : (
          events.map(event => (
            <article className="admin-event-item" key={event.id}>
              <div>
                <strong>{event.title}</strong>
                <p>{event.city} · {event.event_date}</p>
                <small>Статус: {event.status}</small>
              </div>

              <div>
                <button type="button" onClick={() => startEdit(event)}>
                  Изменить
                </button>
                <button type="button" onClick={() => deleteEvent(event.id)}>
                  Удалить
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}