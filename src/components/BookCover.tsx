import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  src: string;
  alt: string;
  title?: string;
  author?: string;
  className?: string;
  priority?: boolean;
}

export function BookCover({
  src,
  alt,
  title,
  author,
  className = '',
  priority = false,
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col justify-between bg-gradient-to-br from-[#173B67] via-[#1E4A7F] to-[#112B4C] p-5 text-white ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="flex items-center justify-between text-[#D6A84F]">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-medium tracking-widest uppercase">BOOK HUB</span>
        </div>
        <div className="space-y-1.5">
          <p className="font-serif text-base font-semibold leading-snug line-clamp-3">
            {title || alt}
          </p>
          {author && <p className="text-xs text-slate-200 truncate">{author}</p>}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
