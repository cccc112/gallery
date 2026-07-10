'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function GlobalProgressBar() {
  return (
    <ProgressBar
      height="4px"
      color="#4f46e5"
      options={{ showSpinner: true }}
      shallowRouting
    />
  );
}
