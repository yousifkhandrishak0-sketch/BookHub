/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { StoreProvider, useStore } from './context/StoreContext';
import { AboutPage, ContactPage } from './pages/AboutContactPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/AuthPages';
import { BookDetailsPage } from './pages/BookDetailsPage';
import { CartPage } from './pages/CartPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { HomePage } from './pages/HomePage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { ShopPage } from './pages/ShopPage';

function AppRouter() {
  const { currentPath, navigate } = useStore();
  const path = currentPath.replace(/\/+$/, '') || '/';

  const renderPage = () => {
    if (path === '/') return <HomePage />;
    if (path === '/shop') return <ShopPage />;
    if (path === '/categories') return <CategoriesPage />;
    if (path.startsWith('/categories/')) {
      const slug = decodeURIComponent(path.slice('/categories/'.length));
      return <CategoriesPage categorySlug={slug} />;
    }
    if (path.startsWith('/book/')) {
      const slug = decodeURIComponent(path.slice('/book/'.length));
      return <BookDetailsPage slug={slug} />;
    }
    if (path === '/about') return <AboutPage />;
    if (path === '/contact') return <ContactPage />;
    if (path === '/cart') return <CartPage />;
    if (path === '/checkout') return <CheckoutPage />;
    if (path.startsWith('/order-confirmation/')) {
      const orderNumber = decodeURIComponent(path.slice('/order-confirmation/'.length));
      return <OrderConfirmationPage orderNumber={orderNumber} />;
    }
    if (path === '/login') return <LoginPage />;
    if (path === '/register') return <RegisterPage />;
    if (path === '/forgot-password') return <ForgotPasswordPage />;
    if (path === '/account') return <CustomerDashboardPage />;
    if (path === '/admin') return <AdminDashboardPage />;

    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#173B67]">Page Not Found</h1>
        <p className="mt-3 text-sm text-[#526071]">
          The page you are looking for does not exist or has moved.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white"
        >
          Back to Home
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-[#202A36]">
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}
