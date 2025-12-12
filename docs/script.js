const apiBase = window.API_BASE || 'http://localhost:3000/api';
const galleryGrid = document.getElementById('galleryGrid');
const orderForm = document.getElementById('orderForm');
const formStatus = document.getElementById('formStatus');
const submitOrder = document.getElementById('submitOrder');

async function fetchGallery() {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = '<p class="muted">Завантаження...</p>';
  try {
    const res = await fetch(`${apiBase}/gallery`);
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) {
      galleryGrid.innerHTML = '<p class="muted">Ще немає робіт. Додайте приклади через адмін-панель.</p>';
      return;
    }
    galleryGrid.innerHTML = items.map(item => `
      <article class="card">
        <img src="${item.imageUrl}" alt="${item.title}">
        <div class="card-body">
          <h3 class="card-title">${item.title}</h3>
          <p class="card-meta">Додано ${new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error(err);
    galleryGrid.innerHTML = '<p class="muted">Не вдалося завантажити портфоліо. Перевірте API.</p>';
  }
}

function setStatus(element, message, isError = false) {
  if (!element) return;
  element.style.display = 'block';
  element.textContent = message;
  element.classList.toggle('status-success', !isError);
  element.classList.toggle('status-error', isError);
}

async function submitOrderHandler(event) {
  event.preventDefault();
  if (!orderForm || !submitOrder) return;

  const formData = new FormData(orderForm);
  submitOrder.disabled = true;
  setStatus(formStatus, 'Відправляємо...', false);

  try {
    const res = await fetch(`${apiBase}/orders`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Не вдалося надіслати заявку');
    await res.json();
    orderForm.reset();
    setStatus(formStatus, 'Заявка успішно відправлена! Ми скоро звʼяжемося.', false);
  } catch (err) {
    console.error(err);
    setStatus(formStatus, 'Сталася помилка. Перевірте підключення до бекенду.', true);
  } finally {
    submitOrder.disabled = false;
  }
}

fetchGallery();
orderForm?.addEventListener('submit', submitOrderHandler);
