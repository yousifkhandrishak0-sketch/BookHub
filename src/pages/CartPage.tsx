import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { BookCover } from '../components/BookCover';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';
import { DELIVERY_FREE_THRESHOLD, formatPKR, getDeliveryFee } from '../utils/format';

export function CartPage() {
  const {
    cart,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    navigate,
  } = useStore();

  useSeo({
    title: 'Shopping Cart | BOOK HUB',
    description: 'Review the books in your BOOK HUB shopping cart, adjust quantities, and proceed to checkout.',
    path: '/cart',
  });

  const deliveryFee = getDeliveryFee(cartSubtotal);
  const total = cartSubtotal + deliveryFee;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={[{ label: 'Shopping Cart' }]} />

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173B67]">
        Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#E2E7EE] bg-white p-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-[#9AA5B4]" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-xl font-semibold text-[#202A36]">
            Your shopping cart is empty
          </h2>
          <p className="mt-2 text-sm text-[#526071]">
            Explore our collection of computer science, programming, literature, and history books.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white hover:bg-[#102B4B]"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl border border-[#E2E7EE] bg-white divide-y divide-[#E2E7EE]">
              {cart.map((item) => {
                const book = item.book!;
                return (
                  <div
                    key={book.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-5"
                  >
                    <a
                      href={`/book/${book.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/book/${book.slug}`);
                      }}
                      className="h-28 w-21 shrink-0 overflow-hidden rounded-lg border border-[#E2E7EE] bg-[#F7F8FA]"
                    >
                      <BookCover
                        src={book.coverImage}
                        alt={book.title}
                        title={book.title}
                        author={book.author}
                        className="h-full w-full object-cover"
                      />
                    </a>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#526071]">{book.categoryName}</p>
                      <a
                        href={`/book/${book.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/book/${book.slug}`);
                        }}
                        className="mt-0.5 block font-serif text-lg font-semibold text-[#202A36] hover:text-[#173B67]"
                      >
                        {book.title}
                      </a>
                      <p className="text-sm text-[#526071]">{book.author}</p>
                      <p className="mt-1 font-mono text-sm text-[#173B67] tabular-nums">
                        Unit price: {formatPKR(book.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                      <div className="inline-flex items-center rounded-lg border border-[#E2E7EE]">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(book.id, item.quantity - 1)}
                          aria-label={`Decrease quantity for ${book.title}`}
                          className="flex h-9 w-9 items-center justify-center hover:bg-[#F7F8FA]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center font-mono text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(book.id, item.quantity + 1)}
                          disabled={item.quantity >= book.stock}
                          aria-label={`Increase quantity for ${book.title}`}
                          className="flex h-9 w-9 items-center justify-center hover:bg-[#F7F8FA] disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-base font-bold text-[#173B67] tabular-nums">
                          {formatPKR(book.price * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(book.id)}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-[#526071] hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#173B67] hover:text-[#9A6F1C]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Continue Shopping
            </button>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-5">
              <h2 className="font-serif text-xl font-bold text-[#173B67]">Order Summary</h2>

              <div className="space-y-3 text-sm border-b border-[#E2E7EE] pb-4">
                <div className="flex justify-between text-[#526071]">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-[#202A36] tabular-nums">
                    {formatPKR(cartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#526071]">
                  <span>Delivery Charges</span>
                  <span className="font-mono font-medium text-[#202A36] tabular-nums">
                    {deliveryFee === 0 ? 'Free' : formatPKR(deliveryFee)}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-[#526071]">
                    Free delivery applies automatically on orders of{' '}
                    <span className="font-mono">{formatPKR(DELIVERY_FREE_THRESHOLD)}</span> or more.
                  </p>
                )}
              </div>

              <div className="flex justify-between text-lg font-bold text-[#173B67]">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatPKR(total)}</span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#D6A84F] px-5 py-3 text-sm font-semibold text-[#202A36] hover:bg-[#C7983E] transition-colors"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
