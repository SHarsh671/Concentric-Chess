// signup/page.tsx
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 bg-black text-white flex-col justify-between p-12 border-r-8 border-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 text-[200px] leading-none select-none font-bold flex flex-wrap gap-0 overflow-hidden">
          ♜♞♝♛♚♝♞♜♟♟♟♟♟♟♟♟
        </div>
        <div className="relative z-10">
          <div className="text-4xl font-bold">♔</div>
          <div className="mt-2 font-bold uppercase tracking-widest text-sm text-gray-400">
            Circular Chess
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-5xl font-bold uppercase leading-tight">
            Join the
            <br />
            Board.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Create your account and start playing circular chess online
            instantly.
          </p>
          <div className="flex gap-4 text-2xl opacity-30">♟♟♟♟♟♟♟♟</div>
        </div>
        <div className="relative z-10 text-xs text-gray-600 uppercase tracking-widest">
          ♜♞♝♛♚♝♞♜
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              <span>♟</span> New Account
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-wide">
              Sign Up
            </h1>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
