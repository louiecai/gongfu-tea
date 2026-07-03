export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notifySteepDone(teaName: string, steep: number): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(`${teaName} — steep ${steep} done`, {
      body: "Time to pour 🫖",
      icon: "/icon-192.png",
      tag: "gongfu-steep",
    });
  } catch {
    // Some platforms (Android) only allow notifications via the SW registration.
    void navigator.serviceWorker?.ready.then((reg) =>
      reg.showNotification(`${teaName} — steep ${steep} done`, {
        body: "Time to pour 🫖",
        icon: "/icon-192.png",
        tag: "gongfu-steep",
      }),
    );
  }
}

export function vibrate(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}
