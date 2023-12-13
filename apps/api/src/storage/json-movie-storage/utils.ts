export function binsearchPrevious<T>(arr: [number, T][], x: number): number {
  let [l, r] = [0, arr.length-1];
  while (l <= r) {
    const mid = Math.floor((l+r)/2);
    if (x > arr[mid][0]) {
      l = mid + 1;
    } else {
      r = mid-1;
    }
  }
  return l-1 ;
}
export function binsearchNext<T>(arr: [number, T][], x: number): number {
  let [l, r] = [0, arr.length-1];
  while (l <= r) {
    const mid = Math.floor((l+r)/2);
    if (x < arr[mid][0]) {
      r = mid - 1;
    } else {
      l = mid + 1;
    }
  }
  return l
}