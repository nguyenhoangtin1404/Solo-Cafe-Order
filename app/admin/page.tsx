import { redirect } from "next/navigation";
import { isAppError } from "@/lib/errors";
import { requireOwner } from "@/lib/auth/requireOwner";
import { getAdminCategoryGroups } from "@/lib/services/product.service";
import { getAdminCategories } from "@/lib/services/category.service";
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

  const [groups, categories] = await Promise.all([
    getAdminCategoryGroups(),
    getAdminCategories(),
  ]);
  return <AdminView groups={groups} categories={categories} />;
}
