'use client';

import { EvidencePackage } from '@/types';

interface EvidencePackageListProps {
  packages: EvidencePackage[];
}

export default function EvidencePackageList({ packages }: EvidencePackageListProps) {
  function downloadPackage(pkg: EvidencePackage) {
    if (pkg.zipPath) {
      const link = document.createElement('a');
      link.href = pkg.zipPath;
      link.download = `证据包_${pkg.packageId}.zip`;
      link.click();
    }
  }

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <h3 className="text-sm font-semibold text-yellow-400">标准证据包</h3>
        <p className="text-xs text-slate-500 mt-0.5">共 {packages.length} 个证据包</p>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        {packages.map((pkg) => (
          <div
            key={pkg.packageId}
            className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 hover:border-yellow-500/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  证据包 #{pkg.packageId}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  案件ID: {pkg.caseId} | 线索ID: {pkg.clueId}
                </p>
              </div>
              <button
                onClick={() => downloadPackage(pkg)}
                className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs rounded-lg border border-yellow-500/30 transition-colors"
              >
                📦 下载 ZIP
              </button>
            </div>

            {/* Screenshots */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">包含截图：</p>
              <div className="grid grid-cols-2 gap-2">
                {pkg.screenshots.map((screenshot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded border border-slate-700/30"
                  >
                    <span className="text-slate-500 text-xs">🖼️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs truncate">
                        {screenshot.filename}
                      </p>
                      <p className="text-slate-600 text-xs font-mono">
                        {screenshot.hash.slice(0, 16)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-3 pt-3 border-t border-slate-700/30">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">平台：</span>
                  <span className="text-slate-300">{pkg.metadata.platform}</span>
                </div>
                <div>
                  <span className="text-slate-500">抓取时间：</span>
                  <span className="text-slate-300">
                    {new Date(pkg.metadata.captureTime).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">URL：</span>
                  <a
                    href={pkg.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline ml-1"
                  >
                    {pkg.metadata.url.slice(0, 50)}...
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                创建于 {new Date(pkg.createdAt).toLocaleString('zh-CN')}
              </span>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                  ✓ 已固化
                </span>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                  SHA256
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Note */}
      <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-800/20">
        <p className="text-xs text-slate-500">
          💡 证据包可直接提交至电商平台投诉系统或公证处，包含全屏截图、文件哈希值和元数据JSON
        </p>
      </div>
    </div>
  );
}
