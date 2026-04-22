'use client';

import { TRADEMARK_CASES } from '@/data/cases';
import CaseCard from './CaseCard';

interface CaseLibraryProps {
  selectedCaseId: string;
  onSelect: (id: string) => void;
}

export default function CaseLibrary({ selectedCaseId, onSelect }: CaseLibraryProps) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-yellow-400 mb-1">商标侵权案件库</h2>
        <p className="text-slate-400 text-sm">
          选择一个参考案例，系统将基于该案情模式生成律师函
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {TRADEMARK_CASES.map((c) => (
          <CaseCard
            key={c.id}
            caseData={c}
            selected={selectedCaseId === c.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
