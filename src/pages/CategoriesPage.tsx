import { ArrowRight } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { BookCover } from '../components/BookCover';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';

interface CategoriesPageProps {
  categorySlug?: string;
}

export function CategoriesPage({ categorySlug }: CategoriesPageProps) {
  const { categories, books, navigate } = useStore();
  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  useSeo({
    title: activeCategory
      ? `${activeCategory.name} Books in Pakistan | BOOK HUB`
      : 'Book Categories – Computer Science, Fiction, History & More | BOOK HUB',
    description: activeCategory
      ? `${activeCategory.description} Buy ${activeCategory.name} books online at BOOK HUB.`
      : 'Explore all 10 curated book categories at BOOK HUB including Computer Science, Programming, Business, Mathematics, History, Islamic Books, and Fiction.',
    path: activeCategory ? `/categories/${activeCategory.slug}` : '/categories',
  });

  if (categorySlug && activeCategory) {
    const categoryBooks = books.filter((b) => b.categorySlug === activeCategory.slug);

    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { label: 'Categories', href: '/categories' },
            { label: activeCategory.name },
          ]}
        />

        <div className="overflow-hidden rounded-2xl border border-[#E2E7EE] bg-white mb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            <div className="md:col-span-8 p-8 sm:p-10 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
                Genre Collection
              </p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#173B67]">
                {activeCategory.name}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-[#526071] leading-relaxed">
                {activeCategory.description}
              </p>
              <p className="mt-4 text-sm font-medium text-[#202A36] tabular-nums">
                {categoryBooks.length} {categoryBooks.length === 1 ? 'book' : 'books'} available
              </p>
            </div>
            <div className="md:col-span-4 min-h-[200px] bg-[#F7F8FA]">
              <BookCover
                src={activeCategory.imageUrl}
                alt={`${activeCategory.name} category`}
                title={activeCategory.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {categoryBooks.length === 0 ? (
          <div className="rounded-xl border border-[#E2E7EE] bg-white p-12 text-center">
            <p className="font-serif text-xl font-semibold text-[#173B67]">
              No books in this category yet
            </p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="mt-4 rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Browse All Books
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={[{ label: 'Categories' }]} />

      <div className="max-w-2xl mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173B67]">
          Explore Book Categories
        </h1>
        <p className="mt-3 text-base text-[#526071]">
          Select any subject below to browse curated titles across Computer Science, Programming, Fiction, Islamic Scholarship, History, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/categories/${cat.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/categories/${cat.slug}`);
            }}
            className="group flex overflow-hidden rounded-xl border border-[#E2E7EE] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#173B67] hover:shadow-md"
          >
            <div className="w-32 sm:w-36 shrink-0 bg-[#F7F8FA]">
              <BookCover
                src={cat.imageUrl}
                alt={`${cat.name} category cover`}
                title={cat.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#202A36] group-hover:text-[#173B67]">
                  {cat.name}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[#526071] line-clamp-2">
                  {cat.description}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#173B67]">
                <span className="tabular-nums">{cat.bookCount ?? 0} books</span>
                <span className="inline-flex items-center gap-1 group-hover:text-[#9A6F1C]">
                  Browse <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
