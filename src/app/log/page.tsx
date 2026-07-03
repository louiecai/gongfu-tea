"use client";

import { useState } from "react";
import Link from "next/link";
import { useLog } from "@/store/log";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LogPage() {
  const sessions = useLog((s) => s.sessions);
  const hydrated = useLog((s) => s.hydrated);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);

  const startEdit = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    setEditingId(id);
    setNote(s?.note ?? "");
    setRating(s?.rating ?? 0);
  };

  const saveEdit = () => {
    if (editingId) {
      useLog.getState().update(editingId, {
        note: note.trim() || undefined,
        rating: rating || undefined,
      });
    }
    setEditingId(null);
  };

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          记 · brew log
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium">
          Sessions past
        </h1>
      </header>

      {hydrated && sessions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-sm text-muted">
            No brews yet. Your sessions land here automatically — with room
            for a rating and a tasting note.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-bg"
          >
            Pick a tea
          </Link>
        </div>
      )}

      <ul className="space-y-2.5">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: s.liquorColor }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-[15px] font-medium">
                  {s.teaName}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(s.startedAt)} · {s.steepsCompleted}/
                  {s.totalSteeps} steeps
                  {s.gramsUsed ? ` · ${s.gramsUsed} g` : ""}
                </p>
              </div>
              {s.rating ? (
                <span className="shrink-0 text-sm" aria-label={`${s.rating} stars`}>
                  {"★".repeat(s.rating)}
                  <span className="opacity-25">
                    {"★".repeat(5 - s.rating)}
                  </span>
                </span>
              ) : null}
              <button
                onClick={() =>
                  editingId === s.id ? setEditingId(null) : startEdit(s.id)
                }
                className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
              >
                {editingId === s.id ? "Close" : s.note ? "Edit note" : "Add note"}
              </button>
            </div>

            {s.note && editingId !== s.id && (
              <p className="mt-2.5 border-l-2 pl-3 text-sm text-muted" style={{ borderColor: s.liquorColor }}>
                {s.note}
              </p>
            )}

            {editingId === s.id && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-1.5" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      role="radio"
                      aria-checked={rating === n}
                      onClick={() => setRating(n)}
                      className={`text-xl ${n <= rating ? "" : "opacity-25 grayscale"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Tasting note…"
                  className="w-full rounded-xl border border-line bg-bg p-3 text-sm placeholder:text-muted focus:border-muted focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-bg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      useLog.getState().remove(s.id);
                      setEditingId(null);
                    }}
                    className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-red-700"
                  >
                    Delete session
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
