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
  // 根據尺寸決定浮水印字體大小與間距
  const fontSizeMap = { sm: 11, md: 15, lg: 22 };
  const spacingMap = { sm: 90, md: 120, lg: 160 };
  const fontSize = fontSizeMap[watermarkSize];
  const spacing = spacingMap[watermarkSize];

  // 使用 SVG 全版平鋪浮水印（無法透過 CSS 輕易移除，比 DOM 文字更難被工具刪除）
  const svgWatermark = `
    <svg xmlns='http://www.w3.org/2000/svg' width='${spacing}' height='${spacing}'>
      <defs>
        <style>text { font-family: Georgia, serif; font-size: ${fontSize}px; font-weight: 700; letter-spacing: 0.15em; }</style>
      </defs>
      <text
        x='50%' y='50%'
        dominant-baseline='middle'
        text-anchor='middle'
        transform='rotate(-30, ${spacing / 2}, ${spacing / 2})'
        fill='rgba(255,255,255,0.75)'
        style='paint-order: stroke; stroke: rgba(0,0,0,0.85); stroke-width: 3px;'
      >${watermarkText}</text>
    </svg>
  `;
  const svgUrl = `url("data:image/svg+xml,${encodeURIComponent(svgWatermark)}")`;

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

      {/* ── 浮水印層：SVG 全版平鋪，任何方向裁切都能看到 ── */}
      {showWatermark && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none z-20"
          style={{
            backgroundImage: svgUrl,
            backgroundRepeat: 'repeat',
            backgroundSize: `${spacing}px ${spacing}px`,
          }}
        />
      )}

      {/* ── 右下角版權標示 ── */}
      {showWatermark && (
        <div className="absolute bottom-1.5 right-2 z-30 pointer-events-none select-none">
          <span
            className="text-[9px] font-semibold tracking-widest uppercase"
            style={{
              color: 'rgba(255,255,255,0.95)',
              textShadow: '0 0 6px rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,0.9)',
            }}
          >
            © Atelier Blanc
          </span>
        </div>
      )}
    </div>
  );
}
