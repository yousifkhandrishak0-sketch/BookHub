import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Book, CartItem, Category, UserProfile } from '../types';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreContextValue {
  currentPath: string;
  currentSearch: string;
  navigate: (to: string) => void;
  books: Book[];
  categories: Category[];
  catalogLoading: boolean;
  refreshCatalog: () => Promise<void>;
  user: UserProfile | null;
  customerToken: string | null;
  setCustomerSession: (token: string | null, user: UserProfile | null, serverCart?: CartItem[]) => void;
  logoutCustomer: () => Promise<void>;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (book: Book, quantity?: number, openDrawer?: boolean) => void;
  updateCartQuantity: (bookId: string, quantity: number) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  toggleWishlist: (bookId: string) => Promise<void>;
  isWishlisted: (bookId: string) => boolean;
  toasts: ToastItem[];
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  lastOrderReceiptToken: Record<string, string>;
  saveOrderReceiptToken: (orderNumber: string, token: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [locationState, setLocationState] = useState({
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
  });
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Tokens strictly held in React memory (never localStorage/sessionStorage)
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastOrderReceiptToken, setLastOrderReceiptToken] = useState<Record<string, string>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', `${url.pathname}${url.search}`);
    setLocationState({ pathname: url.pathname, search: url.search });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPop = () => {
      setLocationState({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      setCatalogLoading(true);
      const [booksRes, catsRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/categories'),
      ]);
      if (booksRes.ok) {
        const data = (await booksRes.json()) as { books: Book[] };
        setBooks(data.books);
      }
      if (catsRes.ok) {
        const data = (await catsRes.json()) as { categories: Category[] };
        setCategories(data.categories);
      }
    } catch {
      notify('Unable to load catalog right now.', 'error');
    } finally {
      setCatalogLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  const syncCartWithServer = useCallback(
    async (nextCart: CartItem[], tokenOverride?: string | null) => {
      const token = tokenOverride !== undefined ? tokenOverride : customerToken;
      if (!token) return;
      try {
        await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: nextCart.map((c) => ({ bookId: c.bookId, quantity: c.quantity })),
          }),
        });
      } catch {
        // Ignore transient sync error; local state remains intact
      }
    },
    [customerToken],
  );

  const setCustomerSession = useCallback(
    (token: string | null, nextUser: UserProfile | null, serverCart?: CartItem[]) => {
      setCustomerToken(token);
      setUser(nextUser);
      if (token && serverCart) {
        setCart((prevCart) => {
          const merged = new Map<string, number>();
          for (const item of serverCart) {
            merged.set(item.bookId, item.quantity);
          }
          for (const item of prevCart) {
            merged.set(item.bookId, Math.max(merged.get(item.bookId) || 0, item.quantity));
          }
          const mergedList = Array.from(merged.entries()).map(([bookId, quantity]) => ({
            bookId,
            quantity,
          }));
          if (prevCart.length > 0) {
            void syncCartWithServer(mergedList, token);
          }
          return mergedList;
        });
      }
    },
    [syncCartWithServer],
  );

  const logoutCustomer = useCallback(async () => {
    if (customerToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${customerToken}` },
        });
      } catch {
        // Proceed with client logout
      }
    }
    setCustomerToken(null);
    setUser(null);
    notify('You have been signed out.', 'info');
  }, [customerToken, notify]);

  const addToCart = useCallback(
    (book: Book, quantity = 1, openDrawer = true) => {
      if (book.stock <= 0) {
        notify(`"${book.title}" is currently out of stock.`, 'error');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.bookId === book.id);
        const currentQty = existing ? existing.quantity : 0;
        const targetQty = Math.min(currentQty + quantity, book.stock, 25);
        const next = existing
          ? prev.map((i) => (i.bookId === book.id ? { ...i, quantity: targetQty, book } : i))
          : [...prev, { bookId: book.id, quantity: targetQty, book }];
        void syncCartWithServer(next);
        return next;
      });
      notify(`Added "${book.title}" to your cart.`, 'success');
      if (openDrawer) setCartOpen(true);
    },
    [notify, syncCartWithServer],
  );

  const updateCartQuantity = useCallback(
    (bookId: string, quantity: number) => {
      setCart((prev) => {
        const bookObj = books.find((b) => b.id === bookId);
        const maxAllowed = bookObj ? Math.min(bookObj.stock, 25) : 25;
        const next =
          quantity <= 0
            ? prev.filter((i) => i.bookId !== bookId)
            : prev.map((i) =>
                i.bookId === bookId ? { ...i, quantity: Math.min(quantity, maxAllowed) } : i,
              );
        void syncCartWithServer(next);
        return next;
      });
    },
    [books, syncCartWithServer],
  );

  const removeFromCart = useCallback(
    (bookId: string) => {
      setCart((prev) => {
        const next = prev.filter((i) => i.bookId !== bookId);
        void syncCartWithServer(next);
        return next;
      });
      notify('Removed item from cart.', 'info');
    },
    [notify, syncCartWithServer],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    void syncCartWithServer([]);
  }, [syncCartWithServer]);

  const toggleWishlist = useCallback(
    async (bookId: string) => {
      if (!customerToken || !user) {
        notify('Please sign in to save books to your wishlist.', 'info');
        navigate('/login');
        return;
      }
      try {
        const res = await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({ bookId }),
        });
        if (!res.ok) {
          throw new Error('Wishlist update failed');
        }
        const data = (await res.json()) as { wishlist: string[] };
        const added = data.wishlist.includes(bookId);
        setUser((prev) => (prev ? { ...prev, wishlist: data.wishlist } : prev));
        notify(added ? 'Saved to your wishlist.' : 'Removed from your wishlist.', 'success');
      } catch {
        notify('Could not update wishlist. Please try again.', 'error');
      }
    },
    [customerToken, navigate, notify, user],
  );

  const isWishlisted = useCallback(
    (bookId: string) => Boolean(user?.wishlist.includes(bookId)),
    [user],
  );

  const enrichedCart = useMemo(() => {
    const bookMap = new Map(books.map((b) => [b.id, b]));
    return cart
      .map((item) => ({
        ...item,
        book: bookMap.get(item.bookId) || item.book,
      }))
      .filter((item) => Boolean(item.book));
  }, [books, cart]);

  const cartCount = useMemo(
    () => enrichedCart.reduce((sum, item) => sum + item.quantity, 0),
    [enrichedCart],
  );

  const cartSubtotal = useMemo(
    () =>
      enrichedCart.reduce((sum, item) => sum + (item.book ? item.book.price * item.quantity : 0), 0),
    [enrichedCart],
  );

  const saveOrderReceiptToken = useCallback((orderNumber: string, token: string) => {
    setLastOrderReceiptToken((prev) => ({ ...prev, [orderNumber]: token }));
  }, []);

  return (
    <StoreContext.Provider
      value={{
        currentPath: locationState.pathname,
        currentSearch: locationState.search,
        navigate,
        books,
        categories,
        catalogLoading,
        refreshCatalog,
        user,
        customerToken,
        setCustomerSession,
        logoutCustomer,
        adminToken,
        setAdminToken,
        cart: enrichedCart,
        cartCount,
        cartSubtotal,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isWishlisted,
        toasts,
        notify,
        dismissToast,
        lastOrderReceiptToken,
        saveOrderReceiptToken,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
