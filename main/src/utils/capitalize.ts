export function capitalize(value: string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 1).toUpperCase().concat(value.slice(1));
}
