"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function SidebarCloseOnNavigate() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return null;
}
