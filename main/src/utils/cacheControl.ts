export function cacheControl(ttl: number) {
  return `max-age=${ttl}, must-revalidate`;
}
