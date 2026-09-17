import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-white flex">
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
            Almost
            <br />
            There.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Choose a new password to get back to the board.
          </p>
          <div className="flex gap-4 text-2xl opacity-30">♟♟♟♟♟♟♟♟</div>
        </div>
        <div className="relative z-10 text-xs text-gray-600 uppercase tracking-widest">
          ♜♞♝♛♚♝♞♜
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              <span>♔</span> Password Reset
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-wide">
              Reset Password
            </h1>
          </div>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
