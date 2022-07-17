import { getTabs, updateSign } from "./helpers";
import { codeFormatted, appCode } from "./elements";
let bracketsCountError = false;
const copy = require("clipboard-copy");

const transformCode = (code) => {
  codeFormatted.classList = [];
  appCode.classList = [];
  appCode.classList.add("app-code");
  let tabLevel = 0;
  bracketsCountError = false;
  let formattedValue = "";
  let resultString = "";

  let reRemoveSpaces = /[\s?]/g;
  let reValueProcess = /\$/g;

  formattedValue = code
    .replace(reRemoveSpaces, "") // удалим лишние пробелы
    .replace(
      /(o|c|h|l|p|p_value|d|d_value|td_value|vh|vl|vh_value|vl_value|d_vh|d_vl|d_high|d_low|v|hbody|body|lbody|dp|dvh|dvl|dp_value|dvh_value|dvl_value|amx|bmx|amx_value|bmx_value)(\d?)==(o|c|h|l|p|p_value|d|d_value|td_value|vh|vl|vh_value|vl_value|d_vh|d_vl|d_high|d_low|v|hbody|body|lbody|dp|dvh|dvl|dp_value|dvh_value|dvl_value|amx|bmx|amx_value|bmx_value)(\d?)(\+-)(\d?)t/gm,
      "$1$2<=$3$4+$6t&&$1$2>=$3$4-$6t"
    )
    .replace(/(-|\+)(\d{1,2})(t)/g, " $1 $2*TickSize"); // окультурим добавление тиков

  for (let i = 0; i < formattedValue.length; i++) {
    if (formattedValue[i] === "&") {
      if (formattedValue[i - 1] === "&") {
        resultString += formattedValue[i] + "\n" + getTabs(tabLevel);
      } else {
        resultString += " " + formattedValue[i];
      }
    } else if (formattedValue[i] === "|") {
      debugger;
      if (formattedValue[i - 1] === "|") {
        if (formattedValue[i - 2] !== "|") {
          if (formattedValue[i + 1] !== "|") {
            // защита от форматирования модуля
            resultString += formattedValue[i] + "\n" + getTabs(tabLevel);
          } else resultString += formattedValue[i];
        } else {
          if (formattedValue[i + 1] === "|") {
            resultString += formattedValue[i];
          } else resultString += formattedValue[i] + "\n" + getTabs(tabLevel);
        }
      } else if (
        formattedValue[i + 1] === "|" &&
        formattedValue[i + 2] !== "|"
      ) {
        resultString += " " + formattedValue[i];
      } else resultString += formattedValue[i];
    } else if (formattedValue[i] === "(") {
      resultString += formattedValue[i];
      tabLevel++;
      resultString += "\n" + getTabs(tabLevel);
    } else if (formattedValue[i] === ")") {
      tabLevel--;
      tabLevel = tabLevel < 0 ? 0 : tabLevel;
      resultString += "\n" + getTabs(tabLevel) + formattedValue[i];
    } else {
      resultString += formattedValue[i];
    }
  }

  resultString = resultString
    .replace(/\|((d|td|p|vh|vl)(\d+\$))\|/g, "Math.Abs($1)")
    .replace(/\|(.+[-+].+)\|/g, "Math.Abs($1)")
    .replace(/(\))(\|\|)/g, "$1 $2");

  resultString = resultString
    .replace(
      /(start_r|stop_r|start_l|stop_l|start_b|stop_b|start_m|stop_m)/g,
      "getBarByIndex(i$1)"
    )
    .replace(
      /(dvh|dvl|dp|imb|lbody|body|hbody|vh|vl|amx|bmx|v|o|c|h|l|p|d){1}(\d{1,2}){1,2}/g,
      "$1[$2]"
    )
    .replace(/(p|d){1}{(vh|vl|high|low){1}}(_){1}(\d{1,2}){1,2}/g, "$1_$2[$4]")
    .replace(/(p|d){1}{(vh|vl|h|l){1}}(_r|_l|_b){1}/g, "$1_$2$3")
    .replace(/(<(?=[^=])|>(?=[^=])|<=|>=|==|!=)/g, " $1 ")
    .replace(/(\[\d{1,2}\])(\$)/g, "_value$1")
    .replace(reValueProcess, "_value");
  //.replace(/\|([^|)(\s]+)\|/g, "Math.Abs($1)");

  resultString = resultString.replace(
    /Abs\((.+)(-|\+)(.+)\)/gm,
    "Abs(Instrument.MasterInstrument.RoundToTickSize($1$2$3))"
  );

  resultString = resultString
    .split("\n")
    .map((el) => {
      if (el.indexOf(" > ") > -1) {
        return updateSign(el.split(" > "), " > ");
      } else if (el.indexOf(" >= ") > -1) {
        return updateSign(el.split(" >= "), " >= ");
      } else if (el.indexOf(" < ") > -1) {
        return updateSign(el.split(" < "), " < ");
      } else if (el.indexOf(" <= ") > -1) {
        return updateSign(el.split(" <= "), " <= ");
      } else if (el.indexOf(" != ") > -1) {
        return updateSign(el.split(" != "), " != ");
      } else if (el.indexOf(" == ") > -1) {
        return updateSign(el.split(" == "), " == ");
      }
      return el;
    })
    .join("\n");

  resultString = resultString
    .replace(
      // исправим неправильную корректировку описание объема вместо v_value на v
      /v_value/g,
      "v"
    )
    .replace(
      /\(([^)<>=\nn]+?)(-|\+){1}([^)]+?)(TickSize){1}\)/g,
      "(Instrument.MasterInstrument.RoundToTickSize($1$2$3$4))"
    ) // округление до тика
    .replace(/ApproxCompare\((\d{1,2})(t)\)/g, "ApproxCompare($1*TickSize)")
    .replace(/([^\s])([+|-]{1})([^\s])/g, "$1 $2 $3");

  // контроль наличия номер бара в названии переменной, где номер бара обязательный
  let barIndexMissingForAMX = resultString.match(/amx\./g)?.length;
  let barIndexMissingForAMXRanges = [];
  let textVariable = "amx.";
  let selectionStartIndex = resultString.indexOf(textVariable);
  let selectionEndIndex = selectionStartIndex + textVariable.length;
  barIndexMissingForAMXRanges.push([selectionStartIndex, selectionEndIndex]);

  // контроль количества закрываемых и открываемых скобок
  let openBracketsCount =
    resultString.match(/\(/g) && resultString.match(/\(/g).length;
  let closeBrqcketsCount =
    resultString.match(/\)/g) && resultString.match(/\)/g).length;
  bracketsCountError = openBracketsCount !== closeBrqcketsCount;

  // контроль ошибки, когда идут подряд && && или || ||
  let logicSignsCountError1 =
    resultString.replace(/\s+/g, "").match(/&&&&/g)?.length > 0;

  let logicSignsCountError2 =
    resultString.replace(/\s+/g, "").match(/\|\|\|\|/g)?.length > 0;

  let logicSignsCountError3 =
    resultString.replace(/\s+/g, "").match(/&&\|\|/g)?.length > 0;

  let logicSignsCountError4 =
    resultString.replace(/\s+/g, "").match(/\|\|&&/g)?.length > 0;

  // debugger;
  resultString = resultString
    .replace(
      /(o|c|h|l|p|p_value|d|d_value|td_value|vh|vl|vh_value|vl_value|d_vh|d_vl|d_high|d_low|v|hbody|body|lbody|dp|dvh|dvl|dp_value|dvh_value|dvl_value|amx|bmx|amx_value|bmx_value)\[(\d{1,}|start|i|n\s\+\s\d{1,}|size123|size123\s\+\s\d{1,})\]/g,
      "_$1($2)"
    )
    .replace(
      /(nl|ns)(\.type).ApproxCompare\((p_r|vl_r|vh_r|vh1|vl1|p2|d_r)\) == 0/gm,
      "$1$2 == handlarVXv2EnumLevelType.$3"
    )
    .replace(
      /(_.{1,}\([\d]{1,}\))[\s]{0,}(\+|-)[\s]{0,}(_.{1,}\([\d]{1,}\))(\.ApproxCompare\([\d]{1,}\*TickSize\)[\s]{0,}>[\s]{0,}[\d]{1,})/gm,
      "Instrument.MasterInstrument.RoundToTickSize($1 $2 $3)$4"
    )
    .replace(
      /\((_.{1,}\(n\s{1,}(\+|-)\s{1,}1\)\s{1,}(\+|-)\s{1,}(\d{1,}\*TickSize))\)/gm,
      "(Instrument.MasterInstrument.RoundToTickSize($1))"
    );
  codeFormatted.value = resultString;

  if (bracketsCountError) {
    appCode.classList.add("errorBracketsCount");
  }

  if (logicSignsCountError1) {
    appCode.classList.add("errorLogicSignsCount1");
  }

  if (logicSignsCountError2) {
    appCode.classList.add("errorLogicSignsCount2");
  }

  if (logicSignsCountError3) {
    appCode.classList.add("errorLogicSignsCount3");
  }

  if (logicSignsCountError4) {
    appCode.classList.add("errorLogicSignsCount4");
  }

  if (barIndexMissingForAMX > 0) {
    appCode.classList.add("errorBarIndex");
  }
  copy(resultString); // копируем отформатированный код в буфер обмена
};

export { transformCode };
