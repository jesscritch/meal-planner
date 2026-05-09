"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  tagStyle: "liked" | "avoided";
}

const TAG_CLASSES: Record<Props["tagStyle"], string> = {
  liked: "bg-emerald-50 border-emerald-200 text-emerald-700",
  avoided: "bg-orange-50 border-orange-200 text-orange-700",
};

const REMOVE_CLASSES: Record<Props["tagStyle"], string> = {
  liked: "hover:text-emerald-900",
  avoided: "hover:text-orange-900",
};

export default function TagInput({ tags, onAdd, onRemove, placeholder, tagStyle }: Props) {
  const [value, setValue] = useState("");

  function handleAdd() {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) { setValue(""); return; }
    onAdd(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
    if (e.key === "Backspace" && value === "" && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div>
      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${TAG_CLASSES[tagStyle]}`}
            >
              {tag}
              <button
                onClick={() => onRemove(tag)}
                className={`text-current opacity-50 ${REMOVE_CLASSES[tagStyle]} transition-opacity hover:opacity-100 leading-none`}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 text-gray-800"
        />
        <button
          onClick={handleAdd}
          disabled={!value.trim()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
