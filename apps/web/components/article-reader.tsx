'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  countWords,
  estimateReadingMinutes,
  injectHeadingIds,
  type ArticleHeading,
} from '@/lib/article-content';

type FontSize = 'sm' | 'md' | 'lg';

const FONT_SIZE_CLASS: Record<FontSize, string> = {
  sm: 'text-body-sm [&_p]:text-body-sm [&_li]:text-body-sm',
  md: 'text-body-md [&_p]:text-body-md [&_li]:text-body-md',
  lg: 'text-body-lg [&_p]:text-body-lg [&_li]:text-body-lg',
};

const FONT_SIZE_BUTTON_TEXT: Record<FontSize, string> = {
  sm: 'text-[10px]',
  md: 'text-[12px]',
  lg: 'text-[15px]',
};

const SCROLL_SPY_OFFSET = 96;

function resolveActiveHeadingId(headings: ArticleHeading[]): string | null {
  if (headings.length === 0) {
    return null;
  }

  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;

  if (atBottom) {
    return headings[headings.length - 1].id;
  }

  let activeId = headings[0].id;

  for (const heading of headings) {
    const element = document.getElementById(heading.id);
    if (!element) {
      continue;
    }

    if (element.getBoundingClientRect().top <= SCROLL_SPY_OFFSET) {
      activeId = heading.id;
    } else {
      break;
    }
  }

  return activeId;
}

export function ArticleReader({ html }: { html: string }) {
  const { html: htmlWithIds, headings } = useMemo(() => injectHeadingIds(html), [html]);
  const wordCount = useMemo(() => countWords(html), [html]);
  const readingMinutes = estimateReadingMinutes(wordCount);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const activeNavRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const updateActiveHeading = () => {
      setActiveId(resolveActiveHeadingId(headings));
    };

    updateActiveHeading();
    window.addEventListener('scroll', updateActiveHeading, { passive: true });
    window.addEventListener('resize', updateActiveHeading, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateActiveHeading);
      window.removeEventListener('resize', updateActiveHeading);
    };
  }, [headings]);

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    const top = element.getBoundingClientRect().top + window.scrollY - SCROLL_SPY_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed left-0 right-0 top-16 z-40 h-1 bg-surface-container-high"
        aria-hidden
      >
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {headings.length > 0 && (
        <MobileTableOfContents
          headings={headings}
          activeId={activeId}
          readingMinutes={readingMinutes}
          wordCount={wordCount}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onNavigate={scrollToHeading}
        />
      )}

      <div className="grid gap-gutter lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {headings.length > 0 && (
          <aside className="hidden lg:block">
            <nav
              aria-label="On this page"
              className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                  On this page
                </p>
                <div className="flex items-center gap-0.5 rounded-full border border-outline-variant p-0.5">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full font-semibold leading-none transition-colors',
                        FONT_SIZE_BUTTON_TEXT[size],
                        fontSize === size
                          ? 'bg-primary text-on-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                      )}
                      aria-label={`${size.toUpperCase()} text size`}
                      aria-pressed={fontSize === size}
                    >
                      A
                    </button>
                  ))}
                </div>
              </div>

              <p className="mb-4 text-label-sm text-on-surface-variant">
                {readingMinutes} min read · {wordCount.toLocaleString()} words
              </p>

              <ul className="space-y-0.5 border-l border-outline-variant">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <button
                      ref={activeId === heading.id ? activeNavRef : undefined}
                      type="button"
                      onClick={() => scrollToHeading(heading.id)}
                      className={cn(
                        '-ml-px block w-full border-l-2 py-1.5 pr-2 text-left text-label-sm transition-colors',
                        heading.level === 3 ? 'pl-6' : 'pl-4',
                        activeId === heading.id
                          ? 'border-primary font-medium text-primary'
                          : 'border-transparent text-on-surface-variant hover:border-outline-variant hover:text-on-surface',
                      )}
                    >
                      {heading.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <div
          className={cn('article-content min-w-0', FONT_SIZE_CLASS[fontSize])}
          dangerouslySetInnerHTML={{ __html: htmlWithIds }}
        />
      </div>
    </>
  );
}

function MobileTableOfContents({
  headings,
  activeId,
  readingMinutes,
  wordCount,
  fontSize,
  onFontSizeChange,
  onNavigate,
}: {
  headings: ArticleHeading[];
  activeId: string | null;
  readingMinutes: number;
  wordCount: number;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
  onNavigate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-stack-md rounded-xl border border-outline-variant bg-surface-container-low p-stack-md lg:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-label-sm text-on-surface-variant">
          {readingMinutes} min read · {wordCount.toLocaleString()} words
        </div>
        <div className="flex items-center gap-0.5 rounded-full border border-outline-variant p-0.5">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onFontSizeChange(size)}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full font-semibold leading-none transition-colors',
                FONT_SIZE_BUTTON_TEXT[size],
                fontSize === size
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
              aria-label={`${size.toUpperCase()} text size`}
              aria-pressed={fontSize === size}
            >
              A
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-outline-variant bg-surface px-3 py-2 text-label-md text-on-surface"
        aria-expanded={open}
      >
        On this page
        <span className="material-symbols-outlined text-[18px]">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <ul className="mt-2 space-y-1">
          {headings.map((heading) => (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => {
                  onNavigate(heading.id);
                  setOpen(false);
                }}
                className={cn(
                  'block w-full rounded-md px-2 py-1.5 text-left text-label-sm transition-colors',
                  heading.level === 3 && 'pl-4',
                  activeId === heading.id
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                )}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
