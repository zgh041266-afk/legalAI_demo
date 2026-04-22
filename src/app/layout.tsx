import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '商标侵权律师函生成系统',
  description: '基于 Claude AI 的商标侵权律师函智能生成平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
