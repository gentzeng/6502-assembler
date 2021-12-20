/*
 *  printMessage() - Prints text in the message window
 */
export function printMessage(text) {
  let obj = $("#messages");
  obj.append(text + "\n");
  obj.scrollTop = obj.scrollHeight;
}

export function resetMessageWindow() {
  $("#messages").html("");
}

/*
 *  printErrorMessage() - Prints error in the message window
 */
export function printErrorMessage({
  line = "",
  errMsg = "",
  errType = "",
} = {}) {
  exports.error = true;
  if (line != "") {
    errMsg =
      "<b>" + errType + "Error at line " + line + ": " + errMsg + "!</b>";
  } else {
    errMsg = "<b>" + errType + ": " + errMsg + "!</b>";
  }
  printMessage(errMsg);
}
export function raiseError(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg });
}
export function raiseSyntaxError(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg, errType: "Syntax" });
}
export function raiseAddressingModeError(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg, errType: "AddressingMode" });
}
export function raiseDCBValueError(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg, errType: "DCBValue" });
}
export function raiseLabelError(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg, errType: "Label" });
}
export function raiseRangeError(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg, errType: "Range" });
}
export function raiseRunTimeError(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg, errType: "RunTime" });
}
export function raiseStackOverflow(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg, errType: "StackOverflow" });
}
export function raiseStackEmpty(line, errMsg) {
  printErrorMessage({ line: line, errMsg: errMsg, errType: "StackEmpty" });
}

export function consoleDebug({ msg, bold = false } = {}) {
  // if (true) {
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
