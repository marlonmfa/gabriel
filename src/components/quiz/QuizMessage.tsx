'use client';

import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { StreamingCursor } from '@/components/session/StreamingCursor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuizMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function QuizMessage({ role, content, isStreaming }: QuizMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="message-user px-4 py-3 rounded-2xl rounded-tr-sm max-w-sm text-sm text-white">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 mt-0.5">
        <GabrielLogo size="sm" showText={false} />
      </div>
      <div className="message-assistant px-4 py-3 rounded-2xl rounded-tl-sm flex-1 text-sm text-slate-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        {isStreaming && <StreamingCursor />}
      </div>
    </div>
  );
}
