import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Zap, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Search,
  Wifi,
  FileText,
  Sparkles,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

const CinematicLanding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isInitializing, setIsInitializing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleInitialize = () => {
    setIsInitializing(true);
    // Cinematic delay
    setTimeout(() => {
      navigate(user ? "/scanner" : "/auth");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite",
          }}
        />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-cyan-400">MARKET</span>
            <span className="text-white">FORCE</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-slate-400 hover:text-white">
                  Dashboard
                </Button>
              </Link>
              <Button 
                onClick={handleInitialize}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
              >
                Launch Scanner
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400">
                Get Access
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-950 pt-20 px-6">
          <div className="flex flex-col gap-4">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-slate-400">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  onClick={() => { setMobileMenuOpen(false); handleInitialize(); }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  Launch Scanner
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500">
                  Get Access
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Tech badge */}
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-mono uppercase tracking-wider">Powered by Gemini 3 Pro</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-white">
              Omni-Modal
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Economic Reasoning
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
            Three AI agents debate in real-time to deliver the most accurate 
            market valuations ever seen. Watch the neural thought process unfold.
          </p>

          {/* CTA Button - Cinematic */}
          <div className="relative inline-block">
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className={cn(
                "relative group px-10 py-5 rounded-lg font-mono text-lg uppercase tracking-widest transition-all duration-500",
                isInitializing 
                  ? "bg-cyan-500/20 text-cyan-400" 
                  : "bg-transparent border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400"
              )}
            >
              {isInitializing ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  INITIALIZING NEURAL LINK...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Zap className="w-5 h-5" />
                  [ INITIALIZE NEURAL LINK ]
                </span>
              )}
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-lg bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </button>

            {/* Scan lines */}
            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none opacity-30">
              <div 
                className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                style={{ animation: "scanDown 2s linear infinite" }}
              />
            </div>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          {[
            {
              icon: TrendingDown,
              name: "AGENT ALPHA",
              role: "THE BEAR",
              desc: "Pessimistic appraiser using Fidelity Temporal Encoding to find damage",
              color: "from-red-500 to-red-600",
              borderColor: "border-red-500/30",
              textColor: "text-red-400",
            },
            {
              icon: TrendingUp,
              name: "AGENT BETA",
              role: "THE BULL",
              desc: "Market speculator using Global Grounding to find hidden value",
              color: "from-green-500 to-green-600",
              borderColor: "border-green-500/30",
              textColor: "text-green-400",
            },
            {
              icon: Scale,
              name: "AGENT GAMMA",
              role: "THE ARBITER",
              desc: "Synthesizer using Thought Signatures for consensus",
              color: "from-cyan-500 to-blue-500",
              borderColor: "border-cyan-500/30",
              textColor: "text-cyan-400",
            },
          ].map((agent, i) => (
            <div
              key={i}
              className={cn(
                "relative group p-6 rounded-xl border bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:scale-105",
                agent.borderColor
              )}
            >
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br", agent.color)}>
                <agent.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs font-mono text-slate-500 mb-1">{agent.name}</div>
              <div className={cn("text-xl font-bold mb-2", agent.textColor)}>{agent.role}</div>
              <p className="text-sm text-slate-400">{agent.desc}</p>
              
              {/* Hover glow */}
              <div className={cn(
                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl -z-10",
                `bg-gradient-to-br ${agent.color}`
              )} />
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Advanced Capabilities
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              State-of-the-art AI features designed for hackathon-winning performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: "Thinking Level: HIGH",
                desc: "Deep reasoning with extended chain-of-thought analysis",
              },
              {
                icon: Search,
                title: "Grounded Search",
                desc: "Real-time price lookup with 0.7 dynamic threshold",
              },
              {
                icon: Wifi,
                title: "Low Latency Mode",
                desc: "Toggle between Pro (deep) and Flash (fast) models",
              },
              {
                icon: FileText,
                title: "PDF Reports",
                desc: "Export multi-agent audit as professional documents",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-cyan-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="p-8 md:p-12 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to See AI Agents Debate Value?
            </h2>
            <p className="text-slate-400 mb-8">
              Experience the future of economic reasoning. Real-time. Multi-agent. Consensus-driven.
            </p>
            <Button
              onClick={handleInitialize}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-8"
            >
              Initialize Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="font-bold">
                <span className="text-cyan-400">MARKET</span>
                <span className="text-white">FORCE</span>
              </span>
            </div>
            <div className="text-sm text-slate-500 font-mono">
              GEMINI 3 PRO • MULTI-AGENT CONSENSUS • © 2024
            </div>
          </div>
        </div>
      </footer>

      {/* CSS animations */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes scanDown {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
};

export default CinematicLanding;
