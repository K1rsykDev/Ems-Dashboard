const webhookUrl = 'https://discord.com/api/webhooks/1439799327680889016/e_rq0csWqzA-zKSKB4O6BGO85Qy5WAVefKvjqK6c1l3Hi8zcLQi76ohNIIPTxZAoe6WN';

const items = [
  { name: 'Бронежилет', value: 100, icon: '🛡️' },
  { name: 'Велика аптечка', value: 75, icon: '🧰' },
  { name: 'Маленька аптечка', value: 25, icon: '💊' },
  { name: 'Адреналін', value: 50, icon: '⚡' },
  { name: 'Форма', value: 300, icon: '👕' },
];

const form = document.getElementById('reportForm');
const itemsContainer = document.getElementById('itemsContainer');
const overallUnits = document.getElementById('overallUnits');
const validationMessage = document.getElementById('validationMessage');
const toast = document.getElementById('toast');
const itemTemplate = document.getElementById('itemTemplate');

const itemInputs = [];

function renderItems() {
  items.forEach((item) => {
    const clone = itemTemplate.content.cloneNode(true);
    const icon = clone.querySelector('.item__icon');
    const name = clone.querySelector('.item__name');
    const value = clone.querySelector('.item__value');
    const input = clone.querySelector('.item__input');
    const subtotal = clone.querySelector('.item__subtotal');

    icon.textContent = item.icon;
    name.textContent = item.name;
    value.textContent = `${item.value} од за 1 шт.`;

    input.addEventListener('input', () => {
      const qty = Number.parseInt(input.value, 10) || 0;
      const total = qty * item.value;
      subtotal.textContent = `${total} од`;
      updateOverall();
    });

    itemInputs.push({ input, item, subtotal });
    itemsContainer.appendChild(clone);
  });
}

function updateOverall() {
  const totalUnits = itemInputs.reduce((sum, { input, item }) => {
    const qty = Number.parseInt(input.value, 10) || 0;
    return sum + qty * item.value;
  }, 0);
  overallUnits.textContent = `Загалом: ${totalUnits} од`;
  return totalUnits;
}

function buildEmbed(nickname, staticId) {
  const itemLines = [];
  let totalUnits = 0;

  itemInputs.forEach(({ input, item }) => {
    const qty = Number.parseInt(input.value, 10) || 0;
    if (qty > 0) {
      const itemTotal = qty * item.value;
      totalUnits += itemTotal;
      itemLines.push(`${item.icon} ${item.name} — ${qty} шт (${itemTotal} од)`);
    }
  });

  const embed = {
    title: 'Звіт складу (EMS)',
    color: 0x2b6cb0,
    fields: [
      { name: 'Ваш нік', value: nickname, inline: false },
      { name: 'Static', value: staticId, inline: true },
      {
        name: 'Видано зі складу',
        value: itemLines.join('\n') || '—',
        inline: false,
      },
      { name: 'Загальна кількість', value: `${totalUnits} од`, inline: true },
    ],
    footer: {
      text: `Надіслано: ${new Date().toLocaleString('uk-UA')}`,
    },
  };

  return { embed, totalUnits };
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'toast toast--visible ' + (type === 'error' ? 'toast--error' : 'toast--success');
  setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, 3500);
}

async function sendReport(payload) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [payload.embed] }),
  });

  if (!response.ok) {
    throw new Error('Не вдалося надіслати звіт у Discord');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  validationMessage.textContent = '';

  const nickname = form.nickname.value.trim();
  const staticId = form.static.value.trim();

  if (!nickname || !staticId) {
    validationMessage.textContent = 'Заповніть всі поля.';
    return;
  }

  const { embed, totalUnits } = buildEmbed(nickname, staticId);

  if (totalUnits === 0) {
    validationMessage.textContent = 'Додайте хоча б один предмет.';
    return;
  }

  form.querySelector('button[type="submit"]').disabled = true;

  try {
    await sendReport({ embed });
    showToast('Звіт відправлено в Discord');
    form.reset();
    itemInputs.forEach(({ subtotal }) => (subtotal.textContent = '0 од'));
    updateOverall();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    form.querySelector('button[type="submit"]').disabled = false;
  }
});

renderItems();
updateOverall();
