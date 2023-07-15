export const calcZScore = (mean: number, stdDev: number, value: number) => {
  return (value - mean) / stdDev;
};

export const getZPercentile = (z: number) => {
  // If z is greater than 6.5 standard deviations from the mean
  // the number of significant digits will be outside of a reasonable
  // range.
  if (z < -6.5) return 0.0;
  if (z > 6.5) return 1.0;

  let factK = 1;
  let sum = 0;
  let term = 1;
  let k = 0;
  const loopStop = Math.exp(-23);

  while (Math.abs(term) > loopStop) {
    term =
      (((0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) / (2 * k + 1) / Math.pow(2, k)) * Math.pow(z, k + 1)) / factK;
    sum += term;
    k += 1;
    factK *= k;
  }

  sum += 0.5;

  return sum;
};
