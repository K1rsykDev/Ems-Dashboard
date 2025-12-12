import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password123';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'very-secret-token';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const dataDir = path.join(__dirname, 'data');
const ordersFile = path.join(dataDir, 'orders.json');
const galleryFile = path.join(dataDir, 'gallery.json');

const issuedTokens = new Set();

function loadJson(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Failed to parse JSON for', file, err);
    return [];
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getUploadsPath(field) {
  switch (field) {
    case 'references':
      return path.join(__dirname, 'uploads/references');
    case 'receipt':
      return path.join(__dirname, 'uploads/receipts');
    case 'image':
      return path.join(__dirname, 'uploads/gallery');
    default:
      return path.join(__dirname, 'uploads');
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = getUploadsPath(file.fieldname);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  }
});

const upload = multer({ storage });

function buildPublicUrl(req, filePath) {
  const base = `${req.protocol}://${req.get('host')}`;
  return new URL(filePath.replace(/\\/g, '/'), base).toString();
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token || !issuedTokens.has(token)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = `${TOKEN_SECRET}-${nanoid(12)}`;
    issuedTokens.add(token);
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

app.get('/api/gallery', (req, res) => {
  const gallery = loadJson(galleryFile).map(item => ({
    ...item,
    imageUrl: item.imageUrl || buildPublicUrl(req, item.imagePath)
  }));
  res.json(gallery);
});

app.post('/api/gallery', authMiddleware, upload.single('image'), (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Image is required' });
  }

  const gallery = loadJson(galleryFile);
  const item = {
    id: nanoid(8),
    title,
    imagePath: path.join('uploads/gallery', req.file.filename),
    createdAt: new Date().toISOString()
  };
  gallery.unshift(item);
  saveJson(galleryFile, gallery);
  res.status(201).json({ ...item, imageUrl: buildPublicUrl(req, item.imagePath) });
});

app.post('/api/orders', upload.fields([
  { name: 'references', maxCount: 5 },
  { name: 'receipt', maxCount: 1 }
]), (req, res) => {
  const { nickname, orderType, description } = req.body;
  if (!nickname || !orderType || !description) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  const references = (req.files?.references || []).map(file =>
    path.join('uploads/references', file.filename)
  );
  const receiptFile = (req.files?.receipt || [])[0];
  const receiptPath = receiptFile ? path.join('uploads/receipts', receiptFile.filename) : null;

  const orders = loadJson(ordersFile);
  const order = {
    id: nanoid(10),
    nickname,
    orderType,
    description,
    references,
    receiptPath,
    paymentStatus: 'pending',
    orderStatus: 'new',
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  saveJson(ordersFile, orders);
  res.status(201).json({ message: 'Order received', orderId: order.id });
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const orders = loadJson(ordersFile).map(order => ({
    ...order,
    references: order.references?.map(ref => buildPublicUrl(req, ref)) || [],
    receiptUrl: order.receiptPath ? buildPublicUrl(req, order.receiptPath) : null
  }));
  res.json(orders);
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const orders = loadJson(ordersFile);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({
    ...order,
    references: order.references?.map(ref => buildPublicUrl(req, ref)) || [],
    receiptUrl: order.receiptPath ? buildPublicUrl(req, order.receiptPath) : null
  });
});

app.patch('/api/orders/:id', authMiddleware, (req, res) => {
  const { paymentStatus, orderStatus } = req.body;
  const orders = loadJson(ordersFile);
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Order not found' });

  if (paymentStatus) orders[index].paymentStatus = paymentStatus;
  if (orderStatus) orders[index].orderStatus = orderStatus;

  saveJson(ordersFile, orders);
  res.json({ message: 'Order updated', order: orders[index] });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
