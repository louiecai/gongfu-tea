"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProfiles } from "@/store/profiles";
import { ProfileEditor } from "@/components/ProfileEditor";
import { useT } from "@/store/useT";

function EditProfilePageInner() {
  const id = useSearchParams().get("id") ?? "";
  const custom = useProfiles((s) => s.custom);
  const hydrated = useProfiles((s) => s.hydrated);
  const { t } = useT();
  const tea = custom.find((x) => x.id === id);

  if (!hydrated) return null;
  if (!tea) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">{t.notOnShelf}</p>
        <Link
          href="/profiles"
          className="mt-3 inline-block font-semibold underline"
        >
          {t.backToShelf}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {t.editTeaEyebrow}
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium">{tea.name}</h1>
      </header>
      <ProfileEditor initial={tea} />
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={null}>
      <EditProfilePageInner />
    </Suspense>
  );
}
