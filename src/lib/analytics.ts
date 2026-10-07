// Thin wrapper over the GA4 tag loaded in index.html. Safe to call when the tag is blocked
// (ad blockers) or not loaded — it simply does nothing.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// GA4's recommended event for a submitted enquiry. `form` tells the forms apart in reports
// (shop onboarding vs seeker waitlist vs general contact vs school demo).
export const trackLead = (form: string) => {
  window.gtag?.('event', 'generate_lead', { form });
};
