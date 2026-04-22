'use client';

import { useState, useRef } from 'react';
import { ImageAnalysisResult, ImageAnalysisRequest } from '@/types';

interface ImageUploadAnalyzerProps {
  onAnalysisComplete?: (result: ImageAnalysisResult) => void;
  trademarkName?: string;
  trademarkNumber?: string;
  goodsCategory?: string;
}

export default function ImageUploadAnalyzer({
  onAnalysisComplete,
  trademarkName: initialTrademarkName = '',
  trademarkNumber: initialTrademarkNumber = '',
  goodsCategory: initialGoodsCategory = ''
}: ImageUploadAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // 表单数据
  const [trademarkName, setTrademarkName] = useState(initialTrademarkName);
  const [trademarkNumber, setTrademarkNumber] = useState(initialTrademarkNumber);
  const [goodsCategory, setGoodsCategory] = useState(initialGoodsCategory);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小 (限制为10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('图片文件大小不能超过10MB');
      return;
    }

    setError(null);

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!preview || !trademarkName.trim()) {
      setError('请先上传图片并填写商标名称');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // 转换base64为File对象
      const response = await fetch(preview);
      const blob = await response.blob();
      const file = new File([blob], 'uploaded-image.jpg', { type: blob.type });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('trademarkName', trademarkName.trim());
      if (trademarkNumber.trim()) {
        formData.append('trademarkNumber', trademarkNumber.trim());
      }
      if (goodsCategory.trim()) {
        formData.append('goodsCategory', goodsCategory.trim());
      }

      const apiResponse = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || '分析失败');
      }

      const analysisResult: ImageAnalysisResult = await apiResponse.json();
      setResult(analysisResult);

      // 通知父组件
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }

    } catch (err) {
      console.error('图片分析错误:', err);
      setError(err instanceof Error ? err.message : '分析过程中发生错误');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'high': return '高风险';
      case 'medium': return '中等风险';
      case 'low': return '低风险';
      default: return '未知';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">图片侵权分析</h2>

      {/* 商标信息输入 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            商标名称 *
          </label>
          <input
            type="text"
            value={trademarkName}
            onChange={(e) => setTrademarkName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入商标名称"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            商标注册号
          </label>
          <input
            type="text"
            value={trademarkNumber}
            onChange={(e) => setTrademarkNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="可选"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            商品类别
          </label>
          <input
            type="text"
            value={goodsCategory}
            onChange={(e) => setGoodsCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如：第35类"
          />
        </div>
      </div>

      {/* 图片上传区域 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          上传疑似侵权图片 *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="预览"
                className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
              />
              <button
                onClick={resetAnalysis}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                重新选择图片
              </button>
            </div>
          ) : (
            <div>
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                选择图片文件
              </label>
              <p className="text-sm text-gray-500 mt-2">支持 JPG、PNG、GIF 格式，最大10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* 分析按钮 */}
      {preview && (
        <div className="mb-6">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !trademarkName.trim()}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>AI分析中...</span>
              </>
            ) : (
              <span>开始AI侵权分析</span>
            )}
          </button>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="text-red-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">分析结果</h3>

          {/* 风险等级 */}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">侵权风险等级：</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ml-2 ${getRiskColor(result.analysis.infringementRisk)}`}>
              {getRiskText(result.analysis.infringementRisk)}
            </span>
            <span className="text-sm text-gray-600 ml-2">
              (视觉相似度: {(result.analysis.visualSimilarity * 100).toFixed(1)}%)
            </span>
          </div>

          {/* 检测到的文字 */}
          {result.analysis.detectedText.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">检测到的文字：</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.analysis.detectedText.map((text, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 检测到的Logo */}
          {result.analysis.detectedLogos.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">检测到的Logo：</span>
              <div className="space-y-2 mt-1">
                {result.analysis.detectedLogos.map((logo, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                    <span className="font-medium text-gray-800">{logo.brand}</span>
                    <span className="text-sm text-gray-600">
                      置信度: {(logo.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      位置: [{logo.boundingBox.join(', ')}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 风险原因 */}
          {result.analysis.riskReasons.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">风险分析：</span>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {result.analysis.riskReasons.map((reason, index) => (
                  <li key={index} className="text-sm text-gray-600">{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 相似案例 */}
          {result.analysis.similarCases.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">相似案例参考：</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.analysis.similarCases.map((caseId, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    {caseId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 处理时间 */}
          <div className="text-xs text-gray-500">
            处理时间: {result.processingTime}ms
          </div>
        </div>
      )}
    </div>
  );
}