"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export default function InstallButton({
  className = "",
  label = "Install app",
}: {
  className?: string;
  label?: string;
}) {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (standalone) setInstalled(true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function click() {
    if (evt) {
      await evt.prompt();
      await evt.userChoice;
      setEvt(null);
    } else {
      setHelp(true);
    }
  }

  return (
    <>
      <button onClick={click} className={className}>
        <Download size={20} /> {label}
      </button>

      {help && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-[28px] bg-white p-6 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold">Install DIFFT</h3>
              <button onClick={() => setHelp(false)} aria-label="Close">
                <X size={24} />
              </button>
            </div>
            {ios ? (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-lg">
                <li>Open this page in <b>Safari</b>.</li>
                <li>Tap the <b>Share</b> button.</li>
                <li>Choose <b>Add to Home Screen</b>.</li>
              </ol>
            ) : (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-lg">
                <li>Open this page in <b>Chrome</b> (not inside WhatsApp or Facebook).</li>
                <li>Tap the <b>⋮</b> menu at the top right.</li>
                <li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
