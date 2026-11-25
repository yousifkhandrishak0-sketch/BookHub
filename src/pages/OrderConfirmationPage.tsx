import { useEffect, useState } from 'react';
import { CheckCircle2, PackageCheck, User } from 'lucide-react';
import { BookCover } from '../components/BookCover';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';
import type { Order } from '../types';
import { formatDate, formatPKR } from '../utils/format';

export function OrderConfirmationPage({ orderNumber }: { orderNumber: string }) {
  const { customerToken, lastOrderReceiptToken, navigate } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useSeo({
    title: `Order Confirmation ${orderNumber} | BOOK HUB`,
    description: 'View your BOOK HUB order confirmation, purchased books, customer details, and total amount.',
    path: `/order-confirmation/${orderNumber}`,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const tokenParam = lastOrderReceiptToken[orderNumber];
    const query = tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : '';
    const headers: Record<string, string> = {};
    if (customerToken) headers.Authorization = `Bearer ${customerToken}`;

    fetch(`/api/orders/${encodeURIComponent(orderNumber)}${query}`, { headers })
      .then(async (res) => {
        const data = (await res.json()) as { order?: Order; error?: string };
        if (!res.ok || !data.order) throw new Error(data.error || 'Order not found');
        if (!cancelled) setOrder(data.order);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load order.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customerToken, lastOrderReceiptToken, orderNumber]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-72 animate-pulse rounded-2xl border border-[#E2E7EE] bg-white" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#173B67]">Order Receipt Unavailable</h1>
        <p className="mt-3 text-sm text-[#526071]">{error || 'Please sign in to view your order history.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go to My Account
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="rounded-lg border border-[#E2E7EE] bg-white px-5 py-2.5 text-sm font-semibold text-[#202A36]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-2xl border border-[#E2E7EE] bg-white p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7EE] pb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Order Confirmed
              </p>
              <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#173B67]">
                Thank you, {order.customerName}
              </h1>
              <p className="mt-1 text-sm text-[#526071]">
                Placed on {formatDate(order.createdAt)} · Status:{' '}
                <strong className="text-[#173B67]">{order.status}</strong>
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-left sm:text-right">
            <p className="text-xs text-[#526071]">Order ID</p>
            <p className="font-mono text-base font-bold text-[#173B67]">{order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="rounded-xl bg-[#F7F8FA] p-5 space-y-1.5">
            <h2 className="flex items-center gap-2 font-semibold text-[#173B67]">
              <User className="h-4 w-4" aria-hidden="true" />
              Customer Information
            </h2>
            <p className="font-medium text-[#202A36]">{order.customerName}</p>
            <p className="text-[#526071]">{order.email}</p>
          </div>

          <div className="rounded-xl bg-[#F7F8FA] p-5 space-y-1.5">
            <h2 className="flex items-center gap-2 font-semibold text-[#173B67]">
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              Payment & Fulfillment
            </h2>
            <p className="font-medium text-[#202A36]">{order.paymentMethod}</p>
            <p className="text-xs text-[#526071] leading-relaxed">{order.paymentNote}</p>
            {order.paymentMethod === 'Bank Transfer' && (
              <p className="font-mono text-xs text-[#173B67] pt-1">
                Reference: {order.orderNumber} · Meezan Bank (PK00MEZN000123456789)
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-[#173B67] mb-4">Purchased Books</h2>
          <ul className="divide-y divide-[#E2E7EE] border-y border-[#E2E7EE]">
            {order.items.map((item) => (
              <li key={item.bookId} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded border border-[#E2E7EE] bg-[#F7F8FA]">
                    <BookCover
                      src={item.coverImage}
                      alt={item.title}
                      title={item.title}
                      author={item.author}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-semibold text-[#202A36] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#526071]">
                      {item.author} · Qty {item.quantity} × {formatPKR(item.price)}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-[#173B67] tabular-nums shrink-0">
                  {formatPKR(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-[#526071]">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums text-[#202A36]">{formatPKR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#526071]">
            <span>Delivery Charges</span>
            <span className="font-mono tabular-nums text-[#202A36]">
              {order.deliveryFee === 0 ? 'Free' : formatPKR(order.deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#E2E7EE] pt-2 text-base font-bold text-[#173B67]">
            <span>Total Paid / Due</span>
            <span className="font-mono tabular-nums">{formatPKR(order.total)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white hover:bg-[#102B4B]"
          >
            Continue Shopping
          </button>
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="rounded-lg border border-[#E2E7EE] bg-white px-6 py-3 text-sm font-semibold text-[#202A36] hover:border-[#173B67]"
          >
            View My Orders
          </button>
        </div>
      </div>
    </div>
  );
}
