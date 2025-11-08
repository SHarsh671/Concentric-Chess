import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Inner from "./inner";

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return <Inner />;
}
