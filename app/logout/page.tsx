"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("userId");
    router.push("/login");
  }, []);

  return <p>Logging out...</p>;
}
