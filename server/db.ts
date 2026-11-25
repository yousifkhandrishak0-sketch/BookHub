import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  Book,
  CartItem,
  Category,
  Order,
  Review,
  UserProfile,
} from '../src/types.ts';

export interface StoredUser extends UserProfile {
  passwordHash: string;
  cart: CartItem[];
  resetCodeHash?: string;
  resetCodeExpiresAt?: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface NewsletterEntry {
  id: string;
  email: string;
  createdAt: string;
}

export interface BookHubStore {
  categories: Category[];
  books: Book[];
  users: StoredUser[];
  orders: Order[];
  reviews: Review[];
  newsletterSubscribers: NewsletterEntry[];
  contactMessages: ContactMessage[];
  adminPasscodeHash: string | null;
  orderSequence: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'bookhub-db.json');

const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-cs',
    name: 'Computer Science',
    slug: 'computer-science',
    description: 'Algorithms, distributed systems, operating systems, and theoretical foundations.',
    imageUrl: '/src/assets/images/book_cover_computing_1795587849410.jpg',
  },
  {
    id: 'cat-prog',
    name: 'Programming',
    slug: 'programming',
    description: 'Practical software engineering, clean architecture, TypeScript, Python, and system design.',
    imageUrl: '/src/assets/images/book_cover_programming_1795587849050.jpg',
  },
  {
    id: 'cat-biz',
    name: 'Business & Entrepreneurship',
    slug: 'business-entrepreneurship',
    description: 'Company building, product strategy, leadership, and modern economics.',
    imageUrl: '/src/assets/images/book_cover_business_1795587849623.jpg',
  },
  {
    id: 'cat-sci',
    name: 'Science & Technology',
    slug: 'science-technology',
    description: 'Physics, biotechnology, space exploration, and modern scientific discovery.',
    imageUrl: '/src/assets/images/book_cover_science_1795587849129.jpg',
  },
  {
    id: 'cat-math',
    name: 'Mathematics',
    slug: 'mathematics',
    description: 'Linear algebra, probability, calculus, and quantitative problem solving.',
    imageUrl: '/src/assets/images/book_cover_science_1795587849129.jpg',
  },
  {
    id: 'cat-lit',
    name: 'English & Literature',
    slug: 'english-literature',
    description: 'Classic essays, literary criticism, world poetry, and timeless prose.',
    imageUrl: '/src/assets/images/book_cover_fiction_1795587849080.jpg',
  },
  {
    id: 'cat-hist',
    name: 'History',
    slug: 'history',
    description: 'South Asian heritage, world civilizations, and archival historical chronicles.',
    imageUrl: '/src/assets/images/book_cover_history_1795587849587.jpg',
  },
  {
    id: 'cat-islamic',
    name: 'Islamic Books',
    slug: 'islamic-books',
    description: 'Classical scholarship, Seerah, Islamic philosophy, ethics, and spirituality.',
    imageUrl: '/src/assets/images/book_cover_islamic_1795587849440.jpg',
  },
  {
    id: 'cat-fiction',
    name: 'Novels & Fiction',
    slug: 'novels-fiction',
    description: 'Contemporary storytelling, literary fiction, and unforgettable narratives.',
    imageUrl: '/src/assets/images/book_cover_fiction_1795587849080.jpg',
  },
  {
    id: 'cat-selfdev',
    name: 'Self-Development',
    slug: 'self-development',
    description: 'Deep focus, habit mastery, clarity of thought, and purposeful living.',
    imageUrl: '/src/assets/images/book_cover_selfdev_1795587848981.jpg',
  },
];

const NOW_BASE = Date.parse('2026-10-15T09:00:00.000Z');
const dayIso = (offsetDays: number) => new Date(NOW_BASE + offsetDays * 86400000).toISOString();

