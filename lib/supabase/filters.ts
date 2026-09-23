// PostgREST's `.or()` filter syntax treats `,`, `(` and `)` as structural
// characters (clause separators / grouping). A raw user search term
// containing any of them would break or hijack the filter, so escape them
// with a backslash before interpolating into an `.or()` filter string.
export function escapeOrFilterValue(value: string): string {
  return value.replace(/[,()\\]/g, (char) => `\\${char}`);
}
