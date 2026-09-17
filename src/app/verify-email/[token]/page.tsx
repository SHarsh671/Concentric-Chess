import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmail(token);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-sm text-center space-y-4">
        {result.success ? (
          <>
            <CheckCircle2 className="mx-auto size-12" />
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Email Verified
            </h1>
            <p className="text-gray-500">
              Your email has been verified. You can now play online and send
              invites.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-12" />
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Verification Failed
            </h1>
            <p className="text-gray-500">{result.message}</p>
          </>
        )}
        <Button asChild className="w-full">
          <Link href={result.success ? "/play" : "/settings"}>
            {result.success ? "Start Playing" : "Go to Settings"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