const SEED_BOOKS: Book[] = [
  {
    id: 'book-01',
    slug: 'algorithms-and-graph-theory-foundations',
    title: 'Algorithms & Graph Theory Foundations',
    author: 'Dr. Tariq Mahmood',
    categorySlug: 'computer-science',
    categoryName: 'Computer Science',
    publisher: 'Indus Computing Press',
    isbn: '978-969-8841-01-4',
    description:
      'A rigorous, visual introduction to asymptotic analysis, network flow, dynamic programming, and randomized graph algorithms tailored for university students and practicing engineers.',
    price: 3250,
    originalPrice: 3800,
    stock: 28,
    rating: 4.9,
    reviewCount: 2,
    coverImage: '/src/assets/images/book_cover_computing_1795587849410.jpg',
    featured: true,
    bestseller: true,
    newArrival: false,
    pages: 540,
    publishedYear: 2025,
    isDemoInventory: true,
    createdAt: dayIso(1),
  },
  {
    id: 'book-02',
    slug: 'distributed-systems-architecture',
    title: 'Distributed Systems Architecture',
    author: 'Nadia Qureshi',
    categorySlug: 'computer-science',
    categoryName: 'Computer Science',
    publisher: 'Crescent Technical Editions',
    isbn: '978-969-8841-02-1',
    description:
      'Explore consensus protocols, replication strategies, event-driven storage engines, and fault-tolerant infrastructure through real production case studies.',
    price: 3650,
    originalPrice: 4200,
    stock: 19,
    rating: 4.8,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_computing_1795587849410.jpg',
    featured: true,
    bestseller: false,
    newArrival: true,
    pages: 488,
    publishedYear: 2026,
    isDemoInventory: true,
    createdAt: dayIso(18),
  },
  {
    id: 'book-03',
    slug: 'software-architecture-and-engineering',
    title: 'Software Architecture & Engineering',
    author: 'Elizabeth L. Chen',
    categorySlug: 'programming',
    categoryName: 'Programming',
    publisher: 'Technical Press',
    isbn: '978-1-95420-112-8',
    description:
      'A complete field manual for designing maintainable TypeScript and cloud-native services, modular boundaries, observability pipelines, and scalable API contracts.',
    price: 3450,
    originalPrice: 3950,
    stock: 34,
    rating: 4.9,
    reviewCount: 2,
    coverImage: '/src/assets/images/book_cover_programming_1795587849050.jpg',
    featured: true,
    bestseller: true,
    newArrival: false,
    pages: 462,
    publishedYear: 2025,
    isDemoInventory: true,
    createdAt: dayIso(2),
  },
  {
    id: 'book-04',
    slug: 'pragmatic-fullstack-patterns',
    title: 'Pragmatic Full-Stack Patterns',
    author: 'Bilal Siddiqui',
    categorySlug: 'programming',
    categoryName: 'Programming',
    publisher: 'Lahore Code Guild',
    isbn: '978-969-7712-04-9',
    description:
      'Step-by-step patterns for modern React state orchestration, relational and document data modeling, end-to-end type safety, and automated testing.',
    price: 2790,
    stock: 22,
    rating: 4.7,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_programming_1795587849050.jpg',
    featured: false,
    bestseller: false,
    newArrival: true,
    pages: 390,
    publishedYear: 2026,
    isDemoInventory: true,
    createdAt: dayIso(20),
  },
  {
    id: 'book-05',
    slug: 'strategic-columns-business-excellence',
    title: 'Strategic Columns: Building Business Excellence',
    author: 'Alexander Wright',
    categorySlug: 'business-entrepreneurship',
    categoryName: 'Business & Entrepreneurship',
    publisher: 'Quantum Press',
    isbn: '978-1-88901-334-7',
    description:
      'Learn how resilient founders structure capital allocation, unit economics, customer retention loops, and operational discipline from seed stage to market leadership.',
    price: 2950,
    originalPrice: 3400,
    stock: 25,
    rating: 4.8,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_business_1795587849623.jpg',
    featured: true,
    bestseller: true,
    newArrival: false,
    pages: 328,
    publishedYear: 2025,
    isDemoInventory: true,
    createdAt: dayIso(3),
  },
  {
    id: 'book-06',
    slug: 'founders-playbook-south-asia',
    title: 'The Venture Playbook for Emerging Markets',
    author: 'Zainab Mansoor',
    categorySlug: 'business-entrepreneurship',
    categoryName: 'Business & Entrepreneurship',
    publisher: 'Karachi Business Review',
    isbn: '978-969-6044-08-5',
    description:
      'Firsthand lessons from builders across Pakistan and MENA on logistics, trust-first commerce, pricing strategy, and building durable teams.',
    price: 2150,
    stock: 17,
    rating: 4.6,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_business_1795587849623.jpg',
    featured: false,
    bestseller: false,
    newArrival: true,
    pages: 284,
    publishedYear: 2026,
    isDemoInventory: true,
    createdAt: dayIso(19),
  },
  {
    id: 'book-07',
    slug: 'celestial-harmony-orbital-mechanics',
    title: 'Celestial Harmony: The Geometry of Orbital Mechanics',
    author: 'Dr. Eliza J. Vance',
    categorySlug: 'science-technology',
    categoryName: 'Science & Technology',
    publisher: 'Meridian Science House',
    isbn: '978-1-77210-891-3',
    description:
      'From Keplerian ellipses to modern deep-space trajectory design, this illustrated volume unites astrophysics, aerospace engineering, and classical geometry.',
    price: 3400,
    originalPrice: 3900,
    stock: 14,
    rating: 4.9,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_science_1795587849129.jpg',
    featured: true,
    bestseller: false,
    newArrival: true,
    pages: 412,
    publishedYear: 2026,
    isDemoInventory: true,
    createdAt: dayIso(17),
  },
  {
    id: 'book-08',
    slug: 'applied-linear-algebra-and-probability',
    title: 'Applied Linear Algebra & Probability',
    author: 'Prof. Hamza Raza',
    categorySlug: 'mathematics',
    categoryName: 'Mathematics',
    publisher: 'Academic Horizon Press',
    isbn: '978-969-5102-19-2',
    description:
      'A crystal-clear bridge between matrix decompositions, Bayesian inference, and modern machine learning mathematics with worked problem sets.',
    price: 2650,
    stock: 31,
    rating: 4.7,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_science_1795587849129.jpg',
    featured: false,
    bestseller: true,
    newArrival: false,
    pages: 448,
    publishedYear: 2025,
    isDemoInventory: true,
    createdAt: dayIso(4),
  },
  {
    id: 'book-09',
    slug: 'calculus-of-symmetries',
    title: 'The Calculus of Symmetries',
    author: 'Dr. Saima Farooq',
    categorySlug: 'mathematics',
    categoryName: 'Mathematics',
    publisher: 'Academic Horizon Press',
    isbn: '978-969-5102-27-7',
    description:
      'An accessible exploration of differential geometry, symmetry groups, and why mathematical elegance predicts physical law.',
    price: 2350,
    originalPrice: 2700,
    stock: 16,
    rating: 4.6,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_science_1795587849129.jpg',
    featured: false,
    bestseller: false,
    newArrival: false,
    pages: 310,
    publishedYear: 2024,
    isDemoInventory: true,
    createdAt: dayIso(5),
  },
  {
    id: 'book-10',
    slug: 'whispers-of-the-silent-sea',
    title: 'Whispers of the Silent Sea',
    author: 'Eliza Reed',
    categorySlug: 'novels-fiction',
    categoryName: 'Novels & Fiction',
    publisher: 'Harbor Literary Press',
    isbn: '978-1-64829-402-6',
    description:
      'Set along a mist-bound coastal village, a cartographer uncovers a century-old maritime diary that reshapes two families across generations.',
    price: 1850,
    originalPrice: 2200,
    stock: 42,
    rating: 4.9,
    reviewCount: 2,
    coverImage: '/src/assets/images/book_cover_fiction_1795587849080.jpg',
    featured: true,
    bestseller: true,
    newArrival: false,
    pages: 356,
    publishedYear: 2025,
    isDemoInventory: true,
    createdAt: dayIso(6),
  },
  {
    id: 'book-11',
    slug: 'letters-from-the-chinar-courtyard',
    title: 'Letters from the Chinar Courtyard',
    author: 'Amina Khalid',
    categorySlug: 'novels-fiction',
    categoryName: 'Novels & Fiction',
    publisher: 'Margalla House',
    isbn: '978-969-4120-55-1',
    description:
      'An evocative novel tracing memory, craftsmanship, and family resilience across Lahore and the northern valleys over four changing seasons.',
    price: 1650,
    stock: 29,
    rating: 4.8,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_fiction_1795587849080.jpg',
    featured: false,
    bestseller: false,
    newArrival: true,
    pages: 312,
    publishedYear: 2026,
    isDemoInventory: true,
    createdAt: dayIso(21),
  },
  {
    id: 'book-12',
    slug: 'art-of-the-english-essay',
    title: 'Essays on Reading & Craft',
    author: 'Arthur Pendelton',
    categorySlug: 'english-literature',
    categoryName: 'English & Literature',
    publisher: 'Oxford Folio',
    isbn: '978-0-19-884210-1',
    description:
      'A curated anthology of classic and modern English essays examining style, clarity, rhetoric, and the enduring discipline of close reading.',
    price: 1950,
    originalPrice: 2300,
    stock: 24,
    rating: 4.7,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_fiction_1795587849080.jpg',
    featured: false,
    bestseller: false,
    newArrival: false,
    pages: 296,
    publishedYear: 2024,
    isDemoInventory: true,
    createdAt: dayIso(7),
  },
  {
    id: 'book-13',
    slug: 'world-history-chronicle-of-civilization',
    title: 'World History: A Chronicle of Civilization',
    author: 'James R. Davison',
    categorySlug: 'history',
    categoryName: 'History',
    publisher: 'Heritage Archival Press',
    isbn: '978-1-50983-774-2',
    description:
      'A sweeping hardcover chronicle connecting Silk Road trade corridors, classical scholarship, maritime empires, and modern nation-building.',
    price: 4100,
    originalPrice: 4650,
    stock: 15,
    rating: 4.8,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_history_1795587849587.jpg',
    featured: false,
    bestseller: true,
    newArrival: false,
    pages: 640,
    publishedYear: 2025,
    isDemoInventory: true,
    createdAt: dayIso(8),
  },
  {
    id: 'book-14',
    slug: 'indus-and-empire-south-asian-history',
    title: 'Rivers of Memory: South Asian Heritage',
    author: 'Dr. Kamran Aziz',
    categorySlug: 'history',
    categoryName: 'History',
    publisher: 'Sang-e-Meel Scholarly',
    isbn: '978-969-3531-82-4',
    description:
      'An insightful historical study of architectural traditions, literary salons, and civic institutions across the Indus basin.',
    price: 2850,
    stock: 18,
    rating: 4.7,
    reviewCount: 1,
    coverImage: '/src/assets/images/book_cover_history_1795587849587.jpg',
    featured: false,
    bestseller: false,
    newArrival: true,
    pages: 418,
    publishedYear: 2026,
    isDemoInventory: true,
    createdAt: dayIso(16),
  },
  {
    id: 'book-15',
    slug: 'islamic-philosophy-and-heritage',
    title: 'Islamic Philosophy and Heritage',
    author: 'Dr. Ahmed Al-Faruqi',
    categorySlug: 'islamic-books',
    categoryName: 'Islamic Books',
    publisher: 'Dar Al-Hikmah Editions',
    isbn: '978-969-9210-14-3',
    description:
      'A thoughtful exploration of Islamic intellectual history, classical ethics, spiritual refinement, and the golden age of scholarship.',
    price: 3100,
    originalPrice: 3500,
    stock: 36,
    rating: 5.0,
    reviewCount: 2,
    coverImage: '/src/assets/images/book_cover_islamic_1795587849440.jpg',
    featured: true,
    bestseller: true,
    newArrival: false,
    pages: 472,
    publishedYear: 2025,
    isDemoInventory: true,
    createdAt: dayIso(9),
  },
  {
    id: 'book-16',
    slug: 'true-north-guiding-principles',
    title: 'True North: Guiding Principles for a Fulfilled Life',
    author: 'Eliza Reed',
    categorySlug: 'self-development',
    categoryName: 'Self-Development',
    publisher: 'Alabaster Press',
    isbn: '978-1-73812-095-4',
    description:
      'Practical frameworks for cultivating deep concentration, calm decision-making, intentional habits, and meaningful long-term craft.',
    price: 1990,
    originalPrice: 2450,
    stock: 40,
    rating: 4.8,
    reviewCount: 2,
    coverImage: '/src/assets/images/book_cover_selfdev_1795587848981.jpg',
    featured: false,
    bestseller: true,
    newArrival: true,
    pages: 268,
    publishedYear: 2026,
    isDemoInventory: true,
    createdAt: dayIso(22),
  },
];

