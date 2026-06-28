import * as authRepo from "@/lib/repositories/auth.repository";

export async function signIn(email: string, password: string): Promise<void> {
  await authRepo.signIn(email, password);
}

export async function signOut(): Promise<void> {
  await authRepo.signOut();
}
