import { redirect } from "next/navigation";
import { isAppError } from "@/lib/errors";
import { requireOwner } from "@/lib/auth/requireOwner";
import { ReportsClient } from "@/components/reports/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  try {
    await requireOwner();
  } catch (err) {
    if (isAppError(err)) {
      if (err.httpStatus === 401) redirect("/login");
      if (err.httpStatus === 403) redirect("/dashboard");
    }
    throw err;
  }

  return <ReportsClient />;
}
