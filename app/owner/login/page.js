// app/owner/login/page.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/shop-access");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4 py-20">
      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      <span className="text-sm font-semibold text-mutedGrey">Redirecting to Operator Portal...</span>
    </div>
  );
}
