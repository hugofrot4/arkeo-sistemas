import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { clearToken, getMe, getToken } from "../../lib/api";

function RequireAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ok" | "invalid">(
    getToken() ? "checking" : "invalid",
  );

  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then(() => setStatus("ok"))
      .catch(() => {
        clearToken();
        setStatus("invalid");
      });
  }, []);

  if (status === "checking") return null;
  if (status === "invalid") return <Navigate to="/login" replace />;
  return children;
}

export default RequireAuth;
