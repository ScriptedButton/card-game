import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";

export default function GuestPlayButton() {
  return (
    <div className="w-full flex justify-center">
      <Link href="/game?guest=true" className="w-full sm:w-auto">
        <Button className="premium-button relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium px-8 py-6 text-lg flex items-center justify-center gap-3 shadow-lg transition-all duration-200 hover:shadow-xl w-full sm:w-auto">
          <div className="absolute inset-0 opacity-10 bg-pattern"></div>
          <div className="relative z-10 flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
            <User size={16} className="text-white" />
          </div>
          <span className="relative z-10">Play as Guest</span>
        </Button>
      </Link>
    </div>
  );
}
