"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { findTea, useProfiles } from "@/store/profiles";
import { ProfileEditor } from "@/components/ProfileEditor";
import { useT } from "@/store/useT";

function NewProfilePageInner() {
  const cloneId = useSearchParams().get("clone") ?? "";
  const custom = useProfiles((s) => s.custom);
  const { t } = useT();
  const cloneFrom = cloneId ? findTea(cloneId, custom) : undefined;

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
      <ProfileEditor cloneFrom={cloneFrom} />
    </div>
  );
}

export default function NewProfilePage() {
  return (
    <Suspense fallback={null}>
      <NewProfilePageInner />
    </Suspense>
  );
}
