"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

async function readResponse(response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Произошла ошибка.");
  return result;
}

const transliteration = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ә: "e",
  ı: "i",
  ө: "o",
  ү: "u",
  ғ: "g",
  ң: "n",
};

export default function AdminPanel({
  authenticated,
  missingConfiguration,
  passwordConfigured,
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await readResponse(
        await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: new FormData(event.currentTarget).get("password"),
          }),
        }),
      );
      router.refresh();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  function updateName(value) {
    if (usernameEdited) return;
    const latin = Array.from(
      value.toLowerCase(),
      (character) => transliteration[character] ?? character,
    ).join("");
    setUsername(
      latin
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40),
    );
  }

  async function uploadFile(file, resourceType) {
    const signature = await readResponse(
      await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
      }),
    );
    const data = new FormData();
    data.append("file", file);
    data.append("api_key", signature.apiKey);
    data.append("timestamp", String(signature.timestamp));
    data.append("folder", signature.folder);
    data.append("signature", signature.signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`,
      { method: "POST", body: data },
    );
    const result = await response.json();
    if (!response.ok || !result.secure_url) {
      const message = result.error?.message || "";
      if (/missing permissions|actions\s*=\s*\[.*create/i.test(message)) {
        throw new Error(
          "Cloudinary запретил загрузку: у API-ключа нет права создавать файлы. В Cloudinary откройте Settings → Security → API Keys и разрешите создание/загрузку ресурсов для этого ключа либо используйте ключ с нужными правами. Затем обновите CLOUDINARY_API_KEY и CLOUDINARY_API_SECRET на сервере и перезапустите приложение.",
        );
      }
      throw new Error(message || "Не удалось загрузить файл в Cloudinary.");
    }
    return result.secure_url;
  }

  async function createProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    try {
      const avatarFile = form.avatar.files[0];
      const videoFile = form.video.files[0];
      const [avatar, video] = await Promise.all([
        avatarFile ? uploadFile(avatarFile, "image") : "",
        videoFile ? uploadFile(videoFile, "video") : "",
      ]);
      const fields = new FormData(form);
      const values = Object.fromEntries(fields.entries());
      await readResponse(
        await fetch("/api/admin/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, avatar, video }),
        }),
      );
      form.reset();
      setUsername("");
      setUsernameEdited(false);
      setSuccess(
        "Профиль добавлен. После публикации Google Таблицы он появится на сайте автоматически (обычно в течение минуты).",
      );
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin">
      <Link className="admin-back" href="/">
        ← На главную
      </Link>
      <h1>CarId · Админка</h1>
      <p className="admin-intro">Создание профиля автомобиля</p>

      {!authenticated ? (
        passwordConfigured ? (
          <form className="admin-card admin-login" onSubmit={login}>
            <label>
              Пароль администратора
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy}>
              {busy ? "Вход…" : "Войти"}
            </button>
          </form>
        ) : (
          <section className="admin-card admin-setup">
            <b>Админка ещё не настроена</b>
            <p>
              Добавьте на сервере переменную <code>ADMIN_PASSWORD</code>, затем
              перезапустите приложение.
            </p>
            <p>
              Пример остальных настроек есть в файле <code>.env.example</code>.
            </p>
          </section>
        )
      ) : (
        <>
          {missingConfiguration.length > 0 && (
            <section className="admin-card admin-setup">
              <b>Нужно настроить переменные окружения</b>
              <p>Добавьте на сервере и перезапустите приложение:</p>
              <code>{missingConfiguration.join(", ")}</code>
              <p>
                См. файл <code>.env.example</code> и инструкции в нём.
              </p>
            </section>
          )}
          <form className="admin-card admin-form" onSubmit={createProfile}>
            <div className="admin-grid">
              <label>
                Ник профиля *
                <input
                  name="username"
                  value={username}
                  onChange={(event) => {
                    setUsernameEdited(true);
                    setUsername(event.target.value.toLowerCase());
                  }}
                  placeholder="например, alex-370z"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  maxLength={40}
                  required
                />
              </label>
              <label>
                Имя владельца *
                <input
                  name="name"
                  onChange={(event) => updateName(event.target.value)}
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Марка автомобиля *
                <input name="car_brand" maxLength={60} required />
              </label>
              <label>
                Модель автомобиля *
                <input name="car_model" maxLength={60} required />
              </label>
              <label>
                Госномер *
                <input
                  name="plate"
                  maxLength={30}
                  onChange={(event) => {
                    event.target.value = event.target.value.toUpperCase();
                  }}
                  required
                />
              </label>
              <label>
                Instagram
                <input
                  name="instagram"
                  placeholder="@username"
                  maxLength={100}
                />
              </label>
              <label>
                Telegram
                <input
                  name="telegram"
                  placeholder="@username"
                  maxLength={100}
                />
              </label>
              <label>
                TikTok
                <input name="tiktok" placeholder="@username" maxLength={100} />
              </label>
              <label>
                YouTube
                <input name="youtube" placeholder="@username" maxLength={100} />
              </label>
              <label>
                Фото профиля
                <input name="avatar" type="file" accept="image/*" />
              </label>
              <label>
                Видео автомобиля
                <input name="video" type="file" accept="video/*" />
              </label>
            </div>
            <p className="admin-hint">
              Ник должен быть уникальным. Фото и видео загружаются напрямую в
              Cloudinary.
            </p>
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="admin-success" role="status">
                {success}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || missingConfiguration.length > 0}
            >
              {busy ? "Загрузка и сохранение…" : "Создать профиль"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
