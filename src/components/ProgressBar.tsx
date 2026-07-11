'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

import { Suspense } from 'react';

export function GlobalProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBar
        height="3px"
        color="#111111"
        options={{ showSpinner: true }}
        shallowRouting
      />
    </Suspense>
  );
}
