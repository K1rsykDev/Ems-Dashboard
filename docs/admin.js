const apiBase = window.API_BASE || 'http://localhost:3000/api';
const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');
const ordersSection = document.getElementById('orders');
const gallerySection = document.getElementById('gallery');
const ordersTable = document.querySelector('#ordersTable tbody');
const galleryForm = document.getElementById('galleryForm');
const galleryStatus = document.getElementById('galleryStatus');
const adminGallery = document.getElementById('adminGallery');

let token = localStorage.getItem('pixelforge_token') || '';

function setBanner(el, message, isError = false) {
  if (!el) return;
  el.style.display = 'block';
  el.textContent = message;
  el.classList.toggle('status-success', !isError);
  el.classList.toggle('status-error', isError);
}

async function login(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm));
  try {
    const res = await fetch(`${apiBase}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Невірні дані');
    const { token: t } = await res.json();
    token = t;
    localStorage.setItem('pixelforge_token', token);
    setBanner(loginStatus, 'Вхід успішний');
    ordersSection.style.display = 'block';
    gallerySection.style.display = 'block';
    fetchOrders();
    fetchAdminGallery();
  } catch (err) {
    console.error(err);
    setBanner(loginStatus, 'Помилка входу. Перевірте логін/пароль.', true);
  }
}

async function fetchOrders() {
  if (!ordersTable) return;
  ordersTable.innerHTML = '<tr><td colspan="8" class="muted">Завантаження...</td></tr>';
  try {
    const res = await fetch(`${apiBase}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('auth');
    const orders = await res.json();
    if (!orders.length) {
      ordersTable.innerHTML = '<tr><td colspan="8" class="muted">Немає заявок</td></tr>';
      return;
    }
    ordersTable.innerHTML = orders.map(order => `
      <tr>
        <td>${order.id}</td>
        <td>${order.nickname}</td>
        <td>${order.orderType}</td>
        <td>${order.description.slice(0, 60)}${order.description.length > 60 ? '…' : ''}</td>
        <td><span class="badge ${order.paymentStatus}">${order.paymentStatus}</span></td>
        <td><span class="badge ${order.orderStatus.replace(/\s/g,'-')}">${order.orderStatus}</span></td>
        <td>${new Date(order.createdAt).toLocaleString()}</td>
        <td class="actions">
          <button class="btn" data-action="pay" data-id="${order.id}" data-status="confirmed">Підтвердити оплату</button>
          <button class="btn" data-action="pay" data-id="${order.id}" data-status="pending">Очікує</button>
          <button class="btn" data-action="order" data-id="${order.id}" data-status="in-progress">У роботі</button>
          <button class="btn" data-action="order" data-id="${order.id}" data-status="completed">Виконано</button>
          <button class="btn" data-action="order" data-id="${order.id}" data-status="rejected">Відхилено</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    ordersTable.innerHTML = '<tr><td colspan="8" class="muted">Помилка авторизації або завантаження</td></tr>';
  }
}

async function updateStatus(orderId, payload) {
  try {
    const res = await fetch(`${apiBase}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('update');
    fetchOrders();
  } catch (err) {
    console.error(err);
    alert('Не вдалося оновити статус');
  }
}

ordersTable?.addEventListener('click', (e) => {
  const target = e.target.closest('button[data-action]');
  if (!target) return;
  const orderId = target.dataset.id;
  if (target.dataset.action === 'pay') {
    updateStatus(orderId, { paymentStatus: target.dataset.status });
  } else {
    updateStatus(orderId, { orderStatus: target.dataset.status });
  }
});

async function createGalleryItem(event) {
  event.preventDefault();
  const formData = new FormData(galleryForm);
  try {
    const res = await fetch(`${apiBase}/gallery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error('gallery');
    setBanner(galleryStatus, 'Додано!');
    galleryForm.reset();
    fetchAdminGallery();
  } catch (err) {
    console.error(err);
    setBanner(galleryStatus, 'Не вдалося додати роботу', true);
  }
}

async function fetchAdminGallery() {
  if (!adminGallery) return;
  adminGallery.innerHTML = '<p class="muted">Завантаження...</p>';
  try {
    const res = await fetch(`${apiBase}/gallery`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = await res.json();
    if (!items.length) {
      adminGallery.innerHTML = '<p class="muted">Ще немає робіт</p>';
      return;
    }
    adminGallery.innerHTML = items.map(item => `
      <article class="card">
        <img src="${item.imageUrl}" alt="${item.title}">
        <div class="card-body">
          <h3 class="card-title">${item.title}</h3>
          <p class="card-meta">${new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error(err);
    adminGallery.innerHTML = '<p class="muted">Не вдалося завантажити список</p>';
  }
}

if (token) {
  ordersSection.style.display = 'block';
  gallerySection.style.display = 'block';
  fetchOrders();
  fetchAdminGallery();
}

loginForm?.addEventListener('submit', login);
galleryForm?.addEventListener('submit', createGalleryItem);
