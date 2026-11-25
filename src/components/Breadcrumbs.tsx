import { ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { navigate } = useStore();

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[#526071]">
        <li>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="hover:text-[#173B67] transition-colors"
          >
            Home
          </a>
        </li>
        {items.map((item, idx) => (
          <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-[#9AA5B4]" aria-hidden="true" />
            {item.href && idx < items.length - 1 ? (
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href!);
                }}
                className="hover:text-[#173B67] transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="font-medium text-[#202A36]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
