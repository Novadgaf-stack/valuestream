import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Check, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 hud-grid opacity-5" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between p-4 md:p-6 border-b border-primary/20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary animate-pulse" />
          <span className="text-lg tracking-[0.3em] text-primary text-glow">VALUESTREAM</span>
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md glass p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Smartphone size={40} className="text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl text-foreground mb-2">Install ValueStream</h1>
            <p className="text-muted-foreground text-sm">
              Get the full app experience on your device
            </p>
          </div>

          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-hud-price/20 border-2 border-hud-price flex items-center justify-center">
                <Check size={32} className="text-hud-price" />
              </div>
              <p className="text-hud-price">App is already installed!</p>
              <Link to="/scanner">
                <Button className="w-full bg-primary text-primary-foreground">
                  Open Scanner
                </Button>
              </Link>
            </div>
          ) : isIOS ? (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                To install on iOS, follow these steps:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border border-primary/20">
                  <div className="w-8 h-8 bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-sm">Tap the Share button</p>
                    <Share size={20} className="text-primary mt-2" />
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border border-primary/20">
                  <div className="w-8 h-8 bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-sm">Scroll and tap "Add to Home Screen"</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border border-primary/20">
                  <div className="w-8 h-8 bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-sm">Tap "Add" to install</p>
                  </div>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-6">
              <Button
                onClick={handleInstall}
                className="w-full bg-primary text-primary-foreground py-6 text-lg"
              >
                <Download size={20} className="mr-2" />
                Install App
              </Button>
              
              <div className="text-center text-xs text-muted-foreground space-y-2">
                <p>✓ Works offline</p>
                <p>✓ Fast loading</p>
                <p>✓ Full-screen experience</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                Use your browser's menu to install this app, or visit from a mobile device for the best experience.
              </p>
              
              <div className="text-center text-xs text-muted-foreground">
                <p>Chrome: Menu → Install App</p>
                <p>Edge: Menu → Apps → Install</p>
                <p>Firefox: Add to Home Screen</p>
              </div>

              <Link to="/scanner">
                <Button variant="outline" className="w-full border-primary/50 text-primary">
                  Continue in Browser
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Install;