const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-01',
    bookId: 'book-01',
    userId: 'seed-reader-1',
    userName: 'Usman Tariq',
    rating: 5,
    comment: 'Clear proofs and well-drawn network diagrams. Helped me ace my algorithms exam.',
    createdAt: dayIso(12),
  },
  {
    id: 'rev-02',
    bookId: 'book-01',
    userId: 'seed-reader-2',
    userName: 'Hira Nawaz',
    rating: 5,
    comment: 'Print quality and binding are excellent. Arrived neatly packaged in Islamabad.',
    createdAt: dayIso(14),
  },
  {
    id: 'rev-03',
    bookId: 'book-03',
    userId: 'seed-reader-3',
    userName: 'Saadullah Khan',
    rating: 5,
    comment: 'Practical chapters on API contracts and modular boundaries without unnecessary fluff.',
    createdAt: dayIso(15),
  },
  {
    id: 'rev-04',
    bookId: 'book-10',
    userId: 'seed-reader-4',
    userName: 'Mehreen Aftab',
    rating: 5,
    comment: 'Lyrical writing from the very first chapter. One of my favorite fiction reads this year.',
    createdAt: dayIso(16),
  },
  {
    id: 'rev-05',
    bookId: 'book-15',
    userId: 'seed-reader-5',
    userName: 'Omar Farooq',
    rating: 5,
    comment: 'Dignified hardcover edition and deeply researched chapters on classical scholarship.',
    createdAt: dayIso(17),
  },
  {
    id: 'rev-06',
    bookId: 'book-16',
    userId: 'seed-reader-6',
    userName: 'Ayesha Siddiqa',
    rating: 5,
    comment: 'Grounded, realistic exercises for building quiet morning focus.',
    createdAt: dayIso(23),
  },
];

