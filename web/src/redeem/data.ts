/**
 * Resolve a short redeem code to the text shown to the user.
 *
 * This is the temporary stand-in for the database lookup. Keeping the lookup
 * behind this function lets the page stay unchanged when a real data source is
 * connected later.
 */
export function lookupRedeemCode(code: string): string {
  return [...code].reverse().join("");
}
