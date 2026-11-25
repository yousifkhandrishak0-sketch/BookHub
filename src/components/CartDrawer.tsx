import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DELIVERY_FREE_THRESHOLD, formatPKR, getDeliveryFee } from '../utils/format';
import { BookCover } from './BookCover';

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    navigate,
  } = useStore();

  if (!cartOpen) return null;

  const deliveryFee = getDeliveryFee(cartSubtotal);
  const total = cartSubtotal + deliveryFee;
  const remainingForFree = Math.max(0, DELIVERY_FREE_THRESHOLD - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div
        className="fixed inset-0 bg-[#202A36]/50 backdrop-blur-[1px]"
        onClick={() => setCartOpen(false)}
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E7EE] px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#173B67]" aria-hidden="true" />
            <h2 className="font-serif text-lg font-semibold text-[#202A36]">Your Cart</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart drawer"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#526071] hover:bg-[#F7F8FA] hover:text-[#202A36]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-[#E2E7EE] bg-[#F7F8FA] px-6 py-2.5 text-xs text-[#202A36]">
          {remainingForFree > 0 ? (
            <span>
              Add <strong className="font-mono">{formatPKR(remainingForFree)}</strong> more for free nationwide delivery.
            </span>
          ) : (
            <span className="font-medium text-[#173B67]">
              Your order qualifies for free delivery across Pakistan.
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="h-10 w-10 text-[#9AA5B4]" aria-hidden="true" />
              <p className="mt-4 font-serif text-lg font-semibold text-[#202A36]">
                Your cart is empty
              </p>
              <p className="mt-1 text-sm text-[#526071]">
                Browse our catalog to find your next favorite read.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/shop');
                }}
                className="mt-6 rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102B4B]"
              >
                Explore Books
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#E2E7EE]">
              {cart.map((item) => {
                const book = item.book!;
                return (
                  <li key={book.id} className="flex gap-4 py-4">
                    <div className="h-24 w-18 shrink-0 overflow-hidden rounded-lg border border-[#E2E7EE] bg-[#F7F8FA]">
                      <BookCover
                        src={book.coverImage}
                        alt={book.title}
                        title={book.title}
                        author={book.author}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col min-w-0">
                      <a
                        href={`/book/${book.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setCartOpen(false);
                          navigate(`/book/${book.slug}`);
                        }}
                        className="font-serif text-sm font-semibold text-[#202A36] hover:text-[#173B67] line-clamp-2"
                      >
                        {book.title}
                      </a>
                      <p className="text-xs text-[#526071] truncate">{book.author}</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#173B67] tabular-nums">
                        {formatPKR(book.price * item.quantity)}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="inline-flex items-center rounded-lg border border-[#E2E7EE]">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(book.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${book.title}`}
                            className="flex h-8 w-8 items-center justify-center text-[#202A36] hover:bg-[#F7F8FA]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono text-xs font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(book.id, item.quantity + 1)}
                            disabled={item.quantity >= book.stock}
                            aria-label={`Increase quantity of ${book.title}`}
                            className="flex h-8 w-8 items-center justify-center text-[#202A36] hover:bg-[#F7F8FA] disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(book.id)}
                          aria-label={`Remove ${book.title}`}
                          className="inline-flex items-center gap-1 text-xs text-[#526071] hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[#E2E7EE] bg-[#F7F8FA] px-6 py-5 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#526071]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#202A36]">{formatPKR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-[#526071]">
                <span>Delivery Charges</span>
                <span className="font-mono tabular-nums text-[#202A36]">
                  {deliveryFee === 0 ? 'Free' : formatPKR(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E2E7EE] pt-2 text-base font-semibold text-[#173B67]">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatPKR(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/cart');
                }}
                className="rounded-lg border border-[#173B67] bg-white px-4 py-2.5 text-sm font-semibold text-[#173B67] hover:bg-[#F7F8FA] whitespace-nowrap"
              >
                View Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/checkout');
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D6A84F] px-4 py-2.5 text-sm font-semibold text-[#202A36] hover:bg-[#C7983E] whitespace-nowrap"
              >
                Checkout
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
