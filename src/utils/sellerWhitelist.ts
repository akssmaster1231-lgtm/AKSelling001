/**
 * Strict Email Whitelist for AKSelling Seller Registration & KYC Onboarding.
 * ONLY anojkumaryadav7290@gmail.com is authorized to register as a seller and submit KYC.
 */

export const WHITELISTED_SELLER_EMAIL = 'anojkumaryadav7290@gmail.com';
export const OWNER_ADMIN_EMAIL = 'anojkumaryadav7290@gmail.com';
export const OFFICIAL_SUPPORT_EMAIL = 'support.akselling@gmail.com';

/**
 * Checks if the given email strictly matches the verified owner admin email.
 */
export function isVerifiedOwnerAdmin(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Checks if the given email strictly matches the whitelisted seller admin email.
 */
export function isWhitelistedSellerEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === WHITELISTED_SELLER_EMAIL.toLowerCase();
}

export const SELLER_LOCKED_MESSAGES = {
  title: 'Public Seller Registrations Temporarily Locked',
  heading: 'Seller Onboarding Restricted',
  description:
    'Merchant registration and real KYC document submission are currently restricted to pre-authorized merchant partners. Public seller registrations are temporarily locked.',
  contactNotice:
    'If you are an authorized supplier partner or need onboarding assistance, please reach out to our vendor desk at support.akselling@gmail.com.',
  unauthorizedNotice: (currentEmail?: string) =>
    currentEmail
      ? `The signed-in account (${currentEmail}) is not authorized for merchant onboarding.`
      : 'Please sign in with your authorized seller account (anojkumaryadav7290@gmail.com) to proceed.',
};