function createDefaultStore(): BookHubStore {
  return {
    categories: SEED_CATEGORIES,
    books: SEED_BOOKS,
    users: [],
    orders: [],
    reviews: SEED_REVIEWS,
    newsletterSubscribers: [],
    contactMessages: [],
    adminPasscodeHash: null,
    orderSequence: 1041,
  };
}

let cachedStore: BookHubStore | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function getStore(): Promise<BookHubStore> {
  if (cachedStore) return cachedStore;
  await ensureDataDirs();
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BookHubStore>;
    const defaults = createDefaultStore();
    cachedStore = {
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : defaults.categories,
      books: Array.isArray(parsed.books) && parsed.books.length > 0 ? parsed.books : defaults.books,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : defaults.reviews,
      newsletterSubscribers: Array.isArray(parsed.newsletterSubscribers) ? parsed.newsletterSubscribers : [],
      contactMessages: Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [],
      adminPasscodeHash: typeof parsed.adminPasscodeHash === 'string' ? parsed.adminPasscodeHash : null,
      orderSequence: typeof parsed.orderSequence === 'number' ? parsed.orderSequence : 1041,
    };
  } catch {
    cachedStore = createDefaultStore();
    await persistStore(cachedStore);
  }
  return cachedStore;
}

async function persistStore(store: BookHubStore): Promise<void> {
  await ensureDataDirs();
  const tmpFile = `${DB_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  await fs.rename(tmpFile, DB_FILE);
}

export function mutateStore<T>(fn: (store: BookHubStore) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const store = await getStore();
    const result = await fn(store);
    await persistStore(store);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function toPublicUser(user: StoredUser): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    wishlist: user.wishlist,
    createdAt: user.createdAt,
  };
}
