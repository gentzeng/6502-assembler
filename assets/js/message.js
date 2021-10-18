/*
 *  printMessage() - Prints text in the message window
 */
export function printMessage(text) {
  let obj = $("#messages");
  obj.html += text + "<br/>";
  obj.scrollTop = obj.scrollHeight;
}
export function printErrorMessage ({
  line = "",
  errMsg = "",
  errType = "",
}={}) {
  if (line != "" ) {
    errMsg = "<b>"+ errType + "Error at line " + line + ": " + errMsg + "!</b>";
  } else {
    errMsg = "<b>"+ errType + ": " + errMsg + "!</b>";
  }
  printMessage(errMsg);
  //console.log(errMsg);
}
export function raiseError (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg});
}
export function raiseSyntaxError (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg, errType : "Syntax"});
}
export function raiseAddressingModeError (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg, errType : "AddressingMode"});
}
export function raiseDCBValueError (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg, errType : "DCBValue"});
}
export function raiseLabelError (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg, errType : "Label"});
}
export function raiseRangeError (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg, errType : "Range"});
}
export function raiseRunTimeError (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg, errType : "RunTime"});
}
export function raiseStackOverflow (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg, errType : "StackOverflow"});
}
export function raiseStackEmpty (line, errMsg) {
  printErrorMessage({line : line, errMsg : errMsg, errType : "StackEmpty"});
}

export function consoleDebug({msg, bold = false}={}) {
  if (exports.debug) {
    if (bold) {
      printMessage("<b>" + msg + "</b>");
      console.debug("%c" + msg, "font-weight: bold");
      return;
    }
    printMessage(msg);
    console.debug(msg);
  }
}
