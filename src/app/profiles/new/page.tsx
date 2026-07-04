"use client";

import { ProfileEditor } from "@/components/ProfileEditor";
import { useT } from "@/store/useT";

export default function NewProfilePage() {
  const { t } = useT();
  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {t.newTeaEyebrow}
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium">
          {t.newTeaTitle}
        </h1>
      </header>
      <ProfileEditor />
    </div>
  );
}
