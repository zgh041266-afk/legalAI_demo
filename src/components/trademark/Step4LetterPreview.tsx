'use client';

import { useState, useCallback } from 'react';
import { LawyerLetterParams } from '@/types';

interface Step4LetterPreviewProps {
  content: string;
  loading: boolean;
  formData: Partial<LawyerLetterParams>;
  onBack: () => void;
  onRegenerate: () => void;
}

export default function Step4LetterPreview({
  content,
  loading,
  formData,
  onBack,
  onRegenerate,
}: Step4LetterPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 复制到剪贴板
  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  // 下载为文本文件
  const handleDownloadTxt = useCallback(() => {
    if (!content) return;
    const recipientCompany = formData.recipientCompany || '被函方';
    const senderCompany = formData.senderCompany || '委托方';
    const text = `
================================================================================
                                    律师函
================================================================================

收件方：${recipientCompany}

${content}

--------------------------------------------------------------------------------
发件方：${senderCompany}
日期：${new Date().toLocaleDateString('zh-CN')}
================================================================================
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `律师函_${recipientCompany}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [content, formData]);

  // 导出DOCX
  const handleExportDocx = useCallback(async () => {
    if (!content) return;
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      
      const recipientCompany = formData.recipientCompany || '被函方';
      const senderCompany = formData.senderCompany || '委托方';

      const paragraphs = content.split('\n').map((line) => {
        if (line.startsWith('# ')) {
          return new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          });
        }
        if (line.startsWith('## ')) {
          return new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 150 },
          });
        }
        if (line.trim() === '') {
          return new Paragraph({ text: '' });
        }
        return new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
          spacing: { after: 100 },
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: '律师函',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [new TextRun({ text: `收件方：${recipientCompany}`, bold: true })],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [new TextRun({ text: '─'.repeat(50) })],
                spacing: { after: 200 },
              }),
              ...paragraphs,
              new Paragraph({
                children: [new TextRun({ text: '─'.repeat(50) })],
                spacing: { before: 200 },
              }),
              new Paragraph({
                children: [new TextRun({ text: `发件方：${senderCompany}`, bold: true })],
                spacing: { before: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `日期：${new Date().toLocaleDateString('zh-CN')}`,
                  }),
                ],
                spacing: { before: 100 },
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `律师函_${recipientCompany}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('DOCX导出失败:', error);
      alert('DOCX导出失败，请重试');
    }
    setShowExportMenu(false);
  }, [content, formData]);

  // 下载PDF
  const handleDownloadPdf = useCallback(async () => {
    if (!content) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const recipientCompany = formData.recipientCompany || '被函方';
      const senderCompany = formData.senderCompany || '委托方';

      const htmlContent = `
        <div style="font-family: 'SimSun', '宋体', serif; font-size: 14px; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 40px;">
          <h1 style="text-align: center; font-size: 24px; margin-bottom: 30px;">律师函</h1>
          <p style="font-weight: bold; margin-bottom: 20px;"><strong>收件方：</strong>${recipientCompany}</p>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
          <div style="text-indent: 2em;">
            ${content.split('\n').map(line => {
              if (line.startsWith('# ')) return `<h2 style="font-size: 18px; font-weight: bold;">${line.substring(2)}</h2>`;
              if (line.startsWith('## ')) return `<h3 style="font-size: 16px; font-weight: bold;">${line.substring(3)}</h3>`;
              if (line.trim() === '') return '<br>';
              return `<p style="margin: 10px 0;">${line}</p>`;
            }).join('\n')}
          </div>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
          <div style="margin-top: 30px; text-align: right;">
            <p><strong>发件方：</strong>${senderCompany}</p>
            <p><strong>日期：</strong>${new Date().toLocaleDateString('zh-CN')}</p>
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `律师函_${recipientCompany}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(htmlContent).save();
    } catch (error) {
      console.error('PDF导出失败:', error);
      alert('PDF导出失败，请重试');
    }
    setShowExportMenu(false);
  }, [content, formData]);

  return (
    <div className="p-6 md:p-8">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">律师函预览</h2>
        <p className="text-slate-500">
          {loading
            ? 'AI正在生成律师函，请稍候...'
            : content
            ? '律师函已生成，您可以预览、复制或下载'
            : '点击"重新生成"开始生成律师函'}
        </p>
      </div>

      {/* 预览区域 */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-inner overflow-hidden mb-6">
        {/* 工具栏 */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">预览模式</span>
          </div>
          {content && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                {copied ? '✓ 已复制' : '📋 复制'}
              </button>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-8 min-h-[400px] max-h-[600px] overflow-y-auto">
          {loading && !content ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 mb-4" />
              <p className="text-slate-500">AI正在起草律师函...</p>
            </div>
          ) : content ? (
            <div className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed">
                {content}
                {loading && <span className="animate-pulse">▌</span>}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>律师函内容将在这里显示</p>
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
        >
          ← 返回修改信息
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '生成中...' : '🔄 重新生成'}
          </button>

          {content && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold transition-colors shadow-lg flex items-center gap-2"
              >
                ⬇ 导出文档
                <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handleExportDocx}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-blue-500">📝</span> Word 文档 (.docx)
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-red-500">📄</span> PDF文档 (.pdf)
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleDownloadTxt}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-gray-500">📃</span> 纯文本 (.txt)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
