const getTabs = (n) => (n ? new Array(n).fill("\t").join("") : "");

const getAbs = (s) => `Math.Abs(${s.split("").splice(1, s.length - 2)})`;

export { getTabs, getAbs };
