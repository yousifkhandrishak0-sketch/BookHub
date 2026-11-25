import React, { useCallback, useEffect, useState } from 'react';
import {
  BookPlus,
  FolderKanban,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Package,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import { BookCover } from '../components/BookCover';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';
import type {
  AdminOverview,
  AdminStatusResponse,
  Book,
  Order,
  OrderStatus,
  Review,
} from '../types';
import { formatDate, formatPKR } from '../utils/format';

type AdminTab = 'overview' | 'books' | 'categories' | 'orders' | 'reviews';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const STUDIO_COVERS = [
  { label: 'Computer Science (Navy Grid)', url: '/src/assets/images/book_cover_computing_1795587849410.jpg' },
  { label: 'Programming (Architecture)', url: '/src/assets/images/book_cover_programming_1795587849050.jpg' },
  { label: 'Business (Columns)', url: '/src/assets/images/book_cover_business_1795587849623.jpg' },
  { label: 'Fiction & Literature', url: '/src/assets/images/book_cover_fiction_1795587849080.jpg' },
  { label: 'Islamic Heritage', url: '/src/assets/images/book_cover_islamic_1795587849440.jpg' },
  { label: 'Science & Mathematics', url: '/src/assets/images/book_cover_science_1795587849129.jpg' },
  { label: 'History Archive', url: '/src/assets/images/book_cover_history_1795587849587.jpg' },
  { label: 'Self-Development', url: '/src/assets/images/book_cover_selfdev_1795587848981.jpg' },
];

export function AdminDashboardPage() {
  const { adminToken, setAdminToken, books, categories, refreshCatalog, notify } = useStore();

  const [adminStatus, setAdminStatus] = useState<AdminStatusResponse | null>(null);
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Book Form State (Add / Edit)
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categorySlug, setCategorySlug] = useState('computer-science');
  const [publisher, setPublisher] = useState('BOOK HUB Editions');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('2500');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('20');
  const [coverImage, setCoverImage] = useState(STUDIO_COVERS[0].url);
  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [newArrival, setNewArrival] = useState(true);
  const [savingBook, setSavingBook] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImg, setCatImg] = useState(STUDIO_COVERS[0].url);
  const [savingCat, setSavingCat] = useState(false);

  useSeo({
    title: 'Admin Dashboard | BOOK HUB',
    description: 'Protected store management portal for BOOK HUB inventory, categories, customer orders, and reviews.',
    path: '/admin',
  });

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        setAdminStatus((await res.json()) as AdminStatusResponse);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const loadAdminData = useCallback(async () => {
    if (!adminToken) return;
    const headers = { Authorization: `Bearer ${adminToken}` };
    const [ovRes, ordRes, revRes] = await Promise.all([
      fetch('/api/admin/overview', { headers }),
      fetch('/api/admin/orders', { headers }),
      fetch('/api/admin/reviews', { headers }),
    ]);

    if (ovRes.status === 401 || ovRes.status === 403) {
      setAdminToken(null);
      notify('Admin session expired. Please sign in again.', 'error');
      return;
    }

    if (ovRes.ok) setOverview((await ovRes.json()) as AdminOverview);
    if (ordRes.ok) {
      const data = (await ordRes.json()) as { orders: Order[] };
      setOrders(data.orders);
    }
    if (revRes.ok) {
      const data = (await revRes.json()) as { reviews: Review[] };
      setReviews(data.reviews);
    }
  }, [adminToken, notify, setAdminToken]);

  useEffect(() => {
    if (adminToken) {
      void loadAdminData();
    }
  }, [adminToken, loadAdminData]);

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length < 8) {
      notify('Passcode must be at least 8 characters.', 'error');
      return;
    }
    if (passcode !== confirmPasscode) {
      notify('Passcodes do not match.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        notify(data.error || 'Could not claim admin access.', 'error');
        void loadStatus();
        return;
      }
      setAdminToken(data.token);
      setPasscode('');
      setConfirmPasscode('');
      notify('Admin passcode configured and signed in.', 'success');
      void loadStatus();
    } catch {
      notify('Network error configuring admin.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        notify(data.error || 'Invalid admin passcode.', 'error');
        return;
      }
      setAdminToken(data.token);
      setPasscode('');
      notify('Signed in to Admin Portal.', 'success');
    } catch {
      notify('Network error signing in.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => undefined);
    }
    setAdminToken(null);
    notify('Admin session closed.', 'info');
  };

  const resetBookForm = () => {
    setEditingBookId(null);
    setTitle('');
    setAuthor('');
    setCategorySlug(categories[0]?.slug || 'computer-science');
    setPublisher('BOOK HUB Editions');
    setIsbn('');
    setDescription('');
    setPrice('2500');
    setOriginalPrice('');
    setStock('20');
    setCoverImage(STUDIO_COVERS[0].url);
    setFeatured(false);
    setBestseller(false);
    setNewArrival(true);
  };

  const startEditBook = (b: Book) => {
    setEditingBookId(b.id);
    setTitle(b.title);
    setAuthor(b.author);
    setCategorySlug(b.categorySlug);
    setPublisher(b.publisher);
    setIsbn(b.isbn);
    setDescription(b.description);
    setPrice(String(b.price));
    setOriginalPrice(b.originalPrice ? String(b.originalPrice) : '');
    setStock(String(b.stock));
    setCoverImage(b.coverImage);
    setFeatured(b.featured);
    setBestseller(b.bestseller);
    setNewArrival(b.newArrival);
    setTab('books');
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('Cover image must be under 2 MB.', 'error');
      return;
    }
    setUploadingCover(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Read error'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/upload-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ dataUrl }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        notify(data.error || 'Upload failed.', 'error');
        return;
      }
      setCoverImage(data.url);
      notify('Cover image uploaded successfully.', 'success');
    } catch {
      notify('Could not upload image.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setSavingBook(true);
    try {
      const payload = {
        title,
        author,
        categorySlug,
        publisher,
        isbn,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        stock: Number(stock),
        coverImage,
        featured,
        bestseller,
        newArrival,
      };
      const url = editingBookId ? `/api/admin/books/${editingBookId}` : '/api/admin/books';
      const method = editingBookId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify(data.error || 'Could not save book.', 'error');
        return;
      }
      notify(editingBookId ? 'Book updated.' : 'New book added to catalog.', 'success');
      resetBookForm();
      await Promise.all([refreshCatalog(), loadAdminData()]);
    } catch {
      notify('Network error saving book.', 'error');
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/books/${bookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      notify('Book removed from catalog.', 'info');
      await Promise.all([refreshCatalog(), loadAdminData()]);
    } else {
      notify('Could not delete book.', 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setSavingCat(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: catName, description: catDesc, imageUrl: catImg }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify(data.error || 'Could not add category.', 'error');
        return;
      }
      notify('Category created.', 'success');
      setCatName('');
      setCatDesc('');
      await refreshCatalog();
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/categories/${catId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      notify(data.error || 'Could not delete category.', 'error');
      return;
    }
    notify('Category deleted.', 'info');
    await refreshCatalog();
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      notify(`Order updated to ${status}.`, 'success');
      await loadAdminData();
    } else {
      notify('Could not update order status.', 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      notify('Review removed.', 'info');
      await Promise.all([loadAdminData(), refreshCatalog()]);
    }
  };

  // Render First-Run Claim or Admin Sign-In if not authenticated
  if (!adminToken) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-2xl border border-[#E2E7EE] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-[#173B67]">
            <Lock className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Protected Portal</span>
          </div>

          {adminStatus?.mode === 'unclaimed' ? (
            <>
              <h1 className="mt-3 font-serif text-2xl font-bold text-[#173B67]">
                Claim Admin Access
              </h1>
              <p className="mt-2 text-sm text-[#526071]">
                No admin passcode is configured yet. Set an initial administrator passcode (stored securely as a salted hash on the server) to manage BOOK HUB.
              </p>
              <form onSubmit={handleClaimAdmin} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="claim-pass" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                    Create Admin Passcode (min 8 chars)
                  </label>
                  <input
                    id="claim-pass"
                    type="password"
                    required
                    minLength={8}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="claim-confirm" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                    Confirm Admin Passcode
                  </label>
                  <input
                    id="claim-confirm"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-lg bg-[#173B67] px-5 py-3 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
                >
                  {authLoading ? 'Configuring...' : 'Set Passcode & Open Dashboard'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="mt-3 font-serif text-2xl font-bold text-[#173B67]">
                Admin Sign In
              </h1>
              <p className="mt-2 text-sm text-[#526071]">
                Enter the server-verified administrator passcode to manage books, inventory, orders, and reviews.
              </p>
              <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="admin-pass" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                    Administrator Passcode
                  </label>
                  <input
                    id="admin-pass"
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin passcode"
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-lg bg-[#173B67] px-5 py-3 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
                >
                  {authLoading ? 'Verifying...' : 'Sign In to Admin Portal'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7EE] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
            Store Operations
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#173B67]">
            BOOK HUB Admin Dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void handleAdminLogout()}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E2E7EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#202A36] hover:border-[#173B67] self-start"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Lock Admin Portal
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E2E7EE] pb-4">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'books', label: `Books & Inventory (${books.length})`, icon: BookPlus },
          { id: 'categories', label: `Categories (${categories.length})`, icon: FolderKanban },
          { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { id: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as AdminTab)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'bg-[#173B67] text-white'
                  : 'bg-white border border-[#E2E7EE] text-[#202A36] hover:bg-[#F7F8FA]'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && overview && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-xl border border-[#E2E7EE] bg-white p-5">
              <p className="text-xs font-medium text-[#526071]">Total Products</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#173B67] tabular-nums">
                {overview.totalProducts}
              </p>
              <p className="mt-1 text-xs text-[#526071] tabular-nums">
                {overview.lowStockCount} low-stock titles
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E7EE] bg-white p-5">
              <p className="text-xs font-medium text-[#526071]">Total Customers</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#173B67] tabular-nums">
                {overview.totalCustomers}
              </p>
              <p className="mt-1 text-xs text-[#526071]">Registered reader accounts</p>
            </div>
            <div className="rounded-xl border border-[#E2E7EE] bg-white p-5">
              <p className="text-xs font-medium text-[#526071]">Total Orders</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#173B67] tabular-nums">
                {overview.totalOrders}
              </p>
              <p className="mt-1 text-xs text-[#526071]">COD & Bank Transfer</p>
            </div>
            <div className="rounded-xl border border-[#E2E7EE] bg-white p-5">
              <p className="text-xs font-medium text-[#526071]">Total Revenue</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#173B67] tabular-nums">
                {formatPKR(overview.totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-[#526071]">Excluding cancelled orders</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E7EE] bg-white overflow-hidden">
            <div className="border-b border-[#E2E7EE] px-6 py-4">
              <h2 className="font-serif text-lg font-bold text-[#173B67]">Recent Orders</h2>
            </div>
            {overview.recentOrders.length === 0 ? (
              <p className="p-6 text-sm text-[#526071]">No orders placed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F8FA] text-xs text-[#526071]">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Order ID</th>
                      <th className="px-6 py-3 font-semibold">Customer</th>
                      <th className="px-6 py-3 font-semibold">Email</th>
                      <th className="px-6 py-3 font-semibold">Purchased Books</th>
                      <th className="px-6 py-3 font-semibold">Amount</th>
                      <th className="px-6 py-3 font-semibold">Payment</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EE]">
                    {overview.recentOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="px-6 py-3.5 font-mono font-semibold text-[#173B67] whitespace-nowrap">
                          {ord.orderNumber}
                        </td>
                        <td className="px-6 py-3.5">{ord.customerName}</td>
                        <td className="px-6 py-3.5 text-[#526071]">{ord.email}</td>
                        <td className="px-6 py-3.5 text-[#526071] max-w-xs truncate">
                          {ord.items.map((i) => `${i.title} × ${i.quantity}`).join(', ')}
                        </td>
                        <td className="px-6 py-3.5 font-mono tabular-nums whitespace-nowrap">
                          {formatPKR(ord.total)}
                        </td>
                        <td className="px-6 py-3.5 text-[#526071] whitespace-nowrap">
                          {ord.paymentMethod}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-[#173B67] whitespace-nowrap">
                          {ord.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Books & Inventory Tab */}
      {tab === 'books' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSaveBook}
              className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-[#173B67]">
                  {editingBookId ? 'Edit Book' : 'Add New Book'}
                </h2>
                {editingBookId && (
                  <button
                    type="button"
                    onClick={resetBookForm}
                    className="text-xs font-medium text-[#526071] hover:text-[#173B67]"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202A36] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202A36] mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202A36] mb-1">Category *</label>
                  <select
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202A36] mb-1">Publisher</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202A36] mb-1">ISBN</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-969-..."
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm font-mono focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202A36] mb-1">Price (PKR) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm font-mono focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202A36] mb-1">Original PKR</label>
                  <input
                    type="number"
                    min={0}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm font-mono focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202A36] mb-1">Stock *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm font-mono focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202A36] mb-1">
                  Description *
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] p-3 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#202A36]">
                  Book Cover Image
                </label>
                <select
                  value={STUDIO_COVERS.some((s) => s.url === coverImage) ? coverImage : ''}
                  onChange={(e) => {
                    if (e.target.value) setCoverImage(e.target.value);
                  }}
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm"
                >
                  <option value="">Select preset cover or upload below...</option>
                  {STUDIO_COVERS.map((c) => (
                    <option key={c.label} value={c.url}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-xs font-semibold text-[#173B67] hover:bg-white">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    {uploadingCover ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleUploadCover}
                      className="sr-only"
                    />
                  </label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="/src/assets/images/..."
                    className="flex-1 rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-[#202A36]">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bestseller}
                    onChange={(e) => setBestseller(e.target.checked)}
                  />
                  Best Seller
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newArrival}
                    onChange={(e) => setNewArrival(e.target.checked)}
                  />
                  New Arrival
                </label>
              </div>

              <button
                type="submit"
                disabled={savingBook}
                className="w-full rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
              >
                {savingBook ? 'Saving...' : editingBookId ? 'Update Book' : 'Add Book to Store'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#E2E7EE] bg-white overflow-hidden">
              <div className="border-b border-[#E2E7EE] px-6 py-4">
                <h2 className="font-serif text-lg font-bold text-[#173B67]">
                  Catalog & Inventory
                </h2>
              </div>
              <div className="divide-y divide-[#E2E7EE]">
                {books.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded border border-[#E2E7EE]">
                        <BookCover
                          src={b.coverImage}
                          alt={b.title}
                          title={b.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-sm font-semibold text-[#202A36] truncate">
                          {b.title}
                        </p>
                        <p className="text-xs text-[#526071] truncate">
                          {b.author} · {b.categoryName}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-[#173B67] tabular-nums">
                          {formatPKR(b.price)} · Stock: {b.stock}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditBook(b)}
                        aria-label={`Edit ${b.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E7EE] text-[#173B67] hover:bg-[#F7F8FA]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteBook(b.id)}
                        aria-label={`Delete ${b.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E7EE] text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <form
              onSubmit={handleCreateCategory}
              className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-4"
            >
              <h2 className="font-serif text-xl font-bold text-[#173B67]">Add Category</h2>
              <div>
                <label className="block text-xs font-semibold text-[#202A36] mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Urdu Poetry"
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#202A36] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] p-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#202A36] mb-1">Cover Art</label>
                <select
                  value={catImg}
                  onChange={(e) => setCatImg(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm"
                >
                  {STUDIO_COVERS.map((c) => (
                    <option key={c.label} value={c.url}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={savingCat}
                className="w-full rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-semibold text-white"
              >
                {savingCat ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-xl border border-[#E2E7EE] bg-white divide-y divide-[#E2E7EE]">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-serif text-base font-semibold text-[#202A36]">{cat.name}</p>
                    <p className="text-xs text-[#526071]">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-[#173B67] tabular-nums">
                      {cat.bookCount ?? 0} books
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCategory(cat.id)}
                      aria-label={`Delete ${cat.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E7EE] text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-[#E2E7EE] bg-white p-10 text-center text-sm text-[#526071]">
              No customer orders have been placed yet.
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E7EE] pb-4">
                  <div>
                    <p className="font-mono text-base font-bold text-[#173B67]">
                      {ord.orderNumber}
                    </p>
                    <p className="text-xs text-[#526071]">
                      {ord.customerName} · {ord.email}
                    </p>
                    <p className="text-xs text-[#526071]">
                      Placed on {formatDate(ord.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-[#202A36]">
                      Status
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          void handleOrderStatusChange(ord.id, e.target.value as OrderStatus)
                        }
                        className="ml-2 rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-1.5 text-sm font-medium text-[#173B67]"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                  <div className="text-[#526071]">
                    {ord.items.map((i) => `${i.title} × ${i.quantity}`).join(', ')}
                  </div>
                  <div className="font-mono font-bold text-[#173B67] tabular-nums">
                    {formatPKR(ord.total)} ({ord.paymentMethod})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="mt-8 rounded-xl border border-[#E2E7EE] bg-white divide-y divide-[#E2E7EE]">
          {reviews.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#526071]">No reviews yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-semibold text-[#173B67]">
                    {rev.bookTitle} · {rev.rating}/5 Stars
                  </p>
                  <p className="text-xs text-[#526071]">
                    By {rev.userName} on {formatDate(rev.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-[#202A36]">{rev.comment}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteReview(rev.id)}
                  aria-label="Delete review"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E7EE] text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
