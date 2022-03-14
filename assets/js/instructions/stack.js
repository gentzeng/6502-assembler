import { consoleDebug } from "../message";
import { fmtToHexBr } from "../helper";

import { ByteEntry } from "../memory";

export function i08(name) {
  pushInstruction(name, "P");
}
export function i28(name) {
  pullInstruction(name, "P");
}
export function i48(name) {
  pushInstruction(name, "A");
}
export function i68(name) {
  pullInstruction(name, "A");
}

function pushInstruction(name, register) {
  let byte = exports.reg.A;
  let valueName = "regA/accumulator=" + fmtToHexBr(exports.reg.A);
  if (register !== "A") {
    byte = exports.flags.byte;
    valueName = "regP/processor status=" + fmtToHexBr(byte);
  }
  consoleDebug({ msg: name + ": pushing " + valueName + " to Stack" });
  exports.memory.pushByteToStack(new ByteEntry(byte));
}
function pullInstruction(name, register = "A") {
  let valueName;
  let byte = exports.memory.popByteFromStack().value;
  if (register === "A") {
    exports.reg.A = byte;
    valueName = "regA/accumulator=" + fmtToHexBr(exports.reg.A);
    exports.flags.toggleZeroAndNegative(exports.reg.A);
  } else {
    exports.flags.setFromByte(byte);
    valueName = "regP/processor status=" + fmtToHexBr(exports.flags.byte);
  }
  consoleDebug({ msg: name + ": pulling " + valueName + " from Stack" });
}
