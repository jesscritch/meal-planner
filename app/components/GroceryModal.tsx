"use client";

import { useEffect, useRef } from "react";

interface Props {
  items: string[];
  onClose: () => void;
}

export default function GroceryModal({ items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={ref} className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm sm:mx-4 overflow-hidden max-h-[88vh] sm:max-h-[80vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Grocery List</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center flex-1">No meals planned yet.</p>
        ) : (
          <ul className="p-4 space-y-1 overflow-y-auto flex-1">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700 py-1.5 border-b border-gray-50 last:border-0">
                <span className="mt-0.5 text-gray-300 shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="px-4 pb-4 pt-3 shrink-0 border-t border-gray-100">
          <button
            onClick={() => {
              const text = items.join("\n");
              navigator.clipboard.writeText(text).catch(() => {});
            }}
            className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-900 active:bg-gray-50 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
