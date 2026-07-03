"use client";

import { ProfileEditor } from "@/components/ProfileEditor";

export default function NewProfilePage() {
  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          New tea
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium">
          Add to your shelf
        </h1>
      </header>
      <ProfileEditor />
    </div>
  );
}
