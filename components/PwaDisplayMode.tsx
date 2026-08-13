"use client";

import { useEffect, useState } from "react";

const GUIDE_KEY = "pitch-one-pwa-guide-dismissed";

function isTouchMobile() {
  return window.matchMedia("(max-width: 900px) and (pointer: coarse)").matches;
}

export function PwaDisplayMode() {
  const [mobile, setMobile] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [guideDismissed, setGuideDismissed] = useState(true);

  useEffect(() => {
    const update = () => {
      const touch = isTouchMobile();
      setMobile(touch);
      setPortrait(touch && window.innerHeight > window.innerWidth);
      setStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    };
    update();
    setGuideDismissed(window.localStorage.getItem(GUIDE_KEY) === "1");
    const media = window.matchMedia("(display-mode: standalone)");
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
    window.addEventListener("fullscreenchange", update, { passive: true });
    media.addEventListener?.("change", update);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.visualViewport?.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("fullscreenchange", update);
      media.removeEventListener?.("change", update);
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  const makeImmersive = async () => {
    // These APIs require a user gesture and are intentionally best-effort.
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
      }
    } catch {
      // Safari and embedded browsers may reject fullscreen; gameplay still continues.
    }
    try {
      await (screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> }).lock?.("landscape");
    } catch {
      // iOS Safari does not expose orientation.lock in a normal tab.
    }
  };

  const install = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } finally {
      setInstallEvent(null);
    }
  };

  if (!mobile) return null;
  const showGuide = !standalone && !guideDismissed;
  return (
    <>
      {portrait && (
        <div className="pwa-rotate-overlay" role="dialog" aria-live="polite">
          <div className="pwa-rotate-card">
            <div className="pwa-rotate-icon" aria-hidden="true">↔</div>
            <h2>端末を横向きにしてください</h2>
            <p>PITCH / ONEはスマートフォン横画面に最適化されています。</p>
            <button type="button" onClick={makeImmersive}>横画面でプレイ</button>
          </div>
        </div>
      )}
      {!portrait && (showGuide || installEvent) && (
        <div className="pwa-install-banner" aria-live="polite">
          <div>
            <span>{showGuide ? "ホーム画面に追加するとアプリとして起動できます" : "PITCH / ONEをインストール"}</span>
            <button type="button" onClick={installEvent ? install : makeImmersive}>{installEvent ? "追加" : "横画面・全画面"}</button>
            {showGuide && <button type="button" className="pwa-dismiss" onClick={() => { window.localStorage.setItem(GUIDE_KEY, "1"); setGuideDismissed(true); }}>閉じる</button>}
          </div>
        </div>
      )}
    </>
  );
}
