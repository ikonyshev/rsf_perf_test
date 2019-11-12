module.exports = (metrics, calcLongest = []) => {
  const avg = {};
  const longest = {};

  calcLongest.forEach((metric) => longest[metric] = { value: 0 });

  if (metrics.length > 0) {
    metrics.forEach((entry) => {
      Object.entries(entry).forEach(([key, val]) => {
        if (!isNaN(val)) {
          if (avg[key] === undefined) {
            avg[key] = 0;
          }

          avg[key] += val;

          if (longest[key] && val > longest[key].value) {
            longest[key].value = val;
            longest[key].metrics = entry;
          }
        }
      });
    });

    Object.entries(avg).forEach(([key, value]) => {
      avg[key] = (value / metrics.length).toFixed();
    })
  }

  return { avg, longest };
};
