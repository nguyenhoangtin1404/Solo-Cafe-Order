import "server-only";

export interface BankTransferInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
  qr_image_url: string | null;
}

// Returns null and logs a warning if any required env var is missing.
export function getBankTransferInfo(): BankTransferInfo | null {
  const bankName = process.env.BANK_NAME;
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER;
  const accountName = process.env.BANK_ACCOUNT_NAME;

  if (!bankName || !accountNumber || !accountName) {
    console.warn(
      "[bank] Missing BANK_NAME, BANK_ACCOUNT_NUMBER, or BANK_ACCOUNT_NAME — bank_transfer_info will be null"
    );
    return null;
  }

  return {
    bank_name: bankName,
    account_number: accountNumber,
    account_name: accountName,
    qr_image_url: process.env.NEXT_PUBLIC_BANK_QR_IMAGE_URL ?? null,
  };
}
