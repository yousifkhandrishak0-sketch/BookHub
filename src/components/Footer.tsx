import { BookOpen, Mail } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const { navigate, categories } = useStore();
  const topCategories = categories.slice(0, 6);

  return (
    <footer className="bg-[#173B67] text-slate-200 border-t border-[#102B4B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="inline-flex items-center gap-2 font-serif text-xl font-bold text-white"
            >
              <BookOpen className="h-5 w-5 text-[#D6A84F]" aria-hidden="true" />
              <span>BOOK HUB</span>
            </a>
            <p className="text-sm leading-relaxed text-slate-300">
              Your World of Books – Discover, Read, Grow. Curated academic, literary, and personal growth titles.
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
                <span>support@bookhub.pk</span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { label: 'Home', href: '/' },
                { label: 'Shop All Books', href: '/shop' },
                { label: 'Browse Categories', href: '/categories' },
                { label: 'About BOOK HUB', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.href);
                    }}
                    className="text-slate-300 hover:text-[#D6A84F] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Popular Genres</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/categories/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/categories/${cat.slug}`);
                    }}
                    className="text-slate-300 hover:text-[#D6A84F] transition-colors"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Customer & Store</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="/account"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/account');
                  }}
                  className="text-slate-300 hover:text-[#D6A84F] transition-colors"
                >
                  Customer Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/cart"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/cart');
                  }}
                  className="text-slate-300 hover:text-[#D6A84F] transition-colors"
                >
                  Shopping Cart
                </a>
              </li>
              <li>
                <a
                  href="/checkout"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/checkout');
                  }}
                  className="text-slate-300 hover:text-[#D6A84F] transition-colors"
                >
                  Checkout & COD Info
                </a>
              </li>
              <li>
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/admin');
                  }}
                  className="text-slate-300 hover:text-[#D6A84F] transition-colors"
                >
                  Admin Portal
                </a>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  className="text-slate-300 hover:text-[#D6A84F] transition-colors"
                >
                  XML Sitemap
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/15 pt-8 text-xs text-slate-300">
          <p>© {new Date().getFullYear()} BOOK HUB Pakistan. All rights reserved.</p>
          <p>Demonstration catalog & e-commerce storefront · Prices in Pakistani Rupees (PKR)</p>
        </div>
      </div>
    </footer>
  );
}
