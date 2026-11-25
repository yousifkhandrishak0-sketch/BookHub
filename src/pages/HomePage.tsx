import React, { useMemo, useState } from 'react';
import { ArrowRight, BookMarked, ShieldCheck, Truck } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { BookCover } from '../components/BookCover';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';

const TESTIMONIALS = [
  {
    name: 'Dr. Salman Waheed',
    role: 'Assistant Professor, Computer Science · Islamabad',
    quote:
      'Finding authentic hardcover editions of algorithms and systems books locally used to take weeks. BOOK HUB delivered three technical titles in 48 hours with crisp binding.',
  },
  {
    name: 'Sanaullah & Maryam Zubair',
    role: 'Home Library Collectors · Lahore',
    quote:
      'We ordered novels, Islamic philosophy, and history volumes together. Every book arrived sealed, undamaged, and exactly matched the catalog descriptions.',
  },
  {
    name: 'Fawad Ahmed',
    role: 'Software Engineering Lead · Karachi',
    quote:
      'Cash on Delivery worked smoothly and the category filtering made it effortless to pick engineering and leadership books for our team.',
  },
];

export function HomePage() {
  const { books, categories, navigate, notify } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BookStore',
      name: 'BOOK HUB',
      description:
        'Your World of Books – Discover, Read, Grow. Online bookstore in Pakistan offering Computer Science, Programming, Fiction, History, and Islamic books.',
      url: typeof window !== 'undefined' ? window.location.origin : '',
      priceRange: 'PKR 1,450 - PKR 5,800',
    }),
    [],
  );

  useSeo({
    title: 'BOOK HUB – Online Bookstore in Pakistan | Buy Books Online',
    description:
      'Discover your next favourite book at BOOK HUB. Buy computer science, programming, fiction, history, and Islamic books online in Pakistan with Cash on Delivery.',
    path: '/',
    jsonLd,
  });

  const featuredBooks = books.filter((b) => b.featured).slice(0, 4);
  const bestSellers = books.filter((b) => b.bestseller).slice(0, 4);
  const newArrivals = books.filter((b) => b.newArrival).slice(0, 4);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmittingNewsletter(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        notify(data.error || 'Could not subscribe.', 'error');
      } else {
        notify(data.message || 'Subscribed successfully.', 'success');
        setNewsletterEmail('');
      }
    } catch {
      notify('Network error while subscribing.', 'error');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="border-b border-[#E2E7EE] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9A6F1C]">
                Your World of Books – Discover, Read, Grow
              </p>
              <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-[#173B67]">
                Discover Your Next Favourite Book.
              </h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#526071]">
                Explore thousands of books across different genres—from computer science and software engineering to timeless literature, history, and personal growth.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="/shop"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/shop');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#173B67] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#102B4B] whitespace-nowrap"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="/categories"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/categories');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#173B67] bg-white px-6 py-3.5 text-sm font-semibold text-[#173B67] transition-colors hover:bg-[#F7F8FA] whitespace-nowrap"
                >
                  Explore Categories
                </a>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[#E2E7EE] pt-6">
                <div>
                  <p className="font-mono text-lg font-semibold text-[#173B67] tabular-nums">10+</p>
                  <p className="text-xs text-[#526071]">Curated Genres</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold text-[#173B67] tabular-nums">48 hr</p>
                  <p className="text-xs text-[#526071]">Major City Dispatch</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold text-[#173B67] tabular-nums">COD</p>
                  <p className="text-xs text-[#526071]">Nationwide Payment</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[280px] sm:min-h-[380px] overflow-hidden rounded-2xl border border-[#E2E7EE] bg-[#173B67]">
                <img
                  src="/src/assets/images/hero_bookstore_banner_1795587849123.jpg"
                  alt="BOOK HUB architectural bookstore interior with navy bookshelves and golden reading lamps"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#173B67]/65 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-xs font-medium text-[#D6A84F]">Curated Editions</p>
                    <p className="font-serif text-lg font-semibold">
                      Handpicked academic, literary & classic volumes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Books */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
              Editor&apos;s Selection
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#173B67]">
              Featured Books
            </h2>
          </div>
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              navigate('/shop');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#173B67] hover:text-[#9A6F1C] transition-colors whitespace-nowrap"
          >
            View all books
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* 3. Popular Categories */}
      <section className="border-y border-[#E2E7EE] bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
                Browse by Subject
              </p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#173B67]">
                Popular Categories
              </h2>
            </div>
            <a
              href="/categories"
              onClick={(e) => {
                e.preventDefault();
                navigate('/categories');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#173B67] hover:text-[#9A6F1C] transition-colors whitespace-nowrap"
            >
              All 10 categories
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/categories/${cat.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/categories/${cat.slug}`);
                }}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#E2E7EE] bg-[#F7F8FA] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#173B67] hover:shadow-sm"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-white">
                  <BookCover
                    src={cat.imageUrl}
                    alt={`${cat.name} books category`}
                    title={cat.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5">
                  <h3 className="font-serif text-sm font-semibold text-[#202A36] group-hover:text-[#173B67] line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#526071] tabular-nums">
                    {cat.bookCount ?? 0} {cat.bookCount === 1 ? 'title' : 'titles'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Best Sellers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
              Reader Favorites
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#173B67]">
              Best Sellers
            </h2>
          </div>
          <a
            href="/shop?sort=popular"
            onClick={(e) => {
              e.preventDefault();
              navigate('/shop?sort=popular');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#173B67] hover:text-[#9A6F1C] transition-colors whitespace-nowrap"
          >
            Shop best sellers
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* 5. Special Promotional Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
        <div className="overflow-hidden rounded-2xl bg-[#173B67] text-white border border-[#102B4B]">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D6A84F]">
                Special Reader Offer
              </p>
              <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold leading-tight">
                Build Your Personal Library with Free Delivery
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-200">
                Enjoy complimentary nationwide delivery on all orders above PKR 3,500—whether you are stocking up on Computer Science textbooks, Programming guides, or Fiction classics.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/15 pt-6 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
                  <span>Nationwide Courier</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
                  <span>Cash on Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
                  <span>Protective Packaging</span>
                </div>
              </div>
              <div className="mt-7">
                <a
                  href="/shop"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/shop');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D6A84F] px-6 py-3 text-sm font-semibold text-[#202A36] hover:bg-[#C7983E] transition-colors whitespace-nowrap"
                >
                  Browse Full Catalog
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 min-h-[260px]">
              <img
                src="/src/assets/images/promo_reading_desk_1795587849564.jpg"
                alt="Curated stack of hardcover books with brass bookmark on reading desk"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. New Arrivals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
              Fresh on the Shelves
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#173B67]">
              New Arrivals
            </h2>
          </div>
          <a
            href="/shop?sort=newest"
            onClick={(e) => {
              e.preventDefault();
              navigate('/shop?sort=newest');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#173B67] hover:text-[#9A6F1C] transition-colors whitespace-nowrap"
          >
            See latest titles
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* 7. Customer Testimonials */}
      <section className="border-t border-[#E2E7EE] bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
              Reader Stories
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#173B67]">
              Trusted by Students, Engineers & Readers Across Pakistan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item) => (
              <blockquote
                key={item.name}
                className="flex flex-col justify-between rounded-xl border border-[#E2E7EE] bg-[#F7F8FA] p-6"
              >
                <p className="text-sm leading-relaxed text-[#202A36]">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer className="mt-5 border-t border-[#E2E7EE] pt-4">
                  <p className="text-sm font-semibold text-[#173B67]">{item.name}</p>
                  <p className="text-xs text-[#526071]">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Newsletter Subscription */}
      <section className="border-t border-[#E2E7EE] bg-[#F7F8FA] py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
            Monthly Reading Dispatch
          </p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#173B67]">
            Stay Updated on New Arrivals & Curated Lists
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#526071]">
            Receive thoughtful reading recommendations and stock alerts on technical and literary editions. No spam.
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="mt-7 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address for newsletter"
              className="flex-1 rounded-lg border border-[#E2E7EE] bg-white px-4 py-3 text-sm text-[#202A36] placeholder:text-[#6B7785] focus:border-[#173B67] focus:outline-none"
            />
            <button
              type="submit"
              disabled={submittingNewsletter}
              className="rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {submittingNewsletter ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
