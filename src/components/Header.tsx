import React, { useState } from 'react';
import { BookOpen, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Header() {
  const { currentPath, navigate, cartCount, user } = useStore();
  const [bannerOpen, setBannerOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { setCartOpen } = useStore();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Categories', href: '/categories' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setMobileMenuOpen(false);
    if (trimmed) {
      navigate(`/shop?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/shop');
    }
  };

  const wishlistCount = user?.wishlist.length ?? 0;

  return (
    <>
      {bannerOpen && (
        <div className="bg-[#173B67] text-white text-xs sm:text-[13px] py-2 px-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <p className="truncate mx-auto text-center font-medium">
              Free nationwide delivery across Pakistan on orders above PKR 3,500 · Cash on Delivery available
            </p>
            <button
              type="button"
              onClick={() => setBannerOpen(false)}
              aria-label="Dismiss announcement"
              className="shrink-0 rounded p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#E2E7EE] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 lg:gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-[#173B67] whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-5 w-5 text-[#D6A84F]" aria-hidden="true" />
            <span>BOOK HUB</span>
          </a>

          {/* Zone 2: Primary Navigation */}
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => {
              const active =
                item.href === '/'
                  ? currentPath === '/'
                  : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                  }}
                  className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active ? 'text-[#173B67]' : 'text-[#526071] hover:text-[#173B67]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#D6A84F]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Search + Account, Wishlist, Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="hidden md:flex items-center rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-1.5 focus-within:border-[#173B67] focus-within:bg-white transition-colors"
            >
              <Search className="h-4 w-4 text-[#526071] shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, ISBN..."
                aria-label="Search books"
                className="w-44 xl:w-56 bg-transparent pl-2 text-sm text-[#202A36] placeholder:text-[#6B7785] focus:outline-none"
              />
            </form>

            <a
              href={user ? '/account' : '/login'}
              onClick={(e) => {
                e.preventDefault();
                navigate(user ? '/account' : '/login');
              }}
              aria-label={user ? 'My Account' : 'Sign in'}
              title={user ? `Signed in as ${user.name}` : 'Account'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#202A36] hover:bg-[#F7F8FA] hover:text-[#173B67] transition-colors"
            >
              <User className="h-5 w-5" />
            </a>

            <a
              href={user ? '/account?tab=wishlist' : '/login'}
              onClick={(e) => {
                e.preventDefault();
                navigate(user ? '/account?tab=wishlist' : '/login');
              }}
              aria-label="Wishlist"
              title="Wishlist"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#202A36] hover:bg-[#F7F8FA] hover:text-[#173B67] transition-colors"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D6A84F] px-1 text-[10px] font-bold text-[#202A36] tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </a>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping cart with ${cartCount} items`}
              className="relative inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#173B67] px-3 text-sm font-medium text-white hover:bg-[#102B4B] transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold tabular-nums">{cartCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-lg border border-[#E2E7EE] text-[#202A36] hover:bg-[#F7F8FA]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E2E7EE] bg-white px-4 py-4 space-y-4">
            <form onSubmit={handleSearchSubmit} role="search" className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2">
                <Search className="h-4 w-4 text-[#526071] shrink-0" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books, authors, ISBN..."
                  aria-label="Search books on mobile"
                  className="w-full bg-transparent pl-2 text-sm text-[#202A36] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#173B67] px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
              >
                Search
              </button>
            </form>

            <nav aria-label="Mobile" className="grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    navigate(item.href);
                  }}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                    currentPath === item.href
                      ? 'bg-[#F7F8FA] text-[#173B67]'
                      : 'text-[#202A36] hover:bg-[#F7F8FA]'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="/cart"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  navigate('/cart');
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#202A36] hover:bg-[#F7F8FA]"
              >
                Shopping Cart ({cartCount})
              </a>
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  navigate('/admin');
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#526071] hover:bg-[#F7F8FA]"
              >
                Admin Portal
              </a>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
