import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CodeBlock } from './CodeBlock';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

interface CodeProps extends React.ComponentPropsWithoutRef<'code'> {
  node?: object;
  inline?: boolean;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ inline, className, children, ...props }: CodeProps) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          return !inline && match ? (
            <CodeBlock language={match[1]} codeString={codeString} />
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        ul({ children, ...props }) {
          return (
            <ul className="list-disc pl-6 my-2 space-y-1" {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol className="list-decimal pl-6 my-2 space-y-1" {...props}>
              {children}
            </ol>
          );
        },
        li({ children, ...props }) {
          return (
            <li className="ml-2" {...props}>
              {children}
            </li>
          );
        },
        h1({ children, ...props }) {
          return (
            <h1 className="text-2xl font-bold my-4 text-white" {...props}>
              {children}
            </h1>
          );
        },
        h2({ children, ...props }) {
          return (
            <h2 className="text-xl font-bold my-3 text-white" {...props}>
              {children}
            </h2>
          );
        },
        h3({ children, ...props }) {
          return (
            <h3 className="text-lg font-bold my-3 text-white" {...props}>
              {children}
            </h3>
          );
        },
        h4({ children, ...props }) {
          return (
            <h4 className="text-base font-bold my-2 text-white" {...props}>
              {children}
            </h4>
          );
        },
        h5({ children, ...props }) {
          return (
            <h5 className="text-base font-semibold my-2 text-white" {...props}>
              {children}
            </h5>
          );
        },
        h6({ children, ...props }) {
          return (
            <h6 className="text-sm font-semibold my-2 text-white" {...props}>
              {children}
            </h6>
          );
        },
        hr({ ...props }) {
          return <hr className="border-t border-gray-600 my-8" {...props} />;
        },
        blockquote({ children, ...props }) {
          return (
            <blockquote
              className="border-l-4 border-blue-500 pl-4 my-4 text-gray-200 italic"
              {...props}
            >
              {children}
            </blockquote>
          );
        },
        p({ children, ...props }) {
          return (
            <p className="mb-4 text-gray-200" {...props}>
              {children}
            </p>
          );
        },
        a({ children, href, ...props }) {
          return (
            <a
              href={href}
              className="text-blue-400 hover:text-blue-300 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          );
        },
        strong({ children, ...props }) {
          return (
            <strong className="font-bold text-white" {...props}>
              {children}
            </strong>
          );
        },
        em({ children, ...props }) {
          return (
            <em className="italic text-gray-200" {...props}>
              {children}
            </em>
          );
        },
        table({ children, ...props }) {
          return (
            <table
              className="min-w-full table-auto border-collapse border border-gray-500"
              {...props}
            >
              {children}
            </table>
          );
        },
        thead({ children, ...props }) {
          return (
            <thead className="bg-gray-600 text-white" {...props}>
              {children}
            </thead>
          );
        },
        th({ children, ...props }) {
          return (
            <th
              className="border border-gray-500 px-4 py-2 text-left"
              {...props}
            >
              {children}
            </th>
          );
        },
        td({ children, ...props }) {
          return (
            <td
              className="border border-gray-500 px-4 py-2 text-gray-200"
              {...props}
            >
              {children}
            </td>
          );
        },
        tr({ children }) {
          return <tr className="even:bg-gray-700">{children}</tr>;
        },
      }}
    >
      {content}
    </Markdown>
  );
};
