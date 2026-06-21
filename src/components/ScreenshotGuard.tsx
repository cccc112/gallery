'use client';

import { useEffect, useState } from 'react';

/**
 * 全域防截圖/錄屏偵測元件
 * 偵測方式：
 * 1. PrintScreen 按鍵 (Windows/Linux)
 * 2. Cmd+Shift+3/4 (macOS) ← 部分情境有效
 * 3. visibilitychange（切換 tab / 螢幕錄影工具觸發）
 * 注意：這是瀏覽器端的最大努力防護，無法阻擋系統級截圖工具
 */
export function ScreenshotGuard() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const block = () => {
      setBlocked(true);
      clearTimeout(timer);
      timer = setTimeout(() => setBlocked(false), 2500);
    };

    const handleKey = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        block();
      }
      // macOS Cmd+Shift+3 / Cmd+Shift+4 / Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(e.key)) {
        e.preventDefault();
        block();
      }
    };

    // 部分螢幕錄影工具會觸發 visibilitychange
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        block();
      }
    };

    document.addEventListener('keydown', handleKey, true);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(timer);
    };
  }, []);

  if (!blocked) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
      aria-hidden="true"
    >
      <div className="text-center space-y-3">
        <div className="text-5xl mb-2">🛡️</div>
        <p className="text-white/90 font-serif text-xl tracking-wider">
          Atelier Blanc
        </p>
        <p className="text-white/50 text-xs tracking-widest uppercase">
          藝術品版權受保護 · All Rights Reserved
        </p>
      </div>
    </div>
  );
}
