import { redirect } from "next/navigation";
import { isAppError } from "@/lib/errors";
import { requireOwner } from "@/lib/auth/requireOwner";
import { getAdminCategoryGroups } from "@/lib/services/product.service";
import { AdminView } from "@/components/admin/AdminView";

export default async function AdminPage() {
  try {
    await requireOwner();
  } catch (err) {
    if (isAppError(err) && (err.httpStatus === 401 || err.httpStatus === 403)) {
      redirect("/login");
    }
    throw err;
  }

  const groups = await getAdminCategoryGroups();
  const categories = groups.map((g) => g.category);
  return <AdminView groups={groups} categories={categories} />;
}
