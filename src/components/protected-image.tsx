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
 * 4. 全版平鋪浮水印（多行排列，無法用裁切去除）
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
  // 字體大小依 watermarkSize 決定（單一居中版本）
  const fontSizeMap = { sm: 18, md: 26, lg: 38 };
  const fontSize = fontSizeMap[watermarkSize];

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

      {/* ── 浮水印層：單一居中斜置文字 ── */}
      {showWatermark && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none z-20 flex items-center justify-center"
        >
          <span
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.55)',
              textShadow: '0 0 8px rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.8)',
              transform: 'rotate(-20deg)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {watermarkText}
          </span>
        </div>
      )}
    </div>
  );
}
