
'use client';

import { useEffect, useState } from 'react';

async function readResponse(response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Произошла ошибка.');
  }

  return result;
}

async function uploadFile(file, resourceType) {
  const signature = await readResponse(
    await fetch('/api/admin/cloudinary-signature', {
      method: 'POST',
    })
  );

  const data = new FormData();
  data.append('file', file);
  data.append('api_key', signature.apiKey);
  data.append('timestamp', String(signature.timestamp));
  data.append('folder', signature.folder);
  data.append('signature', signature.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`,
    {
      method: 'POST',
      body: data,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(
      result.error?.message || 'Не удалось загрузить файл в Cloudinary.'
    );
  }

  return result.secure_url;
}

const initialForm = {
  name: '',
  car_brand: '',
  car_model: '',
  plate: '',
  instagram: '',
  telegram: '',
  tiktok: '',
  youtube: '',
  avatar: '',
  video: '',
};

export default function AdminProfiles() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');

  async function load() {
    setError('');

    try {
      const data = await readResponse(
        await fetch('/api/admin/profiles', {
          cache: 'no-store',
        })
      );

      setList(data.profiles);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEditor(profile) {
    setEditing(profile);

    setForm({
      name: profile.name || '',
      car_brand: profile.car_brand || '',
      car_model: profile.car_model || '',
      plate: profile.plate || '',
      instagram: profile.instagram || '',
      telegram: profile.telegram || '',
      tiktok: profile.tiktok || '',
      youtube: profile.youtube || '',
      avatar: profile.avatar || '',
      video: profile.video || '',
    });

    setAvatarFile(null);
    setVideoFile(null);
    setRemoveAvatar(false);
    setRemoveVideo(false);
    setError('');
    setSuccess('');
  }

  function closeEditor() {
    setEditing(null);
    setForm(initialForm);
    setAvatarFile(null);
    setVideoFile(null);
    setRemoveAvatar(false);
    setRemoveVideo(false);
  }

  function changeField(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!editing || saving) return;

    setSaving(true);
    setError('');

    try {
      let avatar = removeAvatar ? '' : form.avatar;
      let video = removeVideo ? '' : form.video;

      if (avatarFile) {
        avatar = await uploadFile(avatarFile, 'image');
      }

      if (videoFile) {
        video = await uploadFile(videoFile, 'video');
      }

      await readResponse(
        await fetch('/api/admin/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update',
            username: editing.username,
            profile: {
              ...form,
              avatar,
              video,
            },
          }),
        })
      );

      closeEditor();
      setSuccess('Профиль успешно обновлён.');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleProfile(profile) {
    const action = profile.active ? 'скрыть' : 'показать';

    if (!confirm(`Вы действительно хотите ${action} профиль @${profile.username}?`)) {
      return;
    }

    setBusy(profile.username);
    setError('');
    setSuccess('');

    try {
      await readResponse(
        await fetch('/api/admin/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'toggle',
            username: profile.username,
            active: !profile.active,
          }),
        })
      );

      setSuccess(
        profile.active
          ? 'Профиль скрыт.'
          : 'Профиль снова опубликован.'
      );

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function deleteProfile(profile) {
    if (
      !confirm(
        `Удалить профиль @${profile.username}?\n\nЭто действие нельзя отменить. Строка будет удалена из Google Таблицы.`
      )
    ) {
      return;
    }

    setBusy(profile.username);
    setError('');
    setSuccess('');

    try {
      await readResponse(
        await fetch('/api/admin/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            username: profile.username,
          }),
        })
      );

      setSuccess(`Профиль @${profile.username} удалён.`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  const s = q.trim().toLowerCase().replace(/[^a-z0-9а-яё]/g, '');

  const shown = (list || []).filter(profile => {
    const searchText = [
      profile.username,
      profile.name,
      profile.car,
      profile.plate,
    ]
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]/g, '');

    return !s || searchText.includes(s);
  });

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #34343b',
    background: '#151519',
    color: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '10px 14px',
    borderRadius: '9px',
    border: '1px solid #38383f',
    background: '#202026',
    color: '#fff',
    cursor: 'pointer',
  };

  return (
    <section className="adm">
      <div className="adm-top">
        <h2>
          Все профили {list && <span>({list.length})</span>}
        </h2>

        <button onClick={load} disabled={Boolean(busy)}>
          Обновить
        </button>
      </div>

      <input
        className="adm-search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Поиск: имя, ник, машина, номер"
      />

      {error && <p className="adm-err">{error}</p>}
      {success && <p style={{ color: '#63d69b' }}>{success}</p>}

      {!list && !error && (
        <p className="adm-muted">Загрузка...</p>
      )}

      {list && shown.length === 0 && (
        <p className="adm-muted">Ничего не найдено</p>
      )}

      <div className="adm-list">
        {shown.map(profile => (
          <div
            key={profile.username}
            className={`adm-row${profile.active ? '' : ' off'}`}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                flex: '1 1 220px',
                gap: 12,
                alignItems: 'center',
                minWidth: 0,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <span className="adm-plate">
                {(profile.plate || '').replace(/-/g, ' · ')}
              </span>

              <span className="adm-info">
                <b>{profile.name}</b>
                <small>
                  @{profile.username} · {profile.car}
                </small>
                <small>
                  Просмотры: {(profile.views || 0).toLocaleString('ru-RU')}
                </small>
              </span>
            </a>

            <div className="adm-tags">
              {!profile.active && <i className="bad">скрыт</i>}
              {!profile.hasVideo && <i>нет видео</i>}
              {!profile.hasAvatar && <i>нет фото</i>}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 7,
              }}
            >
              <button
                type="button"
                style={buttonStyle}
                onClick={() => openEditor(profile)}
                disabled={Boolean(busy)}
              >
                Изменить
              </button>

              <button
                type="button"
                style={buttonStyle}
                onClick={() => toggleProfile(profile)}
                disabled={Boolean(busy)}
              >
                {busy === profile.username
                  ? '...'
                  : profile.active
                    ? 'Скрыть'
                    : 'Показать'}
              </button>

              <button
                type="button"
                style={{
                  ...buttonStyle,
                  color: '#ff7777',
                }}
                onClick={() => deleteProfile(profile)}
                disabled={Boolean(busy)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div
          onMouseDown={e => {
            if (e.target === e.currentTarget && !saving) {
              closeEditor();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,.78)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <form
            onSubmit={saveProfile}
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#1b1b20',
              border: '1px solid #34343b',
              borderRadius: 18,
              padding: 20,
              color: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Редактирование</h2>
                <small style={{ color: '#aaa' }}>
                  @{editing.username}
                </small>
              </div>

              <button
                type="button"
                style={buttonStyle}
                onClick={closeEditor}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {[
                ['name', 'Имя владельца'],
                ['car_brand', 'Марка автомобиля'],
                ['car_model', 'Модель автомобиля'],
                ['plate', 'Госномер'],
                ['instagram', 'Instagram'],
                ['telegram', 'Telegram'],
                ['tiktok', 'TikTok'],
                ['youtube', 'YouTube'],
              ].map(([field, label]) => (
                <label
                  key={field}
                  style={{
                    display: 'grid',
                    gap: 7,
                    fontSize: 13,
                    color: '#bbb',
                  }}
                >
                  {label}

                  <input
                    style={inputStyle}
                    value={form[field]}
                    onChange={e => changeField(field, e.target.value)}
                    maxLength={field === 'name' ? 100 : 100}
                    required={[
                      'name',
                      'car_brand',
                      'car_model',
                      'plate',
                    ].includes(field)}
                  />
                </label>
              ))}
            </div>

            <div style={{ marginTop: 20, display: 'grid', gap: 15 }}>
              <div>
                <b>Фото профиля</b>

                {form.avatar && !removeAvatar && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={form.avatar}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#FFB454' }}
                    >
                      Открыть текущее фото
                    </a>

                    <button
                      type="button"
                      style={{ ...buttonStyle, marginLeft: 10 }}
                      onClick={() => {
                        setRemoveAvatar(true);
                        setAvatarFile(null);
                      }}
                    >
                      Удалить фото
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    setAvatarFile(e.target.files?.[0] || null);
                    setRemoveAvatar(false);
                  }}
                  style={{ display: 'block', marginTop: 10 }}
                />
              </div>

              <div>
                <b>Видео профиля</b>

                {form.video && !removeVideo && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={form.video}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#FFB454' }}
                    >
                      Открыть текущее видео
                    </a>

                    <button
                      type="button"
                      style={{ ...buttonStyle, marginLeft: 10 }}
                      onClick={() => {
                        setRemoveVideo(true);
                        setVideoFile(null);
                      }}
                    >
                      Удалить видео
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  accept="video/*"
                  onChange={e => {
                    setVideoFile(e.target.files?.[0] || null);
                    setRemoveVideo(false);
                  }}
                  style={{ display: 'block', marginTop: 10 }}
                />
              </div>
            </div>

            {error && (
              <p style={{ color: '#ff7777', marginTop: 15 }}>
                {error}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 24,
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  background: '#FFB454',
                  color: '#171717',
                  border: 0,
                  fontWeight: 700,
                }}
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>

              <button
                type="button"
                style={buttonStyle}
                onClick={closeEditor}
                disabled={saving}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
