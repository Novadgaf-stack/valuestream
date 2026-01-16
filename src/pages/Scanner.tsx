import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import HiveMindScanner from "@/components/HiveMindScanner";

const Scanner = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse font-mono">INITIALIZING NEURAL LINK...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <HiveMindScanner />;
};

export default Scanner;
