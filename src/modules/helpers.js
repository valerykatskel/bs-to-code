const getTabs = (n) => (n ? new Array(n).fill("\t").join("") : "");

const getAbs = (s) => `Math.Abs(${s.split("").splice(1, s.length - 2)})`;

const updateSign = (parts, sign) => {
  if (parts.length > 1) {
    if (parts[1].indexOf("&&") > -1) {
      let pAND = parts[1].split(" &&");

      if (pAND.length === 1) {
        return `${parts[0]}.ApproxCompare(${parts[1]})${sign}0`;
      } else if (pAND.length > 1) {
        return `${parts[0]}.ApproxCompare(${pAND[0]})${sign}0 &&`;
      }
    } else if (parts[1].indexOf("||") > -1) {
      let pOR = parts[1].split(" ||");

      if (pOR.length === 1) {
        return `${parts[0]}.ApproxCompare(${parts[1]})${sign}0`;
      } else if (pOR.length > 1) {
        return `${parts[0]}.ApproxCompare(${pOR[0]})${sign}0 ||`;
      }
    } else {
      return `${parts[0]}.ApproxCompare(${parts[1]})${sign}0`;
    }
  }
};

export { getTabs, getAbs, updateSign };
