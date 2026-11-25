import React, { useEffect, useMemo, useState } from 'react';
import { Heart, LogOut, Package, User as UserIcon } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';
import type { Order, UserProfile } from '../types';
import { formatDate, formatPKR } from '../utils/format';

type AccountTab = 'profile' | 'orders' | 'wishlist';

export function CustomerDashboardPage() {
  const {
    user,
    customerToken,
    setCustomerSession,
    logoutCustomer,
    books,
    navigate,
    notify,
    currentSearch,
  } = useStore();

  const initialTab = useMemo(() => {
    const p = new URLSearchParams(currentSearch).get('tab');
    return p === 'wishlist' || p === 'orders' ? p : 'profile';
  }, [currentSearch]);

  const [tab, setTab] = useState<AccountTab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (!customerToken) return;
    setLoadingOrders(true);
    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { orders: Order[] };
        setOrders(data.orders);
      })
      .finally(() => setLoadingOrders(false));
  }, [customerToken]);

  useSeo({
    title: 'My Account – Orders, Profile & Wishlist | BOOK HUB',
    description: 'Manage your BOOK HUB personal information, track order statuses, and view wishlisted books.',
    path: '/account',
  });

  if (!user || !customerToken) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#173B67]">Customer Dashboard</h1>
        <p className="mt-3 text-sm text-[#526071]">
          Please sign in to view your profile, saved wishlist, and order history.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="rounded-lg border border-[#E2E7EE] bg-white px-6 py-3 text-sm font-semibold text-[#202A36]"
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  const wishlistBooks = books.filter((b) => user.wishlist.includes(b.id));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { user?: UserProfile; error?: string };
      if (!res.ok || !data.user) {
        notify(data.error || 'Unable to update profile.', 'error');
        return;
      }
      setCustomerSession(customerToken, data.user);
      notify('Profile updated successfully.', 'success');
    } catch {
      notify('Network error while saving profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={[{ label: 'My Account' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7EE] pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#173B67]">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-sm text-[#526071]">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={() => void logoutCustomer().then(() => navigate('/'))}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E2E7EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#202A36] hover:border-[#173B67] self-start"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E2E7EE] pb-4">
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'profile'
              ? 'bg-[#173B67] text-white'
              : 'bg-white border border-[#E2E7EE] text-[#202A36] hover:bg-[#F7F8FA]'
          }`}
        >
          <UserIcon className="h-4 w-4" aria-hidden="true" />
          Profile
        </button>
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'orders'
              ? 'bg-[#173B67] text-white'
              : 'bg-white border border-[#E2E7EE] text-[#202A36] hover:bg-[#F7F8FA]'
          }`}
        >
          <Package className="h-4 w-4" aria-hidden="true" />
          Order History ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('wishlist')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'wishlist'
              ? 'bg-[#173B67] text-white'
              : 'bg-white border border-[#E2E7EE] text-[#202A36] hover:bg-[#F7F8FA]'
          }`}
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
          Wishlist ({wishlistBooks.length})
        </button>
      </div>

      <div className="mt-8">
        {tab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className="max-w-2xl rounded-xl border border-[#E2E7EE] bg-white p-6 sm:p-8 space-y-5"
          >
            <h2 className="font-serif text-xl font-bold text-[#173B67]">Personal Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-name" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                  Full Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="prof-email" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                  Email Address
                </label>
                <input
                  id="prof-email"
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm text-[#526071] cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-[#173B67] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            {loadingOrders ? (
              <div className="h-40 animate-pulse rounded-xl border border-[#E2E7EE] bg-white" />
            ) : orders.length === 0 ? (
              <div className="rounded-xl border border-[#E2E7EE] bg-white p-10 text-center">
                <p className="font-serif text-lg font-semibold text-[#173B67]">
                  You have not placed any orders yet
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="mt-4 rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Start Exploring Books
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E7EE] pb-4">
                    <div>
                      <p className="font-mono text-base font-bold text-[#173B67]">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-[#526071]">
                        Placed on {formatDate(order.createdAt)} · {order.paymentMethod}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-[#526071]">Status</p>
                      <p className="text-sm font-semibold text-[#173B67]">{order.status}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {order.items.map((item) => (
                      <div key={item.bookId} className="flex justify-between gap-4">
                        <span className="text-[#202A36]">
                          {item.title} × {item.quantity}
                        </span>
                        <span className="font-mono tabular-nums text-[#526071]">
                          {formatPKR(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E2E7EE] pt-4 text-sm">
                    <span className="text-xs text-[#526071]">
                      {order.customerName} · {order.email}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-base font-bold text-[#173B67] tabular-nums">
                        Total: {formatPKR(order.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/order-confirmation/${order.orderNumber}`)}
                        className="rounded-lg border border-[#E2E7EE] px-3 py-1.5 text-xs font-semibold text-[#173B67] hover:border-[#173B67]"
                      >
                        Order Details
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {tab === 'wishlist' && (
          <div>
            {wishlistBooks.length === 0 ? (
              <div className="rounded-xl border border-[#E2E7EE] bg-white p-10 text-center">
                <p className="font-serif text-lg font-semibold text-[#173B67]">
                  Your wishlist is empty
                </p>
                <p className="mt-1 text-sm text-[#526071]">
                  Tap the heart icon on any book to save it for later.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="mt-4 rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Explore Books
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
