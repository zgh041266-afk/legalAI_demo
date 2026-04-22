'use client';

import { useRef, useState } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface LetterPreviewProps {
  content: string;
  thinking: string;
  loading: boolean;
  onDownload: () => void;
  title?: string;
  recipientCompany?: string;
  senderCompany?: string;
}

export default function LetterPreview({
  content,
  thinking,
  loading,
  onDownload,
  title = '律师函',
  recipientCompany = '被函方',
  senderCompany = '委托方',
}: LetterPreviewProps) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const prevRef = useRef<HTMLDivElement>(null);

  // 下载为 DOCX
  const downloadAsDocx = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      
      const paragraphs = content.split('\n').map((line) => {
        // 检测标题格式
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
                text: title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `收件方：${recipientCompany}`, bold: true }),
                ],
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
                children: [
                  new TextRun({ text: `发件方：${senderCompany}`, bold: true }),
                ],
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
      saveAs(blob, `${title}_${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (error) {
      console.error('DOCX导出失败:', error);
      alert('DOCX导出失败，请重试');
    }
    setShowFormatMenu(false);
  };

  // 下载为 Markdown
  const downloadAsMarkdown = () => {
    const markdown = `# ${title}

**收件方：** ${recipientCompany}

---

${content}

---

**发件方：** ${senderCompany}  
**日期：** ${new Date().toLocaleDateString('zh-CN')}

---
*本律师函由AI辅助生成，仅供参考*
`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${title}_${new Date().toISOString().slice(0, 10)}.md`);
    setShowFormatMenu(false);
  };

  // 下载为 TXT
  const downloadAsTxt = () => {
    const text = `
================================================================================
                                    ${title}
================================================================================

收件方：${recipientCompany}

${content}

--------------------------------------------------------------------------------
发件方：${senderCompany}
日期：${new Date().toLocaleDateString('zh-CN')}
================================================================================
`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title}_${new Date().toISOString().slice(0, 10)}.txt`);
    setShowFormatMenu(false);
  };

  // 下载为 HTML（可打印为PDF）
  const downloadAsHtml = () => {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { margin: 2cm; }
    body { font-family: "SimSun", "宋体", serif; font-size: 14px; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
    .header { margin-bottom: 30px; }
    .recipient { font-weight: bold; margin-bottom: 20px; }
    hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
    .content { text-indent: 2em; }
    .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
    .signature { margin-top: 30px; text-align: right; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  
  <div class="header">
    <p class="recipient"><strong>收件方：</strong>${recipientCompany}</p>
    <hr>
  </div>
  
  <div class="content">
    ${content.split('\n').map(line => {
      if (line.startsWith('# ')) return `<h2>${line.substring(2)}</h2>`;
      if (line.startsWith('## ')) return `<h3>${line.substring(3)}</h3>`;
      if (line.trim() === '') return '<br>';
      return `<p>${line}</p>`;
    }).join('\n')}
  </div>
  
  <div class="footer">
    <hr>
    <div class="signature">
      <p><strong>发件方：</strong>${senderCompany}</p>
      <p><strong>日期：</strong>${new Date().toLocaleDateString('zh-CN')}</p>
    </div>
  </div>
  
  <p style="text-align:center; color:#999; font-size:12px; margin-top:40px;">
    本律师函由AI辅助生成，仅供参考
  </p>
</body>
</html>
`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${title}_${new Date().toISOString().slice(0, 10)}.html`);
    setShowFormatMenu(false);
  };

  // 使用浏览器打印为PDF
  const printAsPdf = () => {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: "SimSun", "宋体", serif; font-size: 14px; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
    .recipient { font-weight: bold; margin-bottom: 20px; }
    hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
    .content { text-indent: 2em; }
    .signature { margin-top: 30px; text-align: right; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="recipient"><strong>收件方：</strong>${recipientCompany}</p>
  <hr>
  <div class="content">
    ${content.split('\n').map(line => {
      if (line.startsWith('# ')) return `<h2>${line.substring(2)}</h2>`;
      if (line.startsWith('## ')) return `<h3>${line.substring(3)}</h3>`;
      if (line.trim() === '') return '<br>';
      return `<p>${line}</p>`;
    }).join('\n')}
  </div>
  <hr>
  <div class="signature">
    <p><strong>发件方：</strong>${senderCompany}</p>
    <p><strong>日期：</strong>${new Date().toLocaleDateString('zh-CN')}</p>
  </div>
</body>
</html>
`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    setShowFormatMenu(false);
  };

  if (!content && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
          📄
        </div>
        <p className="text-slate-400">选择案例并填写信息，点击生成律师函</p>
        <p className="text-slate-600 text-sm mt-2">
          AI 将基于真实案例模式生成专业律师函
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-yellow-400">
          {loading ? '📝 正在生成…' : '✅ 律师函已生成'}
        </h2>
        {content && !loading && (
          <div className="relative">
            <button
              onClick={() => setShowFormatMenu(!showFormatMenu)}
              className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ⬇ 导出文档
              <svg className={`w-4 h-4 transition-transform ${showFormatMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showFormatMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={downloadAsDocx}
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-blue-400">📝</span> Word 文档 (.docx)
                </button>
                <button
                  onClick={downloadAsHtml}
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-orange-400">📄</span> HTML 网页 (.html)
                </button>
                <button
                  onClick={printAsPdf}
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-red-400">🔴</span> 打印 / 另存为 PDF
                </button>
                <div className="border-t border-slate-700 my-1" />
                <button
                  onClick={downloadAsMarkdown}
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-green-400">📋</span> Markdown (.md)
                </button>
                <button
                  onClick={downloadAsTxt}
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-gray-400">📃</span> 纯文本 (.txt)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thinking block */}
      {thinking && (
        <details className="mb-4 bg-purple-900/20 border border-purple-700/30 rounded-lg p-3 text-xs">
          <summary className="cursor-pointer text-purple-400 font-medium select-none">
            🧠 AI 思考过程 (Thinking)
          </summary>
          <pre className="mt-2 text-purple-200/70 whitespace-pre-wrap overflow-auto max-h-40">
            {thinking}
          </pre>
        </details>
      )}

      {/* Letter content */}
      <div
        ref={prevRef}
        className="flex-1 overflow-y-auto bg-slate-900/60 border border-slate-700/40 rounded-lg p-6"
      >
        {loading && !content && (
          <div className="flex items-center gap-3 text-slate-400">
            <span className="animate-spin h-5 w-5 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 inline-block" />
            AI 正在起草律师函，请稍候…
          </div>
        )}
        <div
          className="letter-content text-slate-100 text-sm leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {content}
          {loading && content && (
            <span className="animate-pulse text-yellow-400">▊</span>
          )}
        </div>
      </div>
    </div>
  );
}
