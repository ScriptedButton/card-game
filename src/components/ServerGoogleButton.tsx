"use client";

import { Button } from "@/components/ui/button";
import { googleSignIn } from "@/lib/actions";

export default function ServerGoogleButton() {
  return (
    <form className="w-full flex justify-center" action={googleSignIn}>
      <Button
        type="submit"
        className="premium-button relative overflow-hidden bg-white hover:bg-gray-50 text-gray-700 font-medium px-8 py-6 text-lg flex items-center justify-center gap-3 shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl w-full sm:w-auto"
      >
        <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500"></div>
        <div className="relative z-10 flex items-center justify-center w-6 h-6 bg-white rounded-full overflow-hidden">
          <div className="relative w-full h-full flex justify-center items-center">
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-500"></div>
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-green-500"></div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-yellow-500"></div>
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-white rounded-full z-10"></div>
          </div>
        </div>
        <span className="relative z-10">Sign in with Google</span>
      </Button>
    </form>
  );
}
