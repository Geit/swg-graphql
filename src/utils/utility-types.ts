export function isPresent<T>(t: T | undefined | null | void): t is T {
  return t != null;
}

export function subsetOf<T>(array: Array<T>, superset: Array<T>) {
  return array.every(elem => superset.includes(elem));
}
