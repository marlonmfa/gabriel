'use client';

import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { StreamingCursor } from './StreamingCursor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TutorMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function TutorMessage({ role, content, isStreaming }: TutorMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="message-user px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm text-white">
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
      <div className="message-assistant px-4 py-3 rounded-2xl rounded-tl-sm flex-1 text-sm text-slate-200 overflow-hidden">
        <div className="prose prose-invert prose-sm max-w-none [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3 [&>pre]:mb-3 [&>h1]:mb-2 [&>h2]:mb-2 [&>h3]:mb-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {isStreaming && <StreamingCursor />}
      </div>
    </div>
  );
}
