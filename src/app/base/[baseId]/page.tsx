import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { BasePageShell } from "~/components/layout/BasePage/BasePageShell";

export default async function BasePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <BasePageShell />;
}