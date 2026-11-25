import React, { useEffect, useState } from 'react';
import { Banknote, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';
import type { Order, PaymentMethod } from '../types';
import { formatPKR, getDeliveryFee } from '../utils/format';

export function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    user,
    customerToken,
    clearCart,
    refreshCatalog,
    navigate,
    notify,
    saveOrderReceiptToken,
  } = useStore();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  useSeo({
    title: 'Checkout – Customer Details & Payment | BOOK HUB',
    description:
      'Complete your BOOK HUB book order with your name, email address, and Cash on Delivery or manual Bank Transfer.',
    path: '/checkout',
  });

  const deliveryFee = getDeliveryFee(cartSubtotal);
  const total = cartSubtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#173B67]">Your Cart is Empty</h1>
        <p className="mt-3 text-sm text-[#526071]">
          Add at least one book to your cart before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white"
        >
          Browse Books
        </button>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customerToken) headers.Authorization = `Bearer ${customerToken}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName,
          email,
          paymentMethod,
          items: cart.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        }),
      });

      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        notify(data.error || 'Could not place order.', 'error');
        return;
      }

      if (data.order.receiptToken) {
        saveOrderReceiptToken(data.order.orderNumber, data.order.receiptToken);
      }
      clearCart();
      void refreshCatalog();
      notify(`Order ${data.order.orderNumber} placed successfully.`, 'success');
      navigate(`/order-confirmation/${data.order.orderNumber}`);
    } catch {
      notify('Network error while placing order.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs
        items={[
          { label: 'Shopping Cart', href: '/cart' },
          { label: 'Checkout' },
        ]}
      />

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173B67]">Checkout</h1>
      <p className="mt-2 text-sm text-[#526071]">
        Enter your full name and email address below. Choose Cash on Delivery or manual Bank Transfer.
      </p>

      <form onSubmit={handleSubmitOrder} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Information */}
          <section className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#173B67]">Customer Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ayesha Khan"
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="chk-email" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                  Email Address *
                </label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ayesha@example.com"
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#173B67]">Payment Method</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                  paymentMethod === 'COD'
                    ? 'border-[#173B67] bg-[#F7F8FA]'
                    : 'border-[#E2E7EE] bg-white hover:border-[#173B67]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <Banknote className="h-5 w-5 text-[#173B67]" aria-hidden="true" />
                  {paymentMethod === 'COD' && (
                    <CheckCircle2 className="h-4 w-4 text-[#173B67]" aria-hidden="true" />
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-[#202A36]">Cash on Delivery (COD)</p>
                <p className="mt-1 text-xs text-[#526071]">
                  Pay in cash when your order arrives.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Bank Transfer')}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                  paymentMethod === 'Bank Transfer'
                    ? 'border-[#173B67] bg-[#F7F8FA]'
                    : 'border-[#E2E7EE] bg-white hover:border-[#173B67]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <Building2 className="h-5 w-5 text-[#173B67]" aria-hidden="true" />
                  {paymentMethod === 'Bank Transfer' && (
                    <CheckCircle2 className="h-4 w-4 text-[#173B67]" aria-hidden="true" />
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-[#202A36]">
                  Bank Transfer (Manual Payment)
                </p>
                <p className="mt-1 text-xs text-[#526071]">
                  Place your order now and transfer manually after receiving your Order ID.
                </p>
              </button>
            </div>

            {paymentMethod === 'Bank Transfer' && (
              <div className="rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] p-4 text-xs text-[#202A36] space-y-1">
                <p className="font-semibold text-[#173B67]">
                  Manual Bank Transfer Instructions
                </p>
                <p>
                  No online card gateway is charged at checkout. After placing your order, please reference your unique Order ID when sending your transfer to:
                </p>
                <p className="font-mono pt-1">
                  Account Title: BOOK HUB Bookstore · Bank: Meezan Bank (Demo IBAN: PK00MEZN000123456789)
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <aside className="lg:col-span-5">
          <div className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-5 sticky top-24">
            <h2 className="font-serif text-xl font-bold text-[#173B67]">Order Summary</h2>

            <ul className="divide-y divide-[#E2E7EE] max-h-72 overflow-y-auto">
              {cart.map((item) => {
                const book = item.book!;
                return (
                  <li key={book.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-[#202A36] truncate">{book.title}</p>
                      <p className="text-xs text-[#526071] tabular-nums">
                        Qty {item.quantity} × {formatPKR(book.price)}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-[#173B67] shrink-0 tabular-nums">
                      {formatPKR(book.price * item.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-2 border-t border-[#E2E7EE] pt-4 text-sm">
              <div className="flex justify-between text-[#526071]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#202A36]">{formatPKR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-[#526071]">
                <span>Delivery Fee</span>
                <span className="font-mono tabular-nums text-[#202A36]">
                  {deliveryFee === 0 ? 'Free' : formatPKR(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E2E7EE] pt-3 text-lg font-bold text-[#173B67]">
                <span>Total Amount</span>
                <span className="font-mono tabular-nums">{formatPKR(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#D6A84F] px-5 py-3.5 text-sm font-semibold text-[#202A36] hover:bg-[#C7983E] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Placing Order...' : `Place Order (${formatPKR(total)})`}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-[#526071]">
              <ShieldCheck className="h-4 w-4 text-[#173B67]" aria-hidden="true" />
              <span>Order totals and stock are verified securely on the server.</span>
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
