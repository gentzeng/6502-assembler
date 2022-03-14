import { fmtToHex, fmtToHexBr, getLowerByte } from "../helper";

import { WordEntry } from "../memory";
import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";

export function ie8(name) {
  increment({ name: name, impliedRegister: "X" });
}
export function ic8(name) {
  increment({ name: name, impliedRegister: "Y" });
}
export function iee(name) {
  increment({ name: name, addrMode: "absolute" });
}
export function ife(name) {
  increment({ name: name, addrMode: "absoluteX" });
}
export function ie6(name) {
  increment({ name: name, addrMode: "zeroPage" });
}
export function if6(name) {
  increment({ name: name, addrMode: "zeroPageX" });
}

export function increment({
  name = "",
  addrMode = "",
  impliedRegister = "",
} = {}) {
  crement({
    type: "IN",
    name: name,
    addrMode: addrMode,
    impliedRegister: impliedRegister,
  });
  return;
}

// decrement =================================================================================
export function ica(name) {
  decrement({ name: name, impliedRegister: "X" });
}
export function i88(name) {
  decrement({ name: name, impliedRegister: "Y" });
}
export function ice(name) {
  decrement({ name: name, addrMode: "absolute" });
}
export function ide(name) {
  decrement({ name: name, addrMode: "absoluteX" });
}
export function ic6(name) {
  decrement({ name: name, addrMode: "zeroPage" });
}
export function id6(name) {
  decrement({ name: name, addrMode: "zeroPageX" });
}

function decrement({ name = "", addrMode = "", impliedRegister = "" } = {}) {
  crement({
    type: "DE",
    name: name,
    addrMode: addrMode,
    impliedRegister: impliedRegister,
  });
  return;
}

function crement({
  type = "",
  name = "",
  addrMode = "",
  impliedRegister = "X",
} = {}) {
  let value = exports.reg[impliedRegister];
  let valueName = "reg" + impliedRegister;
  let addr;

  if (!["X", "Y"].includes(impliedRegister)) {
    addr = getAddressingModeAddr({ addrMode: addrMode });
    let byteEntry = exports.memory.readByte(addr);
    value = byteEntry.value;
    valueName = fmtToHex(addr);
    if (addr in exports.addressLineNumbers) {
      valueName +=
        "[lineNo: " + exports.addressLineNumbers[addr].lineNumber + "]";
    }
  }

  let oldValue = value;

  if (type === "IN") {
    value = getLowerByte(++value);
  } else {
    // if (type === "DE")
    value = getLowerByte(--value);
  }
  consoleDebug({
    msg:
      name +
      ": " +
      type +
      "crement value at " +
      valueName +
      fmtToHexBr(oldValue) +
      " to " +
      fmtToHex(value),
  });

  exports.flags.toggleZeroAndNegative(value);
  if (["X", "Y"].includes(impliedRegister)) {
    exports.reg[impliedRegister] = value;
    return;
  }
  let lineNumber = addr;
  if (addr in exports.addressLineNumbers) {
    lineNumber = exports.addressLineNumbers[addr];
  }
  exports.memory.writeByte(
    addr,
    new WordEntry(value, lineNumber).lowerByteEntry
  );
  return addr;
}
