'use client';

import { useLayoutStore } from '@/stores/useLayoutStore';

// --- Types ---

interface SplitLayoutProps {
  editor: React.ReactNode;
  sidePanel: React.ReactNode;
}

// --- Component ---

export function SplitLayout({ editor, sidePanel }: SplitLayoutProps) {
  const isSidePanelOpen = useLayoutStore((s) => s.isSidePanelOpen);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        className={`transition-all duration-300 ease-in-out ${isSidePanelOpen ? 'w-[70%]' : 'w-full'}`}
      >
        {editor}
      </div>

      <div
        className={`border-l border-gray-200 transition-all duration-300 ease-in-out dark:border-gray-700 ${isSidePanelOpen ? 'w-[30%]' : 'w-0 overflow-hidden border-l-0'}`}
      >
        {sidePanel}
      </div>
    </div>
  );
}
