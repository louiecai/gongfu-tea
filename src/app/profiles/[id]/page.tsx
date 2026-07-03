"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useProfiles } from "@/store/profiles";
import { ProfileEditor } from "@/components/ProfileEditor";

export default function EditProfilePage() {
  const { id } = useParams<{ id: string }>();
  const custom = useProfiles((s) => s.custom);
  const hydrated = useProfiles((s) => s.hydrated);
  const tea = custom.find((t) => t.id === id);

  if (!hydrated) return null;
  if (!tea) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">This tea isn’t on your shelf.</p>
        <Link
          href="/profiles"
          className="mt-3 inline-block font-semibold underline"
        >
          Back to your teas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Edit tea
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium">{tea.name}</h1>
      </header>
      <ProfileEditor initial={tea} />
    </div>
  );
}
