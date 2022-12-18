// used to animate ripple effect when satellite changes position
export function createLinearHalfHiddenFn() {
  let dir = true;
  return (from: number, to: number, fraction: number) => {
    if (fraction > 0.99 && dir) {
      dir = false;
    }
    if (fraction < 0.01 && !dir) {
      dir = true;
    }
    return dir ? fraction * to : 0;
  };
}
