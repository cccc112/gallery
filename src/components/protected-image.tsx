'use client';

import Image from 'next/image';

interface ProtectedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  showWatermark?: boolean;
  watermarkText?: string;
  watermarkSize?: 'sm' | 'md' | 'lg';
  onError?: () => void;
}

/**
 * 防盜圖元件：
 * 1. 禁用右鍵選單
 * 2. 禁用拖曳
 * 3. 透明遮罩（擋長按儲存）
 * 4. 雙色光暈浮水印（深淺背景皆可見）
 */
export function ProtectedImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  quality = 85,
  showWatermark = true,
  watermarkText = 'Atelier Blanc',
  watermarkSize = 'md',
  onError,
}: ProtectedImageProps) {
  const textSizeMap = {
    sm: 'text-[10px]',
    md: 'text-base',
    lg: 'text-xl',
  };

  const trackingMap = {
    sm: 'tracking-[0.3em]',
    md: 'tracking-[0.5em]',
    lg: 'tracking-[0.7em]',
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onContextMenu={e => e.preventDefault()}
    >
      {/* ── 圖片本體 ── */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={`${className} pointer-events-none select-none`}
        sizes={sizes}
        priority={priority}
        quality={quality}
        draggable={false}
        onError={onError}
      />

      {/* ── 遮罩層：擋右鍵、拖曳、長按儲存 ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      />

      {/* ── 浮水印層（雙色光暈，任何背景皆可見）── */}
      {showWatermark && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent 0px, transparent 48px,
              rgba(255,255,255,0.16) 48px, rgba(255,255,255,0.16) 49px,
              transparent 49px, transparent 50px,
              rgba(0,0,0,0.07) 50px, rgba(0,0,0,0.07) 51px
            )`,
          }}
        >
          {/* 中央斜向文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-serif ${textSizeMap[watermarkSize]} ${trackingMap[watermarkSize]} uppercase select-none whitespace-nowrap font-semibold`}
              style={{
                transform: 'rotate(-30deg)',
                color: 'rgba(255,255,255,0.5)',
                textShadow: [
                  '0 0 4px rgba(0,0,0,0.95)',
                  '0 0 10px rgba(0,0,0,0.7)',
                  '1px 1px 0 rgba(0,0,0,0.6)',
                  '-1px -1px 0 rgba(0,0,0,0.6)',
                ].join(', '),
              }}
            >
              {watermarkText}
            </span>
          </div>

          {/* 右下角版權標示 */}
          <div className="absolute bottom-2 right-3">
            <span
              className="text-[9px] font-light tracking-widest select-none"
              style={{
                color: 'rgba(255,255,255,0.55)',
                textShadow: '0 0 3px rgba(0,0,0,0.98), 0 0 8px rgba(0,0,0,0.8)',
              }}
            >
              © Atelier Blanc · Preview Only
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
