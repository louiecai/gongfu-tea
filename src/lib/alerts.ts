export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notifySteepDone(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const options = { body, icon: "/icon-192.png", tag: "gongfu-steep" };
  try {
    new Notification(title, options);
  } catch {
    // Some platforms (Android) only allow notifications via the SW registration.
    void navigator.serviceWorker?.ready.then((reg) =>
      reg.showNotification(title, options),
    );
  }
}

let progressNotification: Notification | null = null;

/** Periodic background progress ping — same tag, so it replaces in place. */
export function notifyProgress(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const options = { body, icon: "/icon-192.png", tag: "gongfu-progress" };
  try {
    progressNotification = new Notification(title, options);
  } catch {
    void navigator.serviceWorker?.ready.then((reg) =>
      reg.showNotification(title, options),
    );
  }
}

/** Clears the progress ping — call on regained focus, pause, or completion. */
export function closeProgressNotification(): void {
  progressNotification?.close();
  progressNotification = null;
  if (typeof navigator !== "undefined" && navigator.serviceWorker) {
    void navigator.serviceWorker.ready.then((reg) =>
      reg
        .getNotifications({ tag: "gongfu-progress" })
        .then((ns) => ns.forEach((n) => n.close())),
    );
  }
}

export function vibrate(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}
