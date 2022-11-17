import { getTabs } from "./helpers";
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

  formattedValue = code
    .replace(
      // удалим лишние пробелы
      /[\s?]/gm,
      ""
    )
    .replace(
      // преобразуем все +- тики
      /(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}((\[n\+){0,}\d{0,}(\]){0,})==(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}((\[n\+){0,}\d{0,}(\]){0,})(\+-(\d{0,1}t))/gm,
      "$1$2$3<=$6$7$8+$12&&$1$2$3>=$6$7$8-$12"
    )
    .replace(
      // окультурим добавление тиков
      /(-|\+)(\d{1,})(t)/g,
      "$1$2*TickSize"
    )
    .replace(
      // переведем знаки $ в _value для ситуаций, когда перед долларом нет индекса например d_r$
      /(\$)/gm,
      "_value"
    )
    .replace(
      // после замена $ в _value могут появиться варианты td1_value когда индекс нужно поставить сразу после _value
      /(\d{1,})_value/gm,
      "_value$1"
    )
    .replace(
      // преобразуем значения с фигурными скобками в правильные: из d{vl}_2 в d_vl2
      /(d)\{(vh|vl)\}_(\d{1,})/g,
      "$1_$2$3"
    )

    .replace(
      // преобразуем значения с фигурными скобками в правильные: из d{vl}_r в d_vl_r
      /(d)\{(vh|vl)\}(_r|_l|_m|_b|_x)/gm,
      "$1_$2$3"
    )
    .replace(
      // обработаем отдельно стоящие модули, как содержащие выражения |vl1 - p1|, так и содержащие просто значения |td_value1|
      /(\|)((td_value|p_value|d_value|vh_value|vh_r_value|vl_value|vl_r_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}(\d{0,})((\+|-)((td_value|p_value|d_value|vh_value|vh_r_value|vl_value|vl_r_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}(\d{0,}))){0,})(\|)/gm,
      "Math.Abs($2)"
    );
  for (let i = 0; i < formattedValue.length; i++) {
    if (formattedValue[i] === "&") {
      if (formattedValue[i - 1] === "&") {
        resultString += formattedValue[i] + "\n" + getTabs(tabLevel);
      } else {
        resultString += formattedValue[i];
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
        resultString += formattedValue[i];
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
  //resultString = formattedValue;

  resultString = resultString
    .replace(
      // корректировка лишних табуляций и переносов строк в скобках функции Math.Abs()
      /\.Abs\(\n\t{0,}(.*)\n\t{0,}\)/gm,
      ".Abs($1)"
    )
    .replace(
      // && перенесем на новую строку;
      /(&&)/gm,
      "\n$1\n"
    )
    .replace(
      // || перенесем на новую строку;
      /(\|\|)/gm,
      "\n$1\n"
    )
    .replace(
      // содержимое квадратных скобок перенесем в круглые
      /(\[)([n|i]\+\d{1,}|start(_r|_l|_m|_b|_x){0,1}|i|size123(\+\d){0,})(\])/gm,
      "($2)"
    )
    .replace(
      // исправим неправильную корректировку описание объема вместо v_value на v
      /v_value/g,
      "v"
    )
    .replace(
      // обрамим лидирующую сумму или разницу в скобки, чтобы при дальше при при добавлении .ApproxCompare() корректно сравнивалось с выражением целым, а не с первой частью
      /(((td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}(_value){0,}(\d{1,}){0,})(\+|-)((\d{1,}\*TickSize|td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}(_value){0,}(\d{0,}){0,}))(\.|<=|>=|!=|==|<|>){0,}/gm,
      "Instrument.MasterInstrument.RoundToTickSize($1)$13"
    )
    .replace(
      // все индексы типа l3 vh1 приведем к виду функций _l(3) и _vh(1)
      /(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}(\d|start|i|size123(\+\d){0,})/gm,
      "_$1$2($3)"
    )
    .replace(
      // все описания функций без подчеркивания и с n внутри скобок типа o(n+1) c(n+1) переведем в _o(n+1) и _c(n+1)
      /((td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}\((n|i)((\+|-)\d{1,}){0,}\))/gm,
      "_$1"
    )

    .replace(
      // все описания функций без подчеркивания и с n внутри скобок типа o(start_r) переведем в _o(istart_r)
      /((td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}\((start_r|start_l|start_m|start_b|start_x)((\+|-)\d{1,}){0,}\))/gm,
      "_$2(getBar(i$4))"
    )
    .replace(
      // заменим все сравнения через корректное ApproxCompare
      /(.{1,})(>=|<=|==|!=|>|<)(.{1,})/gm,
      "$1.ApproxCompare($3)$20"
    )
    .replace(
      // заменим все разности на Instrument.MasterInstrument.RoundToTickSize
      /(ApproxCompare)(\()((_(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x){0,}(\())(n\+\d{1,}|\d|start|i|size123(\+\d){0,})(\))(\+|-)(.{0,}))(\))/gm,
      "$1$2Instrument.MasterInstrument.RoundToTickSize($3)$10"
    )
    .replace(
      // добавим правильное отображение типа уровня в условии
      /(nl|ns)(\.type).ApproxCompare\((p_r|vl_r|vh_r|vh1|vl1|p2|d_r)\)==0/gm,
      "$1$2 == handlarVXv2EnumLevelType.$3"
    )
    .replace(
      // заменим значение тиков в скобке (3t) на (3*TickSize)
      /\((\d){1,}t\)/gm,
      "($1*TickSize)"
    )
    .replace(
      // добавим слева и с права от плюса и минуса пробелы для улучшения читаемости условий
      /(\+|-)/gm,
      " $1 "
    )
    .replace(
      // удалим все расставленные переносы строк, чтобы дальше корректно отформатировать отступы
      /(\n)(&&|\|\|)(\n)/gm,
      "$2"
    )
    .replace(
      // добавим недостающий пробел в таких местах )|| и )&&, чтобы стало так ) || и ) &&
      /(\))(&&|\|\|)/gm,
      "$1 $2"
    )
    .replace(
      // добавим недостающие пробелы форматирования в конце строк
      /(>=|<=|!=|==|>|<)(\d){1,}(&&|\|\|){0,}$/gm,
      " $1 $2 $3"
    )
    .replace(
      // уберем лишние пробелы, табуляцию и пренос строк между скобок в вызовах фйнкций типа springCommonShort()
      /\((\n|\t){1,}\)/gm,
      "()"
    );

  //resultString = resultString

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

  codeFormatted.value = resultString;
  if (bracketsCountError) appCode.classList.add("errorBracketsCount");
  if (logicSignsCountError1) appCode.classList.add("errorLogicSignsCount1");
  if (logicSignsCountError2) appCode.classList.add("errorLogicSignsCount2");
  if (logicSignsCountError3) appCode.classList.add("errorLogicSignsCount3");
  if (logicSignsCountError4) appCode.classList.add("errorLogicSignsCount4");
  if (barIndexMissingForAMX > 0) appCode.classList.add("errorBarIndex");
  copy(resultString); // копируем отформатированный код в буфер обмена
};

export { transformCode };
