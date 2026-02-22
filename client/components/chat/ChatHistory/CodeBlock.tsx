'use client';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export interface CodeBlockProps {
  language: string;
  codeString: string;
}

export const CodeBlock = ({ language, codeString }: CodeBlockProps) => {
  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => {
        setCopyStatus('');
      }, 2000);
    });
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded-t border-b border-gray-600">
        <span className="text-gray-400 text-sm">{language}</span>
        <button
          onClick={() => handleCopy(codeString)}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
        >
          {copyStatus === 'Copied!' ? (
            <>
              <span>Copied!</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1-.708 0z" />
              </svg>
            </>
          ) : (
            <>
              <span>Copy code</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
              </svg>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus as Record<string, React.CSSProperties>}
        language={language}
        className="rounded-t-none"
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};
