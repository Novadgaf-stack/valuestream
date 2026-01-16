import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, Camera, Sparkles, Shield, Users, ArrowRight } from "lucide-react";
import { useState } from "react";

const Landing = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 hud-grid opacity-50" />
      
      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">ValueStream</span>
        </div>
        
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Link to="/scanner">
                <Button className="bg-primary text-primary-foreground">
                  Open Scanner
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-foreground p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background pt-20 px-6 animate-fade-in">
          <div className="flex flex-col gap-4">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/scanner" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary text-primary-foreground">
                    Open Scanner
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            <Link to="/install" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Install App
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-24 pb-16 md:pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 md:mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Valuation</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Know the Value of{" "}
            <span className="text-primary">Everything</span>{" "}
            Around You
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto">
            Point your camera at any item and get instant market valuations. 
            Perfect for estate sales, garage finds, or just curious minds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={user ? "/scanner" : "/auth"} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-6 text-lg shadow-lg box-glow">
                Start Scanning
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6">
                See How It Works
              </Button>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16 md:mt-24 max-w-2xl mx-auto">
          {[
            { value: "2.4M+", label: "Items Scanned" },
            { value: "$847M", label: "Total Valued" },
            { value: "<1s", label: "Analysis Time" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-card border border-border">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-16 md:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to discover the value of any item
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: "1",
                title: "Point Your Camera",
                desc: "Open the scanner and aim at any item you want to value. Works with furniture, electronics, collectibles, and more.",
                icon: Camera
              },
              {
                step: "2",
                title: "AI Analyzes",
                desc: "Our vision AI identifies the item, checks market data, and calculates the current resale value instantly.",
                icon: Sparkles
              },
              {
                step: "3",
                title: "Get Your Price",
                desc: "See the estimated value displayed right on screen. Save items to build a complete inventory.",
                icon: Shield
              }
            ].map((item, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-primary/50 transition-all group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-sm text-primary font-medium mb-2">Step {item.step}</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to catalog and value your items
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {[
              {
                title: "Voice Announcements",
                desc: "Hear prices spoken aloud as you scan. Choose from male, female, or digital assistant voices.",
              },
              {
                title: "Session Recording",
                desc: "Every scan is automatically saved. Review past sessions and track value changes over time.",
              },
              {
                title: "Evidence Snapshots",
                desc: "Automatic photo capture of each detected item with confidence scores and market comparisons.",
              },
              {
                title: "Real-Time Collaboration",
                desc: "Invite others to join your scanning session. Perfect for team inventories or estate evaluations.",
              },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border hover:border-primary/30 transition-all">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 md:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Discover Hidden Value?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Start scanning for free. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? "/scanner" : "/auth"}>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 py-6 text-lg">
                {user ? "Open Scanner" : "Create Free Account"}
              </Button>
            </Link>
            <Link to="/install">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Install App
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Camera className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">ValueStream</span>
            </div>
            <div className="text-sm text-muted-foreground">
              AI-Powered Item Valuation • © 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
