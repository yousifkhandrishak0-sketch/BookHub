import React, { useState } from 'react';
import { BookOpen, Clock, Mail, ShieldCheck, Truck } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';

export function AboutPage() {
  const { navigate } = useStore();

  useSeo({
    title: 'About BOOK HUB – Curated Online Bookstore in Pakistan',
    description:
      'Learn about BOOK HUB: our mission to bring computer science, programming, literature, Islamic scholarship, and history books to readers across Pakistan.',
    path: '/about',
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={[{ label: 'About' }]} />

      <div className="overflow-hidden rounded-2xl border border-[#E2E7EE] bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9A6F1C]">
              Our Story
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#173B67]">
              Your World of Books – Discover, Read, Grow.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#526071]">
              BOOK HUB was founded with a straightforward conviction: every student, software engineer, researcher, and lifelong reader in Pakistan deserves dependable access to crisp, thoughtfully curated books without inflated markups or fragile packaging.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#526071]">
              From foundational Computer Science and Programming manuals to South Asian History, Islamic Philosophy, and Contemporary Fiction, each title in our catalog is vetted for print clarity and enduring value.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white hover:bg-[#102B4B]"
              >
                Explore the Catalog
              </button>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="rounded-lg border border-[#E2E7EE] bg-white px-6 py-3 text-sm font-semibold text-[#202A36] hover:border-[#173B67]"
              >
                Contact Our Team
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[280px] bg-[#F7F8FA]">
            <img
              src="/src/assets/images/promo_reading_desk_1795587849564.jpg"
              alt="Curated hardcover books on a stone reading table at BOOK HUB"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-[#E2E7EE] bg-white p-6">
          <BookOpen className="h-6 w-6 text-[#173B67]" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-lg font-bold text-[#173B67]">
            Curated Demonstration Catalog
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#526071]">
            Our storefront showcases 10 essential genres with transparent pricing in Pakistani Rupees (PKR), accurate stock tracking, and verified reader reviews.
          </p>
        </div>
        <div className="rounded-xl border border-[#E2E7EE] bg-white p-6">
          <Truck className="h-6 w-6 text-[#173B67]" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-lg font-bold text-[#173B67]">
            Reliable Nationwide Dispatch
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#526071]">
            Orders above PKR 3,500 ship free nationwide across Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, and Peshawar.
          </p>
        </div>
        <div className="rounded-xl border border-[#E2E7EE] bg-white p-6">
          <ShieldCheck className="h-6 w-6 text-[#173B67]" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-lg font-bold text-[#173B67]">
            Transparent Payment Terms
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#526071]">
            Pay conveniently via Cash on Delivery at your doorstep or select manual Bank Transfer with your generated Order ID.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { notify } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useSeo({
    title: 'Contact BOOK HUB – Reader Support & Bulk Orders',
    description:
      'Get in touch with BOOK HUB for order inquiries, university textbook requests, and customer support in Pakistan.',
    path: '/contact',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        notify(data.error || 'Could not send message.', 'error');
        return;
      }
      notify(data.message || 'Message received.', 'success');
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      notify('Network error while sending message.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={[{ label: 'Contact' }]} />

      <div className="max-w-2xl mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173B67]">
          Contact BOOK HUB
        </h1>
        <p className="mt-2 text-base text-[#526071]">
          Questions about an order, ISBN sourcing, or university book lists? Send us a note and our team will reply promptly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-[#E2E7EE] bg-white p-6 space-y-5">
            <h2 className="font-serif text-xl font-bold text-[#173B67]">Bookstore Desk</h2>
            <div className="space-y-4 text-sm text-[#202A36]">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#173B67] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Email Support</p>
                  <p className="text-[#526071]">support@bookhub.pk</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#173B67] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Hours</p>
                  <p className="text-[#526071]">Monday – Saturday, 9:30 AM – 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-xl border border-[#E2E7EE] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-xl font-bold text-[#173B67]">Send a Message</h2>

            {sent && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Your inquiry has been saved. Our bookstore desk will follow up via email shortly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cnt-name" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                    Your Name *
                  </label>
                  <input
                    id="cnt-name"
                    type="text"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bilal Ahmed"
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cnt-email" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="cnt-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="bilal@example.com"
                    className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cnt-subject" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                  Subject *
                </label>
                <input
                  id="cnt-subject"
                  type="text"
                  required
                  minLength={3}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order inquiry or book request"
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cnt-msg" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                  Message *
                </label>
                <textarea
                  id="cnt-msg"
                  required
                  minLength={10}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] p-3.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-[#173B67] px-6 py-3 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
