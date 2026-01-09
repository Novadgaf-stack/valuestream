import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 hud-grid opacity-10" />
      <div className="absolute inset-0 scanlines opacity-10" />
      
      {/* Animated scan line */}
      <div 
        className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-primary to-transparent opacity-30 animate-scan"
        style={{ boxShadow: '0 0 50px 20px hsl(var(--primary) / 0.3)' }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary animate-pulse" />
          <span className="text-lg tracking-[0.3em] text-primary text-glow">VALUESTREAM</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary">
                  Dashboard
                </Button>
              </Link>
              <Link to="/scanner">
                <Button className="bg-primary text-primary-foreground tracking-wider">
                  LAUNCH SCANNER
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary text-primary-foreground tracking-wider">
                  GET ACCESS
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 mb-8">
            <div className="w-2 h-2 bg-hud-price rounded-full animate-pulse" />
            <span className="text-xs tracking-widest text-muted-foreground">POWERED BY GEMINI 3 VISION AI</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-mono text-foreground mb-6 leading-tight">
            SEE THE{" "}
            <span className="text-primary text-glow-intense">VALUE</span>
            <br />
            IN EVERYTHING
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Point your camera at anything. Get instant second-hand market valuations. 
            Know exactly what your reality is worth—in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={user ? "/scanner" : "/auth"}>
              <Button size="lg" className="bg-primary text-primary-foreground px-12 py-6 text-lg tracking-wider box-glow">
                START SCANNING
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 px-8 py-6">
                HOW IT WORKS
              </Button>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-24 max-w-3xl mx-auto">
          {[
            { value: "2.4M+", label: "Objects Valued" },
            { value: "$847M", label: "Total Value Scanned" },
            { value: "0.3s", label: "Avg. Analysis Time" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl text-primary text-glow font-mono mb-2">
                {stat.value}
              </div>
              <div className="text-xs tracking-wider text-muted-foreground uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-24 border-t border-primary/20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl text-center text-foreground mb-4">
            HOW <span className="text-primary text-glow">VALUESTREAM</span> WORKS
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Military-grade object detection meets instant market analysis
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "POINT YOUR CAMERA",
                desc: "Aim at any room, object, or scene. Our AI captures frames every 2 seconds for continuous monitoring.",
                icon: "📷"
              },
              {
                step: "02",
                title: "AI IDENTIFIES & VALUES",
                desc: "Gemini 3 Vision detects every object, cross-references market data, and estimates current second-hand value.",
                icon: "🤖"
              },
              {
                step: "03",
                title: "REAL-TIME HUD DISPLAY",
                desc: "Watch values appear as bounding boxes overlay your camera feed. Total scene value updates live.",
                icon: "📊"
              }
            ].map((item, i) => (
              <div key={i} className="glass p-8 relative group hover:border-primary/50 transition-all">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs text-primary tracking-widest mb-2">STEP {item.step}</div>
                <h3 className="text-xl text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
                
                {/* Corner decoration */}
                <div className="absolute top-0 right-0 w-6 h-6 border-r border-t border-primary/30 group-hover:border-primary transition-colors" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l border-b border-primary/30 group-hover:border-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl text-center text-foreground mb-16">
            PRECISION <span className="text-primary text-glow">FEATURES</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Session Recording",
                desc: "Every scan is saved. Replay your audits, track value changes over time, export detailed reports.",
              },
              {
                title: "Evidence Snapshots",
                desc: "Automatic cropping of detected objects with confidence trends and price comparisons.",
              },
              {
                title: "Damage Detection",
                desc: "AI identifies wear, cracks, and defects—automatically adjusting valuations accordingly.",
              },
              {
                title: "Adaptive Analysis",
                desc: "Smart backoff prevents API overload. The system self-regulates for optimal performance.",
              },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-6 border border-primary/20 hover:border-primary/50 transition-all">
                <div className="w-8 h-8 border border-primary flex items-center justify-center text-primary text-sm">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-lg text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 border-t border-primary/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl text-foreground mb-6">
            READY TO <span className="text-primary text-glow-intense">AUDIT REALITY</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who know exactly what everything around them is worth.
          </p>
          <Link to={user ? "/scanner" : "/auth"}>
            <Button size="lg" className="bg-primary text-primary-foreground px-16 py-6 text-lg tracking-wider box-glow">
              {user ? "LAUNCH SCANNER" : "CREATE FREE ACCOUNT"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary" />
              <span className="text-sm tracking-widest text-muted-foreground">VALUESTREAM v1.0</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Powered by Gemini 3 Vision • Real-Time Analysis • © 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
