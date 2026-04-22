'use client';

import { InfringementClue } from '@/types';
import { useState } from 'react';

interface InfringementTableProps {
  clues: InfringementClue[];
}

export default function InfringementTable({ clues }: InfringementTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === clues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clues.map((c) => c.id));
    }
  }

  function exportCSV() {
    const headers = ['序号', '平台', '商品标题', '侵权URL', '侵权类型', '相似度得分', '抓取时间'];
    const rows = clues.map((c) => [
      c.序号,
      c.平台,
      c.商品标题,
      c.侵权URL,
      c.侵权类型,
      c.相似度得分,
      c.抓取时间,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `侵权线索汇总_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel() {
    // 动态导入 xlsx
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(
      clues.map((c) => ({
        序号: c.序号,
        平台: c.平台,
        商品标题: c.商品标题,
        侵权URL: c.侵权URL,
        侵权类型: c.侵权类型,
        相似度得分: c.相似度得分,
        抓取时间: c.抓取时间,
        商家名称: c.商家名称 || '',
        价格: c.价格 || '',
        销量: c.销量 || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '侵权线索');
    XLSX.writeFile(wb, `侵权线索汇总_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-yellow-400">侵权线索汇总表</h3>
          <p className="text-xs text-slate-500 mt-0.5">共 {clues.length} 条线索</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            导出 CSV
          </button>
          <button
            onClick={exportExcel}
            className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded-lg border border-green-500/30 transition-colors"
          >
            导出 Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/30">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === clues.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-600"
                />
              </th>
              <th className="px-3 py-2 text-left text-slate-400 font-medium">序号</th>
              <th className="px-3 py-2 text-left text-slate-400 font-medium">平台</th>
              <th className="px-3 py-2 text-left text-slate-400 font-medium">商品标题</th>
              <th className="px-3 py-2 text-left text-slate-400 font-medium">侵权类型</th>
              <th className="px-3 py-2 text-left text-slate-400 font-medium">相似度</th>
              <th className="px-3 py-2 text-left text-slate-400 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {clues.map((clue) => (
              <tr
                key={clue.id}
                className="border-t border-slate-800/30 hover:bg-slate-800/20 transition-colors"
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(clue.id)}
                    onChange={() => toggleSelect(clue.id)}
                    className="rounded border-slate-600"
                  />
                </td>
                <td className="px-3 py-3 text-slate-300">{clue.序号}</td>
                <td className="px-3 py-3">
                  <span className="px-2 py-1 bg-orange-500/10 text-orange-400 text-xs rounded border border-orange-500/20">
                    {clue.平台}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-300 max-w-xs truncate">
                  {clue.商品标题}
                </td>
                <td className="px-3 py-3">
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20">
                    {clue.侵权类型}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
                        style={{ width: `${clue.相似度得分}%` }}
                      />
                    </div>
                    <span className="text-slate-300 text-xs font-medium">
                      {clue.相似度得分}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <a
                    href={clue.侵权URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                  >
                    查看
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-800/20 flex items-center justify-between">
          <span className="text-sm text-slate-400">已选择 {selectedIds.length} 条</span>
          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold rounded-lg transition-colors">
            生成证据包
          </button>
        </div>
      )}
    </div>
  );
}
