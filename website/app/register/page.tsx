"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pricing");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070e24] flex items-center justify-center text-slate-300 text-sm">
      Redirecting to TimeLogic plans...
    </div>
  );
}
