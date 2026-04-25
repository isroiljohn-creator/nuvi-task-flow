import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/profile")({
  component: () => {
    const { user } = useAuth();
    if (!user) return null;
    return <Link to="/employees/$userId" params={{ userId: user.id }} replace />;
  },
});
