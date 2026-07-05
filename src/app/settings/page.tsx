"use client";

import { useState } from "react";
import { useSettings } from "@/store/settings";
import { useProfiles } from "@/store/profiles";
import { useLog } from "@/store/log";
import { useStash } from "@/store/stash";
import { profilesRepo, logRepo, stashRepo, settingsRepo } from "@/lib/repo";
import { requestNotificationPermission } from "@/lib/alerts";
import { unlockAudio, playChime } from "@/lib/audio";
import {
  DEFAULT_SETTINGS,
  type BrewSession,
  type Settings,
  type StashItem,
  type TeaProfile,
} from "@/lib/types";
import { useT } from "@/store/useT";

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-7 w-12 rounded-full bg-line transition-colors peer-checked:bg-ink" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-surface shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const settings = useSettings();
  const custom = useProfiles((s) => s.custom);
  const { t } = useT();
  const [newVesselName, setNewVesselName] = useState("");
  const [newVesselMl, setNewVesselMl] = useState(100);

  const update = (patch: Partial<Settings>) =>
    useSettings.getState().update(patch);

  const addVessel = () => {
    if (!newVesselName.trim()) return;
    update({
      vesselProfiles: [
        ...settings.vesselProfiles,
        {
          id: `vessel-${Date.now().toString(36)}`,
          name: newVesselName.trim(),
          ml: newVesselMl,
        },
      ],
    });
    setNewVesselName("");
    setNewVesselMl(100);
  };

  const strengthLabel =
    settings.strength < 0.95
      ? t.lighter
      : settings.strength > 1.05
        ? t.stronger
        : t.asWritten;

  const exportAll = () => {
    const bundle = {
      schemaVersion: 1,
      profiles: custom,
      log: useLog.getState().sessions,
      stash: useStash.getState().items,
      settings,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gongfu-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = (file: File) => {
    void file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object") return;
        if (Array.isArray(parsed.profiles)) {
          profilesRepo.save(parsed.profiles as TeaProfile[]);
          useProfiles.getState().hydrate();
        }
        if (Array.isArray(parsed.log)) {
          logRepo.save(parsed.log as BrewSession[]);
          useLog.getState().hydrate();
        }
        if (Array.isArray(parsed.stash)) {
          stashRepo.save(parsed.stash as StashItem[]);
          useStash.getState().hydrate();
        }
        if (parsed.settings && typeof parsed.settings === "object") {
          settingsRepo.save({
            ...DEFAULT_SETTINGS,
            ...(parsed.settings as Partial<Settings>),
          });
          useSettings.getState().hydrate();
        }
      } catch {
        // ignore malformed files
      }
    });
  };

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {t.settingsEyebrow}
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium">
          {t.settingsTitle}
        </h1>
      </header>

      <section className="space-y-2.5">
        <h2 className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          {t.strengthSection}
        </h2>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">
              {t.strengthLabel(settings.strength.toFixed(2))}
            </span>
            <span className="text-xs text-muted">{strengthLabel}</span>
          </div>
          <input
            type="range"
            min={0.7}
            max={1.4}
            step={0.05}
            value={settings.strength}
            onChange={(e) => update({ strength: Number(e.target.value) })}
            aria-label="Steep strength multiplier"
            className="mt-3 w-full accent-current"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted">
            <span>{t.lighterEnd}</span>
            <button
              onClick={() => update({ strength: 1 })}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {t.reset}
            </button>
            <span>{t.strongerEnd}</span>
          </div>
        </div>

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          {t.alertsSection}
        </h2>
        <Toggle
          label={t.chime}
          hint={t.chimeHint}
          checked={settings.sound}
          onChange={(v) => {
            update({ sound: v });
            if (v) {
              unlockAudio();
              playChime(settings.chimeStyle);
            }
          }}
        />
        {settings.sound && (
          <div className="flex gap-2 pl-1">
            {(
              [
                ["bell", t.chimeStyleBell],
                ["wood", t.chimeStyleWood],
                ["bright", t.chimeStyleBright],
              ] as const
            ).map(([value, text]) => (
              <button
                key={value}
                onClick={() => {
                  update({ chimeStyle: value });
                  unlockAudio();
                  playChime(value);
                }}
                aria-pressed={settings.chimeStyle === value}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  settings.chimeStyle === value
                    ? "border-ink text-ink"
                    : "border-line text-muted hover:text-ink"
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        )}
        <Toggle
          label={t.notification}
          hint={t.notificationHint}
          checked={settings.notifications}
          onChange={(v) => {
            if (v) {
              void requestNotificationPermission().then((granted) =>
                update({ notifications: granted }),
              );
            } else {
              update({ notifications: false });
            }
          }}
        />
        <Toggle
          label={t.vibration}
          hint={t.vibrationHint}
          checked={settings.vibration}
          onChange={(v) => update({ vibration: v })}
        />

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          {t.brewingSection}
        </h2>
        <Toggle
          label={t.keepAwake}
          hint={t.keepAwakeHint}
          checked={settings.keepScreenOn}
          onChange={(v) => update({ keepScreenOn: v })}
        />

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          {t.vesselProfilesSection}
        </h2>
        <div className="space-y-2">
          {settings.vesselProfiles.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface p-3"
            >
              <span className="text-sm font-semibold">
                {v.name} · {v.ml} ml
              </span>
              <button
                onClick={() =>
                  update({
                    vesselProfiles: settings.vesselProfiles.filter(
                      (x) => x.id !== v.id,
                    ),
                  })
                }
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-red-700"
              >
                {t.remove}
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newVesselName}
              onChange={(e) => setNewVesselName(e.target.value)}
              placeholder={t.vesselNamePlaceholder}
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm placeholder:text-muted focus:border-muted focus:outline-none"
            />
            <input
              type="number"
              min={20}
              max={500}
              value={newVesselMl}
              onChange={(e) => setNewVesselMl(Number(e.target.value))}
              aria-label="ml"
              className="w-20 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm focus:border-muted focus:outline-none"
            />
            <button
              onClick={addVessel}
              disabled={!newVesselName.trim()}
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-bg disabled:opacity-40"
            >
              {t.addVessel}
            </button>
          </div>
        </div>

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          {t.appearanceSection}
        </h2>
        <div className="flex gap-2">
          {(
            [
              ["system", t.themeSystem],
              ["light", t.themeLight],
              ["dark", t.themeDark],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              onClick={() => update({ theme: value })}
              aria-pressed={settings.theme === value}
              className={`flex-1 rounded-2xl border p-3 text-sm font-semibold transition-colors ${
                settings.theme === value
                  ? "border-ink bg-surface"
                  : "border-line text-muted hover:border-muted"
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          {t.languageSection}
        </h2>
        <div className="flex gap-2">
          {(
            [
              ["en", "English"],
              ["zh", "中文"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              onClick={() => update({ language: value })}
              aria-pressed={settings.language === value}
              className={`flex-1 rounded-2xl border p-3 text-sm font-semibold transition-colors ${
                settings.language === value
                  ? "border-ink bg-surface"
                  : "border-line text-muted hover:border-muted"
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          {t.profilesSection}
        </h2>
        <p className="text-xs text-muted">{t.backupHint}</p>
        <div className="flex gap-2">
          <button
            onClick={exportAll}
            className="flex-1 rounded-2xl border border-line bg-surface p-3 text-sm font-semibold"
          >
            {t.exportJson}
          </button>
          <label className="flex-1 cursor-pointer rounded-2xl border border-line bg-surface p-3 text-center text-sm font-semibold">
            {t.importJson}
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importAll(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
