'use client';

import { useState, useCallback, useEffect } from 'react';
import MainWorkflow from '@/components/trademark/MainWorkflow';
import { LawyerLetterParams, StreamChunk } from '@/types';

export default function Home() {
  const [letterContent, setLetterContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastParams, setLastParams] = useState<LawyerLetterParams | null>(null);

  // Reset preview when params change
  useEffect(() => {
    setLetterContent('');
  }, [lastParams?.caseId]);

  const handleGenerate = useCallback(async (params: LawyerLetterParams) => {
    setLoading(true);
    setLetterContent('');
    setLastParams(params);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errText = await res.text();
        setLetterContent(`[错误] 请求失败: ${res.status} - ${errText}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk: StreamChunk = JSON.parse(line.slice(6));
            if (chunk.type === 'text') {
              setLetterContent((prev) => prev + chunk.content);
            } else if (chunk.type === 'error') {
              setLetterContent((prev) => prev + `\n[错误] ${chunk.content}`);
            }
          } catch {
            // malformed SSE line
          }
        }
      }
    } catch (e) {
      setLetterContent(`[网络错误] ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MainWorkflow
      onGenerateLetter={handleGenerate}
      letterContent={letterContent}
      loading={loading}
    />
  );
}
