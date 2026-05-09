"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FoodLogEntry, MealSuggestion, SuggestionsResult } from "@/app/types/planner";

interface MacroResult {
  summary: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
}

interface Props {
  onClose: () => void;
  entries: FoodLogEntry[];
  onAddEntry: (entry: FoodLogEntry) => void;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  goals: { calories: number; protein: number };
  onAddToMealPlan: (suggestion: MealSuggestion) => void;
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FoodLogPanel({ onClose, entries, onAddEntry, totals, goals, onAddToMealPlan }: Props) {
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [macroResult, setMacroResult] = useState<MacroResult | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedIndex, setAddedIndex] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setVoiceSupported(false);
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(final + interim);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      setTranscript("");
      setMacroResult(null);
      setSuggestions(null);
      setError(null);
      setAddedIndex(null);
      startRecording();
    }
  }

  async function handleSubmit() {
    if (!transcript.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const macroRes = await fetch("/api/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!macroRes.ok) throw new Error("macro");
      const macro: MacroResult = await macroRes.json();
      if (!macro.calories && macro.calories !== 0) throw new Error("parse");

      setMacroResult(macro);

      const entry: FoodLogEntry = {
        id: `${Date.now()}`,
        timestamp: Date.now(),
        transcript,
        summary: macro.summary,
        calories: macro.calories,
        protein: macro.protein,
        carbs: macro.carbs,
        fat: macro.fat,
        notes: macro.notes,
      };
      onAddEntry(entry);

      // Fetch suggestions using updated totals (include this entry)
      const suggestRes = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caloriesConsumed: totals.calories + macro.calories,
          proteinConsumed: totals.protein + macro.protein,
          timeOfDay: timeOfDay(),
        }),
      });

      if (suggestRes.ok) {
        const data: SuggestionsResult = await suggestRes.json();
        setSuggestions(data);
      }
    } catch {
      setError("Couldn't estimate macros for that — try describing it in more detail");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setTranscript("");
    setMacroResult(null);
    setSuggestions(null);
    setError(null);
    setAddedIndex(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Food Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Daily progress */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today&apos;s Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Calories</span>
                <span className="text-gray-400 tabular-nums text-xs">{totals.calories} / {goals.calories} kcal</span>
              </div>
              <ProgressBar value={totals.calories} max={goals.calories} color="bg-orange-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Protein</span>
                <span className="text-gray-400 tabular-nums text-xs">{totals.protein}g / {goals.protein}g</span>
              </div>
              <ProgressBar value={totals.protein} max={goals.protein} color="bg-blue-400" />
            </div>
            {entries.length > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>{goals.calories - totals.calories > 0 ? `${goals.calories - totals.calories} kcal remaining` : "Calorie goal reached"}</span>
                <span>{goals.protein - totals.protein > 0 ? `${goals.protein - totals.protein}g protein remaining` : "Protein goal reached"}</span>
              </div>
            )}
          </div>

          {/* Recording section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Log a Meal</h3>

            {voiceSupported ? (
              <>
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="relative flex items-center justify-center">
                    {isRecording && (
                      <>
                        <div className="absolute w-16 h-16 rounded-full bg-red-400 opacity-25 animate-ping" />
                        <div className="absolute w-20 h-20 rounded-full bg-red-300 opacity-15 animate-ping [animation-delay:200ms]" />
                      </>
                    )}
                    <button
                      onClick={toggleRecording}
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                        isRecording ? "bg-red-500 hover:bg-red-600 scale-110" : "bg-gray-900 hover:bg-gray-700"
                      }`}
                      aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                      {isRecording ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                          <rect x="5" y="5" width="10" height="10" rx="1" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
                          <path d="M7 4a3 3 0 016 0v6a3 3 0 01-6 0V4zm-2 6a1 1 0 012 0 3 3 0 006 0 1 1 0 012 0 5 5 0 01-4 4.9V17h2a1 1 0 010 2H7a1 1 0 010-2h2v-2.1A5 5 0 015 10z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {isRecording ? "Listening… tap to stop" : transcript ? "Tap to record again" : "Tap to start speaking"}
                  </p>
                </div>

                {transcript && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed min-h-[56px]">
                    {transcript}
                    {isRecording && <span className="inline-block w-1 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm align-middle" />}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  Voice not supported in this browser — type your meal instead
                </p>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="e.g. I had two scrambled eggs, a slice of toast, and a coffee with milk"
                  className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 transition-shadow"
                  rows={3}
                />
              </>
            )}

            {transcript.trim() && !macroResult && (
              <button
                onClick={handleSubmit}
                disabled={submitting || isRecording}
                className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Analysing…" : "Analyse meal"}
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Macro card */}
          {macroResult && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Macro Breakdown</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800">{macroResult.summary}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Cal", value: macroResult.calories, unit: "kcal", color: "text-orange-500" },
                    { label: "Protein", value: macroResult.protein, unit: "g", color: "text-blue-500" },
                    { label: "Carbs", value: macroResult.carbs, unit: "g", color: "text-emerald-500" },
                    { label: "Fat", value: macroResult.fat, unit: "g", color: "text-yellow-500" },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label}>
                      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                      <p className="text-[10px] text-gray-400">{unit}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                    </div>
                  ))}
                </div>
                {macroResult.notes && (
                  <p className="text-xs text-gray-500 border-t border-gray-200 pt-3 leading-relaxed">{macroResult.notes}</p>
                )}
              </div>
              <button
                onClick={handleReset}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                + Log another meal
              </button>
            </div>
          )}

          {/* Suggestions */}
          {suggestions && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Suggested for the Rest of the Day</h3>
                <p className="text-xs text-gray-400">
                  {suggestions.remaining.calories} kcal · {suggestions.remaining.protein}g protein remaining
                </p>
              </div>
              <div className="space-y-2">
                {suggestions.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onAddToMealPlan(s);
                      setAddedIndex(i);
                    }}
                    disabled={addedIndex === i}
                    className={`w-full text-left rounded-xl px-4 py-3 border transition-all group ${
                      addedIndex === i
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{s.meal}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap tabular-nums shrink-0">{s.calories} kcal</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{s.protein}g protein · {s.reason}</p>
                    <p className={`text-xs mt-1.5 transition-colors ${addedIndex === i ? "text-emerald-500" : "text-gray-300 group-hover:text-gray-400"}`}>
                      {addedIndex === i ? "Added to planner ✓" : "Tap to add to planner →"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Log history */}
          {entries.length > 0 && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Logged Today</h3>
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-700 truncate">{e.summary}</span>
                  <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap shrink-0">
                    {e.calories} kcal · {e.protein}g
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
