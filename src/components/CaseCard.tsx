import { TrademarkCase } from '@/types';

interface CaseCardProps {
  caseData: TrademarkCase;
  selected: boolean;
  onSelect: (id: string) => void;
}

const BRAND_COLORS: Record<string, { bg: string; accent: string; border: string }> = {
  'luckin-coffee': { bg: 'from-blue-950/60', accent: 'text-blue-300', border: 'border-blue-500/40' },
  xiaomi: { bg: 'from-orange-950/60', accent: 'text-orange-300', border: 'border-orange-500/40' },
  miniso: { bg: 'from-red-950/60', accent: 'text-red-300', border: 'border-red-500/40' },
  mixue: { bg: 'from-red-950/60', accent: 'text-rose-300', border: 'border-rose-500/40' },
  alien: { bg: 'from-green-950/60', accent: 'text-green-300', border: 'border-green-500/40' },
};

export default function CaseCard({ caseData, selected, onSelect }: CaseCardProps) {
  const colors = BRAND_COLORS[caseData.id] || {
    bg: 'from-slate-900/60',
    accent: 'text-slate-300',
    border: 'border-slate-500/40',
  };

  return (
    <div
      className={`relative rounded-xl p-5 cursor-pointer transition-all duration-200 border bg-gradient-to-br to-slate-900/40 ${colors.bg} ${colors.border} ${
        selected
          ? 'ring-2 ring-yellow-400 scale-[1.02] shadow-lg shadow-yellow-900/30'
          : 'hover:scale-[1.01] hover:shadow-md'
      }`}
      onClick={() => onSelect(caseData.id)}
    >
      {selected && (
        <span className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
          已选择
        </span>
      )}

      {/* Header */}
      <div className="mb-3">
        <h3 className={`text-lg font-bold ${colors.accent}`}>{caseData.plaintiff}</h3>
        <p className="text-slate-400 text-sm mt-0.5">vs. {caseData.defendant}</p>
      </div>

      {/* Case meta */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-black/30 rounded p-2">
          <p className="text-slate-500">案号</p>
          <p className="text-slate-300 font-mono mt-0.5">{caseData.caseNumber}</p>
        </div>
        <div className="bg-black/30 rounded p-2">
          <p className="text-slate-500">赔偿金额</p>
          <p className="text-yellow-300 font-bold mt-0.5">{caseData.compensation}</p>
        </div>
      </div>

      {/* Trademark vs Infringing */}
      <div className="bg-black/20 rounded p-3 mb-3 space-y-1">
        <div className="flex gap-2 text-xs">
          <span className="text-slate-500 shrink-0">注册商标：</span>
          <span className={`font-medium ${colors.accent}`}>{caseData.trademarkName}</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-slate-500 shrink-0">侵权标识：</span>
          <span className="text-red-400">{caseData.infringingMark}</span>
        </div>
      </div>

      {/* Key points */}
      <ul className="space-y-1 mb-3">
        {caseData.keyPoints.slice(0, 2).map((p, i) => (
          <li key={i} className="flex gap-2 text-xs text-slate-300">
            <span className={`shrink-0 ${colors.accent}`}>▸</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/40">
        <span>{caseData.court.replace('人民法院', '').replace('自治区高级', '')}</span>
        <span>{caseData.year} 年</span>
      </div>
    </div>
  );
}
