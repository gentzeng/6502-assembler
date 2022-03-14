import { fmtToHex, fmtToHexBr } from "../helper";
import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";

export function ic9(name) {
  compare({ name: name, addrMode: "immediate" });
}
export function icd(name) {
  compare({ name: name, addrMode: "absolute" });
}
export function idd(name) {
  compare({ name: name, addrMode: "absoluteX" });
}
export function id9(name) {
  compare({ name: name, addrMode: "absoluteY" });
}
export function ic5(name) {
  compare({ name: name, addrMode: "zeroPage" });
}
export function id5(name) {
  compare({ name: name, addrMode: "zeroPageX" });
}
export function ic1(name) {
  compare({ name: name, addrMode: "(zeroPage, X)" });
}
export function id1(name) {
  compare({ name: name, addrMode: "(zeroPage), Y" });
}
// CMP: Compare Memory and Index X
export function ie0(name) {
  compare({ name: name, register: "X", addrMode: "immediate" });
}
export function iec(name) {
  compare({ name: name, register: "X", addrMode: "absolute" });
}
export function ie4(name) {
  compare({ name: name, register: "X", addrMode: "zeroPage" });
}
// CMP: Compare Memory and Index Y
// TODO: Was this old code for ic0 wrong, because its inconsitent?
// if( (exports.reg.Y+value) > 0xff ) exports.flags.zero._set(); else exports.flags.zero.clear();
// value = (exports.reg.Y-value);
export function ic0(name) {
  compare({ name: name, register: "Y", addrMode: "immediate" });
}
export function icc(name) {
  compare({ name: name, register: "Y", addrMode: "absolute" });
}
export function ic4(name) {
  compare({ name: name, register: "Y", addrMode: "zeroPage" });
}

function compare({
  name = "",
  register = "A",
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let regValue = exports.reg[register];
  let addr = getAddressingModeAddr({
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
  let value = exports.memory.readByte(addr).value;

  consoleDebug({
    msg:
      name +
      ": compare reg" +
      register +
      "=" +
      fmtToHexBr(regValue) +
      " with " +
      fmtToHex(value),
  });
  let compareResult = compareTest(regValue, value);
  exports.flags.toggleZeroAndNegative(compareResult);
  return;

  function compareTest(regValue, value) {
    if (regValue >= value) {
      // Thanks, "Guest"
      exports.flags.zero._set();
    } else {
      exports.flags.zero.clear();
    }
    return regValue - value;
  }
}
