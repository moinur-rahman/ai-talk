'use client';
import { FC, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiMessageSquare, FiSearch, FiX } from 'react-icons/fi';
import { useSearchConversationsQuery } from '@/services/chatApi';
import { ConversationSearchResult } from '@/types/chat';

interface SearchModalProps {
  onClose: () => void;
}

const SearchModal: FC<SearchModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const { data: results = [], isFetching } = useSearchConversationsQuery(
    debouncedQuery,
    { skip: debouncedQuery.trim().length === 0 },
  );

  const handleSelect = (id: string) => {
    router.push(`/${id}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[560px] bg-[#080e18] border border-[#1A2840] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1A2840]">
          <FiSearch size={15} className="text-[#3D5570] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-[#D8E8F3] text-sm outline-none placeholder:text-[#3D5570]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#3D5570] hover:text-[#7A96AD] transition-colors"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {!debouncedQuery.trim() && (
            <p className="text-[#3D5570] text-xs text-center py-8">
              Type to search through conversations
            </p>
          )}
          {debouncedQuery.trim() && isFetching && (
            <p className="text-[#3D5570] text-xs text-center py-8">
              Searching...
            </p>
          )}
          {debouncedQuery.trim() && !isFetching && results.length === 0 && (
            <p className="text-[#3D5570] text-xs text-center py-8">
              No conversations found
            </p>
          )}
          {!isFetching &&
            results.map((result) => (
              <SearchResult
                key={result.id}
                result={result}
                query={debouncedQuery}
                onSelect={handleSelect}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

const SearchResult: FC<{
  result: ConversationSearchResult;
  query: string;
  onSelect: (id: string) => void;
}> = ({ result, query, onSelect }) => (
  <button
    onClick={() => onSelect(result.id)}
    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[#0E1822] transition-colors text-left border-b border-[#1A2840]/40 last:border-0"
  >
    <FiMessageSquare
      size={13}
      className="text-[#3D5570] flex-shrink-0 mt-0.5"
    />
    <div className="min-w-0">
      <p className="text-[#C8D8E4] text-sm truncate">
        <HighlightedText text={result.title ?? 'Untitled'} query={query} />
      </p>
      {result.snippet && (
        <p className="text-[#4A6580] text-xs mt-0.5 line-clamp-2 leading-relaxed">
          <HighlightedText text={result.snippet} query={query} />
        </p>
      )}
    </div>
  </button>
);

const HighlightedText: FC<{ text: string; query: string }> = ({
  text,
  query,
}) => {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-[#00C4A1]/20 text-[#00C4A1] not-italic rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
};

export default SearchModal;
