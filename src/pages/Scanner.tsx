import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import WebcamView from "@/components/WebcamView";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Initializing scanner...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <WebcamView />;
};

export default Scanner;
