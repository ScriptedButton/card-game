"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { userSignOut } from "@/lib/actions";

export default function ServerSignOutButton() {
  return (
    <form className="flex justify-center" action={userSignOut}>
      <Button
        type="submit"
        variant="outline"
        className="flex items-center justify-center gap-2 bg-black/30 hover:bg-black/50 backdrop-blur text-white border border-white/20 transition-all duration-200 hover:border-white/40 shadow-sm hover:shadow-md"
        size="sm"
      >
        <LogOut size={14} className="text-white/80" />
        <span className="text-sm font-medium">Sign Out</span>
      </Button>
    </form>
  );
}
