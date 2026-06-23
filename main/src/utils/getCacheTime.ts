const SECONDS_IN_MINUTE = 60;

export function getCacheTime(minutes: number) {
  const now = new Date().getMinutes();
  const difference = minutes > now ? minutes - now : minutes;
  const differnceInSeconds = difference * SECONDS_IN_MINUTE;

  return differnceInSeconds;
}
