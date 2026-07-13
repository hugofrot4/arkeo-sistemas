import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

function RequireAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ok" | "invalid">("checking");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? "ok" : "invalid");
    });
  }, []);

  if (status === "checking") return null;
  if (status === "invalid") return <Navigate to="/login" replace />;
  return children;
}

export default RequireAuth;
