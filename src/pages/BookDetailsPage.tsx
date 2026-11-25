import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { BookCover } from '../components/BookCover';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';
import type { Book, Review } from '../types';
import { discountPercent, formatDate, formatPKR } from '../utils/format';

export function BookDetailsPage({ slug }: { slug: string }) {
  const {
    books,
    navigate,
    addToCart,
    toggleWishlist,
    isWishlisted,
    user,
    customerToken,
    notify,
    refreshCatalog,
  } = useStore();

  const [book, setBook] = useState<Book | null>(() => books.find((b) => b.slug === slug) || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setQuantity(1);
    fetch(`/api/books/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Book not found');
        return (await res.json()) as { book: Book; reviews: Review[]; related: Book[] };
      })
      .then((data) => {
        if (cancelled) return;
        setBook(data.book);
        setReviews(data.reviews);
        setRelated(data.related);
      })
      .catch(() => {
        if (!cancelled) setBook(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!book) return undefined;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: book.title,
        image: `${origin}${book.coverImage}`,
        description: book.description,
        isbn: book.isbn,
        brand: {
          '@type': 'Brand',
          name: book.publisher,
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'PKR',
          price: book.price,
          availability:
            book.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `${origin}/book/${book.slug}`,
        },
        aggregateRating:
          book.reviewCount > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: book.rating,
                reviewCount: book.reviewCount,
              }
            : undefined,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: book.categoryName,
            item: `${origin}/categories/${book.categorySlug}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: book.title,
            item: `${origin}/book/${book.slug}`,
          },
        ],
      },
    ];
  }, [book]);

  useSeo({
    title: book ? `${book.title} by ${book.author} | BOOK HUB` : 'Book Details | BOOK HUB',
    description: book
      ? `Buy ${book.title} by ${book.author} in Pakistan for ${formatPKR(book.price)}. ${book.description.slice(0, 110)}`
      : 'View book details, pricing in PKR, and reader reviews at BOOK HUB.',
    path: `/book/${slug}`,
    jsonLd,
  });

  if (loading && !book) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 animate-pulse rounded-2xl bg-white border border-[#E2E7EE]" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#173B67]">Book Not Found</h1>
        <p className="mt-3 text-sm text-[#526071]">
          The book you requested could not be found in our catalog.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(book.id);
  const discount = discountPercent(book.price, book.originalPrice);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToken) {
      notify('Please sign in to submit a customer review.', 'info');
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/books/${book.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const data = (await res.json()) as { review?: Review; book?: Book; error?: string };
      if (!res.ok || !data.review) {
        notify(data.error || 'Could not submit review.', 'error');
        return;
      }
      setReviews((prev) => [data.review!, ...prev]);
      if (data.book) setBook(data.book);
      setReviewComment('');
      notify('Thank you! Your review has been published.', 'success');
      void refreshCatalog();
    } catch {
      notify('Network error while submitting review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: book.categoryName, href: `/categories/${book.categorySlug}` },
          { label: book.title },
        ]}
      />

      {/* Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 rounded-2xl border border-[#E2E7EE] bg-white p-6 sm:p-8 lg:p-10">
        <div className="lg:col-span-5">
          <div className="aspect-[3/4] overflow-hidden rounded-xl border border-[#E2E7EE] bg-[#F7F8FA]">
            <BookCover
              src={book.coverImage}
              alt={`${book.title} by ${book.author}`}
              title={book.title}
              author={book.author}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#526071]">
            <a
              href={`/categories/${book.categorySlug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/categories/${book.categorySlug}`);
              }}
              className="font-semibold uppercase tracking-wider text-[#9A6F1C] hover:underline"
            >
              {book.categoryName}
            </a>
            <span aria-hidden="true">·</span>
            <span>{book.publisher}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">ISBN {book.isbn}</span>
          </div>

          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold leading-tight text-[#173B67]">
            {book.title}
          </h1>
          <p className="mt-2 text-base text-[#526071]">
            By <span className="font-medium text-[#202A36]">{book.author}</span>
          </p>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`h-4 w-4 ${
                    idx < Math.round(book.rating)
                      ? 'fill-[#D6A84F] text-[#D6A84F]'
                      : 'text-slate-300'
                  }`}
                  aria-hidden="true"
                />
              ))}
              <span className="ml-1 font-semibold text-[#202A36] tabular-nums">
                {book.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-[#526071] tabular-nums">
              ({book.reviewCount} {book.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3 border-y border-[#E2E7EE] py-5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[#173B67] tabular-nums">
              {formatPKR(book.price)}
            </span>
            {book.originalPrice && book.originalPrice > book.price && (
              <>
                <span className="font-mono text-base text-[#6B7785] line-through tabular-nums">
                  {formatPKR(book.originalPrice)}
                </span>
                {discount && (
                  <span className="text-sm font-semibold text-[#9A6F1C]">
                    Save {discount}%
                  </span>
                )}
              </>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm">
            <CheckCircle2
              className={`h-4 w-4 ${book.stock > 0 ? 'text-emerald-700' : 'text-red-700'}`}
              aria-hidden="true"
            />
            {book.stock > 0 ? (
              <span className="font-medium text-[#202A36]">
                In Stock ({book.stock} copies available)
              </span>
            ) : (
              <span className="font-medium text-red-700">Currently Out of Stock</span>
            )}
          </div>

          <p className="mt-5 text-sm sm:text-base leading-relaxed text-[#202A36]">
            {book.description}
          </p>

          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl bg-[#F7F8FA] p-4 text-xs">
            <div>
              <dt className="text-[#526071]">Publisher</dt>
              <dd className="mt-0.5 font-semibold text-[#202A36]">{book.publisher}</dd>
            </div>
            <div>
              <dt className="text-[#526071]">ISBN-13</dt>
              <dd className="mt-0.5 font-mono font-semibold text-[#202A36]">{book.isbn}</dd>
            </div>
            <div>
              <dt className="text-[#526071]">Format & Pages</dt>
              <dd className="mt-0.5 font-semibold text-[#202A36] tabular-nums">
                {book.pages || 320} pages · {book.publishedYear || 2025}
              </dd>
            </div>
          </dl>

          {/* Quantity & Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-lg border border-[#E2E7EE] bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-11 w-11 items-center justify-center text-[#202A36] hover:bg-[#F7F8FA]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(book.stock || 1, q + 1, 25))}
                disabled={quantity >= book.stock}
                aria-label="Increase quantity"
                className="flex h-11 w-11 items-center justify-center text-[#202A36] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={book.stock <= 0}
              onClick={() => addToCart(book, quantity, true)}
              className="flex-1 min-w-[160px] inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#173B67] px-6 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:bg-slate-300 disabled:text-slate-600 whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Add to Cart
            </button>

            <button
              type="button"
              disabled={book.stock <= 0}
              onClick={() => {
                addToCart(book, quantity, false);
                navigate('/checkout');
              }}
              className="flex-1 min-w-[140px] inline-flex h-11 items-center justify-center rounded-lg bg-[#D6A84F] px-6 text-sm font-semibold text-[#202A36] hover:bg-[#C7983E] disabled:opacity-50 whitespace-nowrap"
            >
              Buy Now
            </button>

            <button
              type="button"
              onClick={() => void toggleWishlist(book.id)}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                wishlisted
                  ? 'border-[#173B67] bg-[#173B67] text-white'
                  : 'border-[#E2E7EE] bg-white text-[#202A36] hover:border-[#173B67]'
              }`}
            >
              <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-[#526071]">
            <Truck className="h-4 w-4 text-[#173B67] shrink-0" aria-hidden="true" />
            <span>Cash on Delivery & Bank Transfer available · Free delivery on orders above PKR 3,500</span>
          </p>
        </div>
      </div>

      {/* Customer Reviews */}
      <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-[#E2E7EE] bg-white p-6">
            <h2 className="font-serif text-xl font-bold text-[#173B67]">Write a Review</h2>
            <p className="mt-1 text-xs text-[#526071]">
              Share your thoughts on print quality, content, and readability.
            </p>

            {user ? (
              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202A36] mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-1"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= reviewRating
                              ? 'fill-[#D6A84F] text-[#D6A84F]'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-comment" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                    Review Comment
                  </label>
                  <textarea
                    id="review-comment"
                    required
                    minLength={5}
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What stood out about this book?"
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] p-3 text-sm text-[#202A36] focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-lg bg-[#F7F8FA] p-4 text-sm text-[#526071]">
                <p>Sign in to your BOOK HUB account to leave a verified customer review.</p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="mt-3 rounded-lg bg-[#173B67] px-4 py-2 text-xs font-semibold text-white"
                >
                  Sign In to Review
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <h2 className="font-serif text-2xl font-bold text-[#173B67] mb-5">
            Customer Ratings & Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-[#E2E7EE] bg-white p-8 text-center text-sm text-[#526071]">
              No reviews yet. Be the first reader to review this edition.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="rounded-xl border border-[#E2E7EE] bg-white p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#202A36]">{rev.userName}</p>
                      <p className="text-xs text-[#526071]">{formatDate(rev.createdAt)}</p>
                    </div>
                    <div className="inline-flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3.5 w-3.5 ${
                            idx < rev.rating ? 'fill-[#D6A84F] text-[#D6A84F]' : 'text-slate-300'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#202A36]">{rev.comment}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Related Books */}
      {related.length > 0 && (
        <section className="mt-14 border-t border-[#E2E7EE] pt-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B67] mb-7">
            Related Books
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((rel) => (
              <BookCard key={rel.id} book={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
