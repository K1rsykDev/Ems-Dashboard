// URL вебхука. Змініть значення за потреби.
const webhookUrl = 'https://discord.com/api/webhooks/replace-with-your-webhook';

const typeMap = {
  sell: 'Продам',
  buy: 'Куплю',
};

const form = document.getElementById('announcementForm');
const statusMessage = document.getElementById('statusMessage');
const toast = document.getElementById('toast');
const announcementTypeInput = document.getElementById('announcementType');
const selectedType = document.getElementById('selectedType');
const submitBtn = document.getElementById('submitBtn');
const imageInput = document.getElementById('image');
const typeButtons = [document.getElementById('sellBtn'), document.getElementById('buyBtn')];

function setType(typeKey) {
  const label = typeMap[typeKey];
  announcementTypeInput.value = label;
  selectedType.textContent = label;
  typeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === typeKey);
    btn.classList.toggle('btn--primary', btn.dataset.type === typeKey);
    btn.classList.toggle('btn--ghost', btn.dataset.type !== typeKey);
  });
}

typeButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    setType(btn.dataset.type);
  })
);

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast visible ${type === 'error' ? 'error' : 'success'}`;
  setTimeout(() => toast.classList.remove('visible'), 3500);
}

function validateForm() {
  const requiredFields = ['nickname', 'phone', 'static', 'discord', 'category', 'type', 'title', 'description'];
  const isValid = requiredFields.every((name) => {
    const field = form.elements[name];
    return field && field.value.trim();
  });
  if (!isValid) {
    statusMessage.textContent = 'Заповніть всі обов’язкові поля.';
  }
  return isValid;
}

function buildEmbed(values, attachmentName) {
  const titlePrefix = values.type === 'Продам' ? 'Оголошення: ПРОДАМ' : 'Оголошення: КУПЛЮ';
  const embed = {
    title: `${titlePrefix} – ${values.title}`,
    color: values.type === 'Продам' ? 0x3ed598 : 0x48b5ff,
    fields: [
      { name: 'Нік у грі', value: values.nickname, inline: true },
      { name: 'Телефон', value: values.phone, inline: true },
      { name: 'Static', value: values.static, inline: true },
      { name: 'Discord', value: values.discord, inline: true },
      { name: 'Категорія', value: values.category, inline: true },
      { name: 'Тип оголошення', value: values.type, inline: true },
      { name: 'Опис', value: values.description, inline: false },
    ],
  };

  if (attachmentName) {
    embed.image = { url: `attachment://${attachmentName}` };
  }

  return embed;
}

async function sendToDiscord(embed, file) {
  if (!webhookUrl || webhookUrl.includes('replace-with-your-webhook')) {
    throw new Error('Налаштуйте webhookUrl у script.js перед відправкою.');
  }

  if (file) {
    const formData = new FormData();
    const payload = { embeds: [embed] };
    formData.append('payload_json', JSON.stringify(payload));
    formData.append('file', file, file.name);

    const response = await fetch(webhookUrl, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Сталася помилка під час відправки. Спробуйте ще раз.');
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    throw new Error('Сталася помилка під час відправки. Спробуйте ще раз.');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusMessage.textContent = '';

  if (!validateForm()) return;

  const file = imageInput.files?.[0];
  const values = {
    nickname: form.nickname.value.trim(),
    phone: form.phone.value.trim(),
    static: form.static.value.trim(),
    discord: form.discord.value.trim(),
    category: form.category.value,
    type: form.type.value.trim(),
    title: form.title.value.trim(),
    description: form.description.value.trim(),
  };

  const embed = buildEmbed(values, file?.name);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Відправка...';

  try {
    await sendToDiscord(embed, file);
    showToast('Ваше оголошення успішно відправлено в Discord.');
    statusMessage.textContent = 'Ваше оголошення успішно відправлено в Discord.';
    form.reset();
    selectedType.textContent = 'Не обрано';
    announcementTypeInput.value = '';
    typeButtons.forEach((btn) => btn.classList.remove('active'));
  } catch (error) {
    const message = error.message || 'Сталася помилка під час відправки. Спробуйте ще раз.';
    showToast(message, 'error');
    statusMessage.textContent = message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Відправити';
  }
});
