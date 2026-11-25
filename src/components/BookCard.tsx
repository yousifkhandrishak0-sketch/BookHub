import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Book } from '../types';
import { discountPercent, formatPKR } from '../utils/format';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const { navigate, addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(book.id);
  const discount = discountPercent(book.price, book.originalPrice);

  return (
    <article className="group flex flex-col rounded-xl bg-white border border-[#E2E7EE] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[3/4] w-full bg-[#F7F8FA] overflow-hidden">
        <a
          href={`/book/${book.slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/book/${book.slug}`);
          }}
          className="block h-full w-full"
          aria-label={`View details for ${book.title}`}
        >
          <BookCover
            src={book.coverImage}
            alt={`${book.title} by ${book.author} book cover`}
            title={book.title}
            author={book.author}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </a>

        <button
          type="button"
          onClick={() => void toggleWishlist(book.id)}
          aria-label={wishlisted ? `Remove ${book.title} from wishlist` : `Add ${book.title} to wishlist`}
          className={`absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173B67] ${
            wishlisted
              ? 'border-[#173B67] bg-[#173B67] text-white'
              : 'border-[#E2E7EE] bg-white/95 text-[#202A36] hover:border-[#173B67] hover:text-[#173B67]'
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#526071]">
          <a
            href={`/categories/${book.categorySlug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/categories/${book.categorySlug}`);
            }}
            className="truncate hover:text-[#173B67] transition-colors"
          >
            {book.categoryName}
          </a>
          <span className="inline-flex items-center gap-1 shrink-0 font-medium text-[#202A36] tabular-nums">
            <Star className="h-3.5 w-3.5 fill-[#D6A84F] text-[#D6A84F]" aria-hidden="true" />
            {book.rating.toFixed(1)}
          </span>
        </div>

        <h3 className="mt-2 font-serif text-base font-semibold leading-snug text-[#202A36] line-clamp-2">
          <a
            href={`/book/${book.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/book/${book.slug}`);
            }}
            className="hover:text-[#173B67] transition-colors"
          >
            {book.title}
          </a>
        </h3>

        <p className="mt-1 text-sm text-[#526071] truncate">{book.author}</p>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono text-base font-semibold text-[#173B67] tabular-nums">
              {formatPKR(book.price)}
            </span>
            {book.originalPrice && book.originalPrice > book.price && (
              <>
                <span className="font-mono text-xs text-[#6B7785] line-through tabular-nums">
                  {formatPKR(book.originalPrice)}
                </span>
                {discount && (
                  <span className="text-xs font-medium text-[#9A6F1C]">
                    Save {discount}%
                  </span>
                )}
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={book.stock <= 0}
              onClick={() => addToCart(book, 1, true)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#173B67] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#102B4B] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 whitespace-nowrap"
            >
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              {book.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <a
              href={`/book/${book.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/book/${book.slug}`);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-[#E2E7EE] px-3 py-2.5 text-xs font-medium text-[#202A36] transition-colors hover:border-[#173B67] hover:text-[#173B67] whitespace-nowrap shrink-0"
            >
              Details
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
