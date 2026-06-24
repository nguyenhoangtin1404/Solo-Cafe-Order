import * as authRepo from "@/lib/repositories/auth.repository";

export async function signOut(): Promise<void> {
  await authRepo.signOut();
}
