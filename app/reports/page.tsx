import { redirect } from "next/navigation";
import { isAppError } from "@/lib/errors";
import { requireOwner } from "@/lib/auth/requireOwner";
import { ReportsClient } from "@/components/reports/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  try {
    await requireOwner();
  } catch (err) {
    if (isAppError(err) && (err.httpStatus === 401 || err.httpStatus === 403)) {
      redirect("/login");
    }
    throw err;
  }

  return <ReportsClient />;
}
