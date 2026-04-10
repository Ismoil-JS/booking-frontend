import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

export type MarkdownTextVariant = 'chatAssistant' | 'chatUser' | 'profile' | 'card';

type MarkdownTextProps = {
  children: string;
  variant?: MarkdownTextVariant;
  className?: string;
};

/**
 * Renders common Markdown (GFM): **bold**, *italic*, lists, `code`, links, ~~strike~~, tables, etc.
 * Raw HTML in the string is not executed (safe for AI/user text).
 */
export default function MarkdownText({ children, variant = 'profile', className = '' }: MarkdownTextProps) {
  const linkClass =
    variant === 'chatUser'
      ? 'text-blue-100 underline underline-offset-2 hover:text-white'
      : variant === 'chatAssistant'
        ? 'text-blue-700 underline underline-offset-2 hover:text-blue-800'
        : 'text-blue-600 underline underline-offset-2 hover:text-blue-800';

  const inlineCodeBg =
    variant === 'chatUser'
      ? 'bg-white/20 text-white'
      : variant === 'chatAssistant'
        ? 'bg-gray-200/80 text-gray-900'
        : 'bg-gray-100 text-gray-800';

  const tableBorder = variant === 'chatUser' ? 'border-white/30' : 'border-gray-200';

  const components: Components = {
    p: (props) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
    strong: (props) => <strong className="font-semibold" {...props} />,
    em: (props) => <em className="italic" {...props} />,
    ul: (props) => <ul className="my-2 list-disc pl-5 space-y-1" {...props} />,
    ol: (props) => <ol className="my-2 list-decimal pl-5 space-y-1" {...props} />,
    li: (props) => <li className="leading-relaxed" {...props} />,
    a: (props) => <a className={linkClass} target="_blank" rel="noopener noreferrer" {...props} />,
    code: ({ className, children, ...props }) => {
      const isFence = Boolean(className?.startsWith('language-'));
      if (isFence) {
        return (
          <code className={`block w-full font-mono text-xs ${className}`} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className={`rounded px-1 py-0.5 text-[0.85em] font-mono ${inlineCodeBg}`} {...props}>
          {children}
        </code>
      );
    },
    pre: (props) => (
      <pre
        className={`my-2 overflow-x-auto rounded-xl border border-black/5 p-3 text-xs font-mono ${
          variant === 'chatUser' ? 'bg-black/25 text-white' : variant === 'chatAssistant' ? 'bg-gray-800 text-gray-100' : 'bg-gray-900 text-gray-100'
        }`}
        {...props}
      />
    ),
    h1: (props) => <h1 className="mt-2 mb-1 text-lg font-bold" {...props} />,
    h2: (props) => <h2 className="mt-2 mb-1 text-base font-semibold" {...props} />,
    h3: (props) => <h3 className="mt-2 mb-1 text-sm font-semibold" {...props} />,
    blockquote: (props) => (
      <blockquote
        className={`my-2 border-l-4 pl-3 italic opacity-90 ${variant === 'chatUser' ? 'border-white/50' : 'border-gray-300'}`}
        {...props}
      />
    ),
    hr: (props) => (
      <hr className={`my-3 ${variant === 'chatUser' ? 'border-white/30' : 'border-gray-200'}`} {...props} />
    ),
    table: (props) => (
      <div className="my-2 overflow-x-auto">
        <table className={`min-w-full border-collapse border text-sm ${tableBorder}`} {...props} />
      </div>
    ),
    th: (props) => <th className={`border px-2 py-1 text-left font-semibold ${tableBorder}`} {...props} />,
    td: (props) => <td className={`border px-2 py-1 align-top ${tableBorder}`} {...props} />,
    del: (props) => <del className="opacity-80" {...props} />,
  };

  return (
    <div className={`markdown-text ${className}`}>
      <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {children}
      </Markdown>
    </div>
  );
}
