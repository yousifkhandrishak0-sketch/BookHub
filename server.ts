import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import {
  hashPassword,
  isSafeMediaUrl,
  isValidEmail,
  optionalCustomer,
  requireAdmin,
  requireCustomer,
  revokeSessionToken,
  sanitizeText,
  signSessionToken,
  slugify,
  verifyPassword,
  verifyPlaintextSecret,
  extractBearerToken,
  type AuthenticatedRequest,
} from './server/auth.ts';
import { getStore, mutateStore, toPublicUser, UPLOADS_DIR } from './server/db.ts';
import type { Book, Order, OrderItem, OrderStatus, PaymentMethod } from './src/types.ts';

const PORT = 3000;
const DELIVERY_FREE_THRESHOLD = 3500;
const STANDARD_DELIVERY_FEE = 250;
const VALID_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

function calculateDeliveryFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= DELIVERY_FREE_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

function getBaseUrl(req: express.Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '4mb' }));

  // Basic security headers (do not set X-Frame-Options to avoid breaking iframe preview)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Ensure DB initialized
  await getStore();

  // Serve uploaded book cover images safely
  app.get('/uploads/:filename', async (req, res) => {
    const filename = path.basename(req.params.filename || '');
    if (!/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(filename)) {
      res.status(400).json({ error: 'Invalid filename' });
      return;
    }
    const resolved = path.resolve(UPLOADS_DIR, filename);
    if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    try {
      await fs.access(resolved);
      res.sendFile(resolved);
    } catch {
      res.status(404).json({ error: 'Image not found' });
    }
  });

  // Dynamic SEO endpoints: robots.txt & sitemap.xml
  app.get('/robots.txt', (req, res) => {
    const baseUrl = getBaseUrl(req);
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /account',
        'Disallow: /checkout',
        'Disallow: /api/',
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join('\n'),
    );
  });

  app.get('/sitemap.xml', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const store = await getStore();
    const staticPaths = ['/', '/shop', '/categories', '/about', '/contact'];
    const urls = [
      ...staticPaths.map((p) => ({ loc: `${baseUrl}${p}`, priority: p === '/' ? '1.0' : '0.8' })),
      ...store.categories.map((cat) => ({
        loc: `${baseUrl}/categories/${encodeURIComponent(cat.slug)}`,
        priority: '0.7',
      })),
      ...store.books.map((book) => ({
        loc: `${baseUrl}/book/${encodeURIComponent(book.slug)}`,
        priority: '0.8',
      })),
    ];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(
        (u) =>
          `  <url><loc>${escapeXml(u.loc)}</loc><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`,
      ),
      '</urlset>',
    ].join('\n');

    res.type('application/xml').send(xml);
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'BOOK HUB' });
  });

  // Public Categories
  app.get('/api/categories', async (_req, res) => {
    const store = await getStore();
    const categories = store.categories.map((cat) => ({
      ...cat,
      bookCount: store.books.filter((b) => b.categorySlug === cat.slug).length,
    }));
    res.json({ categories });
  });

  // Public Books Catalog with filtering, search & sorting
  app.get('/api/books', async (req, res) => {
    const store = await getStore();
    const q = sanitizeText(req.query.q, 100).toLowerCase();
    const category = sanitizeText(req.query.category, 80).toLowerCase();
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    const minRating = Number(req.query.minRating);
    const sort = sanitizeText(req.query.sort, 30);
    const featured = req.query.featured === 'true';
    const bestseller = req.query.bestseller === 'true';
    const newArrival = req.query.newArrival === 'true';

    let items = [...store.books];

    if (q) {
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.categoryName.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q),
      );
    }
    if (category && category !== 'all') {
      items = items.filter((b) => b.categorySlug.toLowerCase() === category);
    }
    if (Number.isFinite(minPrice) && minPrice > 0) {
      items = items.filter((b) => b.price >= minPrice);
    }
    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      items = items.filter((b) => b.price <= maxPrice);
    }
    if (Number.isFinite(minRating) && minRating > 0) {
      items = items.filter((b) => b.rating >= minRating);
    }
    if (featured) items = items.filter((b) => b.featured);
    if (bestseller) items = items.filter((b) => b.bestseller);
    if (newArrival) items = items.filter((b) => b.newArrival);

    if (sort === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === 'newest') {
      items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } else if (sort === 'popular') {
      items.sort((a, b) => b.rating * (b.reviewCount + 1) - a.rating * (a.reviewCount + 1));
    }

    res.json({ books: items });
  });

  // Book Details by Slug
  app.get('/api/books/:slug', async (req, res) => {
    const slug = sanitizeText(req.params.slug, 120);
    const store = await getStore();
    const book = store.books.find((b) => b.slug === slug || b.id === slug);
    if (!book) {
      res.status(404).json({ error: 'Book not found.' });
      return;
    }
    const reviews = store.reviews
      .filter((r) => r.bookId === book.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const related = store.books
      .filter((b) => b.id !== book.id && b.categorySlug === book.categorySlug)
      .slice(0, 4);
    if (related.length < 4) {
      const filler = store.books
        .filter((b) => b.id !== book.id && !related.some((r) => r.id === b.id))
        .slice(0, 4 - related.length);
      related.push(...filler);
    }
    res.json({ book, reviews, related });
  });

  // Add Book Review (Authenticated Customer)
  app.post('/api/books/:id/reviews', requireCustomer, async (req: AuthenticatedRequest, res) => {
    const bookId = sanitizeText(req.params.id, 64);
    const ratingNum = Number(req.body?.rating);
    const comment = sanitizeText(req.body?.comment, 800);

    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }
    if (comment.length < 5) {
      res.status(400).json({ error: 'Please write at least 5 characters for your review.' });
      return;
    }

    try {
      const result = await mutateStore((store) => {
        const book = store.books.find((b) => b.id === bookId);
        if (!book) throw new Error('BOOK_NOT_FOUND');
        const user = store.users.find((u) => u.id === req.authSession?.sub);
        if (!user) throw new Error('USER_NOT_FOUND');

        const review = {
          id: `rev-${crypto.randomUUID().slice(0, 8)}`,
          bookId: book.id,
          userId: user.id,
          userName: user.name,
          rating: ratingNum,
          comment,
          createdAt: new Date().toISOString(),
        };
        store.reviews.unshift(review);

        const bookReviews = store.reviews.filter((r) => r.bookId === book.id);
        const avg = bookReviews.reduce((acc, r) => acc + r.rating, 0) / bookReviews.length;
        book.rating = Number(avg.toFixed(1));
        book.reviewCount = bookReviews.length;

        return { review, book };
      });
      res.status(201).json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'BOOK_NOT_FOUND') {
        res.status(404).json({ error: 'Book not found.' });
        return;
      }
      res.status(400).json({ error: 'Unable to submit review.' });
    }
  });

  // Newsletter Subscription
  app.post('/api/newsletter', async (req, res) => {
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const already = await mutateStore((store) => {
      if (store.newsletterSubscribers.some((s) => s.email === email)) {
        return true;
      }
      store.newsletterSubscribers.push({
        id: `news-${crypto.randomUUID().slice(0, 8)}`,
        email,
        createdAt: new Date().toISOString(),
      });
      return false;
    });
    res.status(already ? 200 : 201).json({
      message: already
        ? 'You are already subscribed to BOOK HUB updates.'
        : 'Subscribed successfully to BOOK HUB curated releases.',
    });
  });

  // Contact Inquiry
  app.post('/api/contact', async (req, res) => {
    const name = sanitizeText(req.body?.name, 80);
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    const subject = sanitizeText(req.body?.subject, 120);
    const message = sanitizeText(req.body?.message, 1500);

    if (name.length < 2 || !isValidEmail(email) || subject.length < 3 || message.length < 10) {
      res.status(400).json({ error: 'Please fill out all contact fields accurately.' });
      return;
    }

    await mutateStore((store) => {
      store.contactMessages.push({
        id: `msg-${crypto.randomUUID().slice(0, 8)}`,
        name,
        email,
        subject,
        message,
        createdAt: new Date().toISOString(),
      });
    });

    res.status(201).json({ message: 'Thank you for contacting BOOK HUB. Our team will respond shortly.' });
  });

  // Customer Registration
  app.post('/api/auth/register', async (req, res) => {
    const name = sanitizeText(req.body?.name, 80);
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    try {
      const created = await mutateStore((store) => {
        if (store.users.some((u) => u.email === email)) {
          throw new Error('EMAIL_EXISTS');
        }
        const user = {
          id: `usr-${crypto.randomUUID().slice(0, 12)}`,
          name,
          email,
          wishlist: [],
          cart: [],
          passwordHash: hashPassword(password),
          createdAt: new Date().toISOString(),
        };
        store.users.push(user);
        return toPublicUser(user);
      });
      const token = signSessionToken(created.id, 'customer');
      res.status(201).json({ token, user: created });
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  // Customer Login
  app.post('/api/auth/login', async (req, res) => {
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const store = await getStore();
    const user = store.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signSessionToken(user.id, 'customer');
    res.json({ token, user: toPublicUser(user), cart: user.cart });
  });

  // Customer Logout
  app.post('/api/auth/logout', (req, res) => {
    const token = extractBearerToken(req);
    if (token) revokeSessionToken(token);
    res.json({ ok: true });
  });

  // Forgot Password / Reset Request (Does not leak account existence; hashes temporary code server-side)
  app.post('/api/auth/forgot-password', async (req, res) => {
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    await mutateStore((store) => {
      const user = store.users.find((u) => u.email === email);
      if (user) {
        const code = String(crypto.randomInt(100000, 999999));
        user.resetCodeHash = hashPassword(code);
        user.resetCodeExpiresAt = Date.now() + 15 * 60 * 1000;
      }
    });
    res.json({
      message:
        'If an account exists for that email address, password reset instructions have been queued. Contact support if you need immediate assistance.',
    });
  });

  // Get Authenticated Customer Profile
  app.get('/api/auth/me', requireCustomer, async (req: AuthenticatedRequest, res) => {
    const store = await getStore();
    const user = store.users.find((u) => u.id === req.authSession?.sub);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }
    res.json({ user: toPublicUser(user), cart: user.cart });
  });

  // Update Authenticated Customer Profile
  app.put('/api/auth/profile', requireCustomer, async (req: AuthenticatedRequest, res) => {
    const name = sanitizeText(req.body?.name, 80);

    if (name.length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }

    const updated = await mutateStore((store) => {
      const user = store.users.find((u) => u.id === req.authSession?.sub);
      if (!user) return null;
      user.name = name;
      return toPublicUser(user);
    });

    if (!updated) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }
    res.json({ user: updated });
  });

  // Persist Cart for Authenticated Customer
  app.put('/api/cart', requireCustomer, async (req: AuthenticatedRequest, res) => {
    const rawItems: unknown[] = Array.isArray(req.body?.items) ? req.body.items : [];
    const cleaned = rawItems
      .filter(
        (item: unknown): item is { bookId: string; quantity: number } =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { bookId?: unknown }).bookId === 'string' &&
          Number.isInteger((item as { quantity?: unknown }).quantity) &&
          (item as { quantity: number }).quantity > 0,
      )
      .slice(0, 50)
      .map((i: { bookId: string; quantity: number }) => ({
        bookId: sanitizeText(i.bookId, 64),
        quantity: Math.min(i.quantity, 25),
      }));

    const saved = await mutateStore((store) => {
      const user = store.users.find((u) => u.id === req.authSession?.sub);
      if (!user) return null;
      const validBookIds = new Set(store.books.map((b) => b.id));
      user.cart = cleaned.filter((c: { bookId: string; quantity: number }) =>
        validBookIds.has(c.bookId),
      );
      return user.cart;
    });

    if (!saved) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    res.json({ cart: saved });
  });

  // Toggle Wishlist Item for Authenticated Customer
  app.post('/api/wishlist/toggle', requireCustomer, async (req: AuthenticatedRequest, res) => {
    const bookId = sanitizeText(req.body?.bookId, 64);
    if (!bookId) {
      res.status(400).json({ error: 'bookId is required.' });
      return;
    }
    try {
      const wishlist = await mutateStore((store) => {
        const user = store.users.find((u) => u.id === req.authSession?.sub);
        if (!user) throw new Error('USER_NOT_FOUND');
        if (!store.books.some((b) => b.id === bookId)) throw new Error('BOOK_NOT_FOUND');

        if (user.wishlist.includes(bookId)) {
          user.wishlist = user.wishlist.filter((id) => id !== bookId);
        } else {
          user.wishlist.push(bookId);
        }
        return user.wishlist;
      });
      res.json({ wishlist });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      res.status(msg === 'BOOK_NOT_FOUND' ? 404 : 400).json({ error: 'Unable to update wishlist.' });
    }
  });

  // Place Order (Checkout) — Authoritative server pricing & stock check
  app.post('/api/orders', optionalCustomer, async (req: AuthenticatedRequest, res) => {
    const customerName = sanitizeText(req.body?.customerName, 100);
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    const paymentMethodRaw = sanitizeText(req.body?.paymentMethod, 30);
    const paymentMethod: PaymentMethod =
      paymentMethodRaw === 'Bank Transfer' ? 'Bank Transfer' : 'COD';
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

    if (customerName.length < 2 || !isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide your full name and a valid email address.' });
      return;
    }

    if (rawItems.length === 0) {
      res.status(400).json({ error: 'Your shopping cart is empty.' });
      return;
    }

    const requestedMap = new Map<string, number>();
    for (const entry of rawItems) {
      if (
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { bookId?: unknown }).bookId === 'string' &&
        Number.isInteger((entry as { quantity?: unknown }).quantity) &&
        (entry as { quantity: number }).quantity > 0
      ) {
        const bId = sanitizeText((entry as { bookId: string }).bookId, 64);
        const qty = Math.min((entry as { quantity: number }).quantity, 25);
        requestedMap.set(bId, (requestedMap.get(bId) || 0) + qty);
      }
    }

    if (requestedMap.size === 0) {
      res.status(400).json({ error: 'No valid books found in order.' });
      return;
    }

    try {
      const order = await mutateStore((store) => {
        const orderItems: OrderItem[] = [];
        for (const [bookId, qty] of requestedMap.entries()) {
          const book = store.books.find((b) => b.id === bookId);
          if (!book) throw new Error(`Book not found (${bookId}).`);
          if (book.stock < qty) {
            throw new Error(`Insufficient stock for "${book.title}". Only ${book.stock} left.`);
          }
          orderItems.push({
            bookId: book.id,
            slug: book.slug,
            title: book.title,
            author: book.author,
            coverImage: book.coverImage,
            price: book.price,
            quantity: qty,
          });
        }

        // Decrement stock after verifying all items
        for (const item of orderItems) {
          const book = store.books.find((b) => b.id === item.bookId)!;
          book.stock -= item.quantity;
        }

        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = calculateDeliveryFee(subtotal);
        const total = subtotal + deliveryFee;

        store.orderSequence += 1;
        const orderNumber = `BH-2026-${store.orderSequence}`;
        const receiptToken = crypto.randomBytes(16).toString('hex');
        const now = new Date().toISOString();

        const newOrder: Order = {
          id: `ord-${crypto.randomUUID().slice(0, 10)}`,
          orderNumber,
          userId: req.authSession?.sub || null,
          customerName,
          email,
          paymentMethod,
          paymentNote:
            paymentMethod === 'Bank Transfer'
              ? 'Manual Bank Transfer (Awaiting transfer receipt verification)'
              : 'Cash on Delivery (Pay upon parcel arrival)',
          items: orderItems,
          subtotal,
          deliveryFee,
          total,
          status: 'Pending',
          receiptToken,
          createdAt: now,
          updatedAt: now,
        };

        store.orders.unshift(newOrder);

        if (req.authSession?.sub) {
          const user = store.users.find((u) => u.id === req.authSession?.sub);
          if (user) {
            user.cart = [];
          }
        }

        return newOrder;
      });

      res.status(201).json({ order });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to place order.';
      res.status(400).json({ error: msg });
    }
  });

  // Customer Order History (Authenticated Customer Only)
  app.get('/api/orders', requireCustomer, async (req: AuthenticatedRequest, res) => {
    const store = await getStore();
    const orders = store.orders
      .filter((o) => o.userId === req.authSession?.sub)
      .map(({ receiptToken: _rt, ...safeOrder }) => safeOrder);
    res.json({ orders });
  });

  // Single Order Receipt (Authorized owner OR matching receiptToken)
  app.get('/api/orders/:orderNumber', optionalCustomer, async (req: AuthenticatedRequest, res) => {
    const orderNumber = sanitizeText(req.params.orderNumber, 40);
    const tokenParam = sanitizeText(req.query.token, 80);
    const store = await getStore();
    const order = store.orders.find((o) => o.orderNumber === orderNumber || o.id === orderNumber);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const isOwner = Boolean(req.authSession?.sub && order.userId === req.authSession.sub);
    const hasReceiptToken = Boolean(tokenParam && order.receiptToken && tokenParam === order.receiptToken);
    if (!isOwner && !hasReceiptToken) {
      res.status(403).json({ error: 'You are not authorized to view this order.' });
      return;
    }
    const { receiptToken: _rt, ...safeOrder } = order;
    res.json({ order: safeOrder });
  });

  // ========================
  // ADMIN AUTH & DASHBOARD
  // ========================

  app.get('/api/admin/status', async (_req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.json({ mode: 'env', configured: true });
      return;
    }
    const store = await getStore();
    if (store.adminPasscodeHash) {
      res.json({ mode: 'claimed', configured: true });
      return;
    }
    res.json({ mode: 'unclaimed', configured: false });
  });

  // First-Run Admin Setup / Claim (locks once claimed or if ADMIN_PASSCODE is set)
  app.post('/api/admin/claim', async (req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.status(403).json({ error: 'Admin passcode is already managed via environment configuration.' });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    if (passcode.length < 8) {
      res.status(400).json({ error: 'Admin passcode must be at least 8 characters.' });
      return;
    }
    try {
      await mutateStore((store) => {
        if (store.adminPasscodeHash) {
          throw new Error('ALREADY_CLAIMED');
        }
        store.adminPasscodeHash = hashPassword(passcode);
      });
      const token = signSessionToken('admin-root', 'admin', 60 * 60 * 12);
      res.status(201).json({ token });
    } catch (err) {
      if (err instanceof Error && err.message === 'ALREADY_CLAIMED') {
        res.status(409).json({ error: 'Admin access has already been claimed. Please sign in.' });
        return;
      }
      res.status(500).json({ error: 'Unable to configure admin passcode.' });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    if (!passcode) {
      res.status(400).json({ error: 'Admin passcode is required.' });
      return;
    }

    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      if (!verifyPlaintextSecret(passcode, envPasscode)) {
        res.status(401).json({ error: 'Invalid admin passcode.' });
        return;
      }
      const token = signSessionToken('admin-root', 'admin', 60 * 60 * 12);
      res.json({ token });
      return;
    }

    const store = await getStore();
    if (!store.adminPasscodeHash) {
      res.status(409).json({ error: 'Admin access has not been claimed yet.' });
      return;
    }
    if (!verifyPassword(passcode, store.adminPasscodeHash)) {
      res.status(401).json({ error: 'Invalid admin passcode.' });
      return;
    }
    const token = signSessionToken('admin-root', 'admin', 60 * 60 * 12);
    res.json({ token });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = extractBearerToken(req);
    if (token) revokeSessionToken(token);
    res.json({ ok: true });
  });

  // Admin Overview Metrics
  app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
    const store = await getStore();
    const totalRevenue = store.orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    const lowStockCount = store.books.filter((b) => b.stock <= 5).length;
    const recentOrders = store.orders.slice(0, 10).map(({ receiptToken: _rt, ...safe }) => safe);
    res.json({
      totalProducts: store.books.length,
      totalCustomers: store.users.length,
      totalOrders: store.orders.length,
      totalRevenue,
      lowStockCount,
      recentOrders,
    });
  });

  // Admin Upload Book Cover Image (Base64 PNG/JPEG/WEBP, max 2MB)
  app.post('/api/admin/upload-cover', requireAdmin, async (req, res) => {
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Please upload a valid PNG, JPEG, or WebP image.' });
      return;
    }
    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength === 0 || buffer.byteLength > 2 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size must be under 2 MB.' });
      return;
    }
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const filename = `cover_${crypto.randomUUID()}.${ext}`;
    const dest = path.resolve(UPLOADS_DIR, filename);
    if (!dest.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(403).json({ error: 'Invalid upload destination.' });
      return;
    }
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(dest, buffer);
    res.status(201).json({ url: `/uploads/${filename}` });
  });

  // Admin Create Book
  app.post('/api/admin/books', requireAdmin, async (req, res) => {
    const title = sanitizeText(req.body?.title, 140);
    const author = sanitizeText(req.body?.author, 100);
    const categorySlug = sanitizeText(req.body?.categorySlug, 80);
    const publisher = sanitizeText(req.body?.publisher, 100) || 'BOOK HUB Editions';
    const isbn = sanitizeText(req.body?.isbn, 40) || `978-969-${crypto.randomInt(1000, 9999)}-01-0`;
    const description = sanitizeText(req.body?.description, 2000);
    const price = Number(req.body?.price);
    const originalPriceRaw = req.body?.originalPrice ? Number(req.body.originalPrice) : undefined;
    const stock = Number(req.body?.stock);
    const coverImage = sanitizeText(req.body?.coverImage, 300);

    if (title.length < 2 || author.length < 2 || description.length < 10) {
      res.status(400).json({ error: 'Title, author, and description are required.' });
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      res.status(400).json({ error: 'Price must be a positive number in PKR.' });
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      res.status(400).json({ error: 'Stock must be a non-negative integer.' });
      return;
    }
    if (!isSafeMediaUrl(coverImage)) {
      res.status(400).json({ error: 'Please provide a valid book cover image URL or upload an image.' });
      return;
    }

    try {
      const created = await mutateStore((store) => {
        const category = store.categories.find((c) => c.slug === categorySlug);
        if (!category) throw new Error('CATEGORY_NOT_FOUND');

        let slug = slugify(title) || `book-${Date.now()}`;
        if (store.books.some((b) => b.slug === slug)) {
          slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
        }

        const newBook: Book = {
          id: `book-${crypto.randomUUID().slice(0, 8)}`,
          slug,
          title,
          author,
          categorySlug: category.slug,
          categoryName: category.name,
          publisher,
          isbn,
          description,
          price: Math.round(price),
          originalPrice:
            originalPriceRaw && Number.isFinite(originalPriceRaw) && originalPriceRaw > price
              ? Math.round(originalPriceRaw)
              : undefined,
          stock,
          rating: 5.0,
          reviewCount: 0,
          coverImage,
          featured: Boolean(req.body?.featured),
          bestseller: Boolean(req.body?.bestseller),
          newArrival: req.body?.newArrival !== false,
          pages: Number.isInteger(Number(req.body?.pages)) ? Number(req.body.pages) : 320,
          publishedYear: Number.isInteger(Number(req.body?.publishedYear))
            ? Number(req.body.publishedYear)
            : 2026,
          isDemoInventory: false,
          createdAt: new Date().toISOString(),
        };

        store.books.unshift(newBook);
        return newBook;
      });
      res.status(201).json({ book: created });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      res.status(400).json({ error: msg === 'CATEGORY_NOT_FOUND' ? 'Selected category does not exist.' : 'Unable to add book.' });
    }
  });

  // Admin Update Book
  app.put('/api/admin/books/:id', requireAdmin, async (req, res) => {
    const bookId = sanitizeText(req.params.id, 64);
    try {
      const updated = await mutateStore((store) => {
        const book = store.books.find((b) => b.id === bookId);
        if (!book) throw new Error('BOOK_NOT_FOUND');

        if (typeof req.body?.title === 'string') {
          const t = sanitizeText(req.body.title, 140);
          if (t.length >= 2) book.title = t;
        }
        if (typeof req.body?.author === 'string') {
          const a = sanitizeText(req.body.author, 100);
          if (a.length >= 2) book.author = a;
        }
        if (typeof req.body?.categorySlug === 'string') {
          const cat = store.categories.find((c) => c.slug === sanitizeText(req.body.categorySlug, 80));
          if (cat) {
            book.categorySlug = cat.slug;
            book.categoryName = cat.name;
          }
        }
        if (typeof req.body?.publisher === 'string') {
          book.publisher = sanitizeText(req.body.publisher, 100) || book.publisher;
        }
        if (typeof req.body?.isbn === 'string') {
          book.isbn = sanitizeText(req.body.isbn, 40) || book.isbn;
        }
        if (typeof req.body?.description === 'string') {
          const d = sanitizeText(req.body.description, 2000);
          if (d.length >= 10) book.description = d;
        }
        if (req.body?.price !== undefined) {
          const p = Number(req.body.price);
          if (Number.isFinite(p) && p > 0) book.price = Math.round(p);
        }
        if (req.body?.originalPrice !== undefined) {
          const op = Number(req.body.originalPrice);
          book.originalPrice = Number.isFinite(op) && op > book.price ? Math.round(op) : undefined;
        }
        if (req.body?.stock !== undefined) {
          const s = Number(req.body.stock);
          if (Number.isInteger(s) && s >= 0) book.stock = s;
        }
        if (typeof req.body?.coverImage === 'string' && isSafeMediaUrl(req.body.coverImage)) {
          book.coverImage = req.body.coverImage;
        }
        if (req.body?.featured !== undefined) book.featured = Boolean(req.body.featured);
        if (req.body?.bestseller !== undefined) book.bestseller = Boolean(req.body.bestseller);
        if (req.body?.newArrival !== undefined) book.newArrival = Boolean(req.body.newArrival);

        return book;
      });
      res.json({ book: updated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      res.status(msg === 'BOOK_NOT_FOUND' ? 404 : 400).json({ error: 'Unable to update book.' });
    }
  });

  // Admin Delete Book
  app.delete('/api/admin/books/:id', requireAdmin, async (req, res) => {
    const bookId = sanitizeText(req.params.id, 64);
    const removed = await mutateStore((store) => {
      const idx = store.books.findIndex((b) => b.id === bookId);
      if (idx === -1) return false;
      store.books.splice(idx, 1);
      return true;
    });
    if (!removed) {
      res.status(404).json({ error: 'Book not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // Admin Manage Categories
  app.post('/api/admin/categories', requireAdmin, async (req, res) => {
    const name = sanitizeText(req.body?.name, 80);
    const description = sanitizeText(req.body?.description, 300);
    const imageUrl =
      sanitizeText(req.body?.imageUrl, 300) ||
      '/src/assets/images/book_cover_computing_1795587849410.jpg';

    if (name.length < 2) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    if (!isSafeMediaUrl(imageUrl)) {
      res.status(400).json({ error: 'Invalid category image URL.' });
      return;
    }
    const slug = slugify(name);
    try {
      const category = await mutateStore((store) => {
        if (store.categories.some((c) => c.slug === slug)) {
          throw new Error('EXISTS');
        }
        const newCat = {
          id: `cat-${crypto.randomUUID().slice(0, 8)}`,
          name,
          slug,
          description: description || `Curated books in ${name}.`,
          imageUrl,
        };
        store.categories.push(newCat);
        return newCat;
      });
      res.status(201).json({ category });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      res.status(400).json({ error: msg === 'EXISTS' ? 'Category already exists.' : 'Unable to create category.' });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    const catId = sanitizeText(req.params.id, 64);
    try {
      await mutateStore((store) => {
        const cat = store.categories.find((c) => c.id === catId);
        if (!cat) throw new Error('NOT_FOUND');
        if (store.books.some((b) => b.categorySlug === cat.slug)) {
          throw new Error('IN_USE');
        }
        store.categories = store.categories.filter((c) => c.id !== catId);
      });
      res.json({ ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'IN_USE') {
        res.status(400).json({ error: 'Reassign or delete books in this category before deleting it.' });
        return;
      }
      res.status(404).json({ error: 'Category not found.' });
    }
  });

  // Admin Orders & Status Updates
  app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
    const store = await getStore();
    const orders = store.orders.map(({ receiptToken: _rt, ...safe }) => safe);
    res.json({ orders });
  });

  app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
    const orderId = sanitizeText(req.params.id, 64);
    const nextStatus = sanitizeText(req.body?.status, 30) as OrderStatus;
    if (!VALID_ORDER_STATUSES.includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const updated = await mutateStore((store) => {
      const order = store.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!order) return null;
      order.status = nextStatus;
      order.updatedAt = new Date().toISOString();
      const { receiptToken: _rt, ...safe } = order;
      return safe;
    });
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order: updated });
  });

  // Admin Reviews Moderation
  app.get('/api/admin/reviews', requireAdmin, async (_req, res) => {
    const store = await getStore();
    const bookTitles = new Map(store.books.map((b) => [b.id, b.title]));
    const reviews = store.reviews.map((r) => ({
      ...r,
      bookTitle: bookTitles.get(r.bookId) || 'Catalog Book',
    }));
    res.json({ reviews });
  });

  app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
    const reviewId = sanitizeText(req.params.id, 64);
    const removed = await mutateStore((store) => {
      const target = store.reviews.find((r) => r.id === reviewId);
      if (!target) return false;
      store.reviews = store.reviews.filter((r) => r.id !== reviewId);
      const book = store.books.find((b) => b.id === target.bookId);
      if (book) {
        const remaining = store.reviews.filter((r) => r.bookId === book.id);
        book.reviewCount = remaining.length;
        book.rating =
          remaining.length > 0
            ? Number((remaining.reduce((s, r) => s + r.rating, 0) / remaining.length).toFixed(1))
            : 5.0;
      }
      return true;
    });
    if (!removed) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // Vite integration in dev vs static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BOOK HUB server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BOOK HUB server:', err);
  process.exit(1);
});
