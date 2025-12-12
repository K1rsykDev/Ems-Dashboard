# PixelForge Studio – портфоліо та прийом заявок

Повноцінний проєкт для продажу графічних послуг (аватарки, банери, превʼюшки). Складається з фронтенду, який можна розгорнути на GitHub Pages, та бекенду на Node.js + Express із збереженням файлів і API для заявок та галереї робіт.

## Структура
- `/docs` — статичний фронтенд для GitHub Pages (головна сторінка, форма замовлення, адмін-панель).
- `/server` — бекенд на Express з API, збереженням файлів та простою авторизацією для адмінки.
- `/server/data` — JSON-файли для збереження заявок і галереї.
- `/server/uploads` — завантажені референси, чеки та картинки портфоліо (ігнорується Git).

## Налаштування та запуск бекенду локально
1. Встановіть Node.js 18+.
2. Перейдіть у директорію `server` і встановіть залежності:
   ```bash
   cd server
   npm install
   ```
3. Створіть `.env` (опційно) з власними обліковими даними адміністратора:
   ```env
   ADMIN_USER=admin
   ADMIN_PASS=password123
   TOKEN_SECRET=super-secret
   PORT=3000
   ```
4. Запустіть сервер:
   ```bash
   npm start
   ```
   API буде доступний за адресою `http://localhost:3000/api`.

## Деплой бекенду (приклад Render)
1. Створіть новий сервіс на Render зі звичайним вебсервером Node.
2. Вкажіть репозиторій і директорію `server` як робочу.
3. Build command: `npm install`
4. Start command: `npm start`
5. Додайте env-перемінні `ADMIN_USER`, `ADMIN_PASS`, `TOKEN_SECRET` (і за потреби `PORT`).
6. Після деплою отримайте базову URL (наприклад, `https://pixelforge.onrender.com/api`) і пропишіть її у фронтенді.

## Налаштування фронтенду
Фронтенд працює як статичні файли (папка `docs`). В ньому є два екрани:
- `index.html` — головна сторінка з портфоліо (дані тягнуться з API) та формою замовлення.
- `admin.html` — адмін-панель із входом, переглядом/оновленням заявок та додаванням робіт у галерею.

### Підключення до вашого API
Фронтенд очікує базову адресу API в змінній `window.API_BASE`. За замовчуванням вона читається з LocalStorage (`pixelforge_api`) або падає на `http://localhost:3000/api`.
1. Щоб вказати свій бекенд у готовій сторінці, відкрийте DevTools → Console на продакшн-сторінці й виконайте:
   ```js
   localStorage.setItem('pixelforge_api', 'https://your-api-host.com/api');
   ```
2. Оновіть сторінку — фронтенд підтягне нову адресу.

### Розгортання на GitHub Pages
1. Переконайтеся, що гілка `main` містить папку `docs` з готовими файлами.
2. У налаштуваннях репозиторію GitHub виберіть GitHub Pages → Source: `Deploy from a branch`, гілка `main`, папка `/docs`.
3. Після публікації посилання на сторінку можна використати як клієнт (прописавши API через LocalStorage або змінивши вбудовану константу `window.API_BASE`).

## Робота з API
- `POST /api/orders` — створення заявки (FormData: `nickname`, `orderType`, `description`, `references[]`, `receipt`).
- `GET /api/gallery` — отримати список робіт.
- `POST /api/admin/login` — логін адміністратора, повертає `token`.
- `GET /api/orders` — список заявок (Bearer token).
- `GET /api/orders/:id` — деталі заявки (Bearer token).
- `PATCH /api/orders/:id` — оновити статус оплати/замовлення (Bearer token, body: `{ paymentStatus?, orderStatus? }`).
- `POST /api/gallery` — додати роботу (Bearer token, FormData: `title`, `image`).

## Формати даних
- Заявка: `{ id, nickname, orderType, description, references[], receiptPath, paymentStatus, orderStatus, createdAt }`.
- Елемент галереї: `{ id, title, imageUrl, createdAt }`.

## Підказки щодо продакшну
- Для продакшн-статиків достатньо скопіювати вміст `docs` на будь-який хостинг статики.
- На бекенді варто додати HTTPS і персистентне сховище (S3/Cloud Storage/БД) замість локальних файлів, якщо планується масштабування.
