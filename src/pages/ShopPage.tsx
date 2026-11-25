import { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';

export function ShopPage() {
  const { books, categories, catalogLoading, currentSearch, navigate } = useStore();
  const params = useMemo(() => new URLSearchParams(currentSearch), [currentSearch]);

  const [query, setQuery] = useState(params.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(params.get('category') || 'all');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(Number(params.get('minRating')) || 0);
  const [sortBy, setSortBy] = useState(params.get('sort') || 'popular');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQuery(params.get('q') || '');
    setSelectedCategory(params.get('category') || 'all');
    setSortBy(params.get('sort') || 'popular');
  }, [params]);

  useSeo({
    title: 'Shop Books Online – Computer Science, Fiction & More | BOOK HUB',
    description:
      'Browse and buy books online at BOOK HUB Pakistan. Filter by category, price in PKR, customer ratings, and newest arrivals.',
    path: '/shop',
  });

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minP = Number(minPrice);
    const maxP = Number(maxPrice);

    let list = books.filter((b) => {
      if (q) {
        const hit =
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.categoryName.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (selectedCategory !== 'all' && b.categorySlug !== selectedCategory) return false;
      if (minPrice && Number.isFinite(minP) && b.price < minP) return false;
      if (maxPrice && Number.isFinite(maxP) && b.price > maxP) return false;
      if (minRating > 0 && b.rating < minRating) return false;
      return true;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } else {
      list = [...list].sort(
        (a, b) => b.rating * (b.reviewCount + 1) - a.rating * (a.reviewCount + 1),
      );
    }

    return list;
  }, [books, maxPrice, minPrice, minRating, query, selectedCategory, sortBy]);

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setSortBy('popular');
    navigate('/shop');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={[{ label: 'Shop' }]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E7EE] pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173B67]">
            Shop All Books
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#526071]">
            Browse our full demonstration catalog of best books in Pakistan across 10 curated genres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="inline-flex lg:hidden items-center gap-2 rounded-lg border border-[#E2E7EE] bg-white px-4 py-2.5 text-sm font-medium text-[#202A36]"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
          </button>

          <label className="flex items-center gap-2 text-sm text-[#526071]">
            <span className="hidden sm:inline whitespace-nowrap">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort books"
              className="rounded-lg border border-[#E2E7EE] bg-white px-3 py-2 text-sm font-medium text-[#202A36] focus:border-[#173B67] focus:outline-none"
            >
              <option value="popular">Popularity</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Sidebar */}
        <aside
          className={`lg:col-span-3 space-y-6 ${
            filtersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="rounded-xl border border-[#E2E7EE] bg-white p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#173B67]">
                <Filter className="h-4 w-4" aria-hidden="true" />
                Refine Catalog
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#526071] hover:text-[#173B67]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            {/* Search */}
            <div>
              <label htmlFor="shop-search" className="block text-xs font-semibold text-[#202A36] mb-2">
                Search Books
              </label>
              <div className="flex items-center rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 focus-within:border-[#173B67] focus-within:bg-white">
                <Search className="h-4 w-4 text-[#526071] shrink-0" aria-hidden="true" />
                <input
                  id="shop-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Title, author, ISBN..."
                  className="w-full bg-transparent pl-2 text-sm text-[#202A36] focus:outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-semibold text-[#202A36] mb-2.5">Category</h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-[#173B67] font-medium text-white'
                      : 'text-[#526071] hover:bg-[#F7F8FA] hover:text-[#202A36]'
                  }`}
                >
                  All Categories ({books.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full flex items-center justify-between text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                      selectedCategory === cat.slug
                        ? 'bg-[#173B67] font-medium text-white'
                        : 'text-[#526071] hover:bg-[#F7F8FA] hover:text-[#202A36]'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="font-mono text-xs opacity-80 tabular-nums">
                      {cat.bookCount ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 className="text-xs font-semibold text-[#202A36] mb-2.5">Price Range (PKR)</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min PKR"
                  aria-label="Minimum price in PKR"
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm tabular-nums focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max PKR"
                  aria-label="Maximum price in PKR"
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2 text-sm tabular-nums focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: 'Under 2,500', min: '', max: '2500' },
                  { label: '2,500 – 3,500', min: '2500', max: '3500' },
                  { label: '3,500+', min: '3500', max: '' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setMinPrice(preset.min);
                      setMaxPrice(preset.max);
                    }}
                    className="rounded-md border border-[#E2E7EE] bg-[#F7F8FA] px-2.5 py-1 text-xs font-medium text-[#202A36] hover:border-[#173B67]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="text-xs font-semibold text-[#202A36] mb-2.5">Minimum Rating</h3>
              <div className="space-y-1">
                {[
                  { label: 'All Ratings', value: 0 },
                  { label: '4.5 Stars & Up', value: 4.5 },
                  { label: '4.0 Stars & Up', value: 4.0 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMinRating(opt.value)}
                    className={`w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      minRating === opt.value
                        ? 'bg-[#F7F8FA] font-semibold text-[#173B67]'
                        : 'text-[#526071] hover:text-[#202A36]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          <div className="mb-5 flex items-center justify-between text-sm text-[#526071]">
            <p className="tabular-nums">
              Showing <strong className="text-[#202A36]">{filteredBooks.length}</strong>{' '}
              {filteredBooks.length === 1 ? 'book' : 'books'}
            </p>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 animate-pulse rounded-xl border border-[#E2E7EE] bg-white"
                />
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-xl border border-[#E2E7EE] bg-white p-12 text-center">
              <p className="font-serif text-xl font-semibold text-[#173B67]">
                No matching books found
              </p>
              <p className="mt-2 text-sm text-[#526071]">
                Try broadening your price range, clearing the search term, or selecting another category.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102B4B]"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
