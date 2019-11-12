module.exports = (moovT) => {
  const entries = moovT.split(',');
  return entries.reduce((acc, entry) => {
    const vals = entry.split('=');
    if (vals.length > 1) {
      acc[vals[0]] = isNaN(vals[1]) ? vals[1] : Number(vals[1]);
    }
    return acc;
  }, {})
};
