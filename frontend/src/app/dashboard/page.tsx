"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function DashboardRedirector() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (user.role === "MANAGER") {
        router.push("/manager/dashboard");
      } else {
        router.push("/employee/dashboard");
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <DashboardRedirector />
    </ProtectedRoute>
  );
}
