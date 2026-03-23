import { getSession } from "@/lib/auth";
import PlayInner from "./inner";

export default async function PlayPage() {
  const session = await getSession();
  return <PlayInner isAuthenticated={!!session} />;
}
