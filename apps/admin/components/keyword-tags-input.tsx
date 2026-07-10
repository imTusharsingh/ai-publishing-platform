'use client';

import { KeyboardEvent, MouseEvent, useState } from 'react';
import { cn } from '@/lib/cn';

function normalizeKeyword(value: string): string {
  return value.trim().replace(/,+$/, '').trim();
}

export function KeywordTagsInput({
  value,
  onChange,
  placeholder = 'Type a keyword and press comma',
  className,
  id,
}: {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const [draft, setDraft] = useState('');

  const addKeywords = (raw: string) => {
    const parts = raw.split(',').map(normalizeKeyword).filter(Boolean);

    if (parts.length === 0) {
      return;
    }

    const existing = new Set(value.map((keyword) => keyword.toLowerCase()));
    const next = [...value];

    for (const part of parts) {
      const key = part.toLowerCase();
      if (!existing.has(key)) {
        existing.add(key);
        next.push(part);
      }
    }

    onChange(next);
    setDraft('');
  };

  const removeKeywordAt = (index: number) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleRemoveClick = (event: MouseEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    removeKeywordAt(index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === ',' || event.key === 'Enter') {
      event.preventDefault();
      addKeywords(draft);
      return;
    }

    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-2 py-1.5',
        'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
        className,
      )}
    >
      {value.map((keyword, index) => (
        <span
          key={`${index}-${keyword}`}
          className="inline-flex items-center gap-0.5 rounded-full bg-primary-container py-0.5 pl-2.5 pr-1 text-label-sm text-on-primary-container"
        >
          {keyword}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => handleRemoveClick(event, index)}
            className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
            aria-label={`Remove ${keyword}`}
          >
            <span className="material-symbols-outlined text-[14px] leading-none">close</span>
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(event) => {
          const next = event.target.value;
          if (next.includes(',')) {
            addKeywords(next);
            return;
          }
          setDraft(next);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim()) {
            addKeywords(draft);
          }
        }}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant"
      />
    </div>
  );
}
