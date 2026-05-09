"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TagInput from "@/app/components/TagInput";
import { PREFS_KEY, savePreferences } from "@/app/hooks/usePreferences";

export default function SettingsPage() {
  const [liked, setLiked] = useState<string[]>([]);
  const [avoided, setAvoided] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const p = JSON.parse(stored);
        setLiked(p.likedFoods ?? []);
        setAvoided(p.avoidedFoods ?? []);
      }
    } catch {}
    setHydrated(true);
  }, []);

  function handleSave() {
    savePreferences(liked, avoided);
    setSavedAt(Date.now());
  }

  function addLiked(tag: string) { setLiked((prev) => [...prev, tag]); setSavedAt(null); }
  function removeLiked(tag: string) { setLiked((prev) => prev.filter((t) => t !== tag)); setSavedAt(null); }
  function addAvoided(tag: string) { setAvoided((prev) => [...prev, tag]); setSavedAt(null); }
  function removeAvoided(tag: string) { setAvoided((prev) => prev.filter((t) => t !== tag)); setSavedAt(null); }

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
        >
          <span className="text-base leading-none">←</span>
          Back to planner
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Food Preferences</h1>
        <p className="text-sm text-gray-400 mb-8">
          Personalise meal suggestions based on what you love and what you want to skip.
        </p>

        <div className="space-y-5">
          {/* Foods You Like */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Foods You Like</h2>
              <p className="text-xs text-gray-400">Meals featuring these will be starred and sorted to the top.</p>
            </div>
            <TagInput
              tags={liked}
              onAdd={addLiked}
              onRemove={removeLiked}
              placeholder='e.g. salmon, sweet potato, greek yogurt…'
              tagStyle="liked"
            />
          </div>

          {/* Foods to Avoid */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Foods to Avoid</h2>
              <p className="text-xs text-gray-400">Meals with these ingredients will be hidden from suggestions.</p>
            </div>
            <TagInput
              tags={avoided}
              onAdd={addAvoided}
              onRemove={removeAvoided}
              placeholder='e.g. eggs, red meat, dairy…'
              tagStyle="avoided"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Save preferences
          </button>
          {savedAt && (
            <span className="text-sm text-emerald-600 font-medium">Saved ✓</span>
          )}
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-300 mt-4">
          Preferences are stored locally and never leave your device.
        </p>
      </div>
    </div>
  );
}
