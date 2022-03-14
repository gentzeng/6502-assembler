import { fmtToHex } from "../helper";
import { WordEntry } from "../memory";
import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";

// arithmetic shift one bit left
export function i0a(name) {
  shiftLeft({ name: name, accumulator: true });
}
export function i0e(name) {
  shiftLeft({ name: name, addrMode: "absolute" });
}
export function i1e(name) {
  shiftLeft({ name: name, addrMode: "absoluteX" });
}
export function i06(name) {
  shiftLeft({ name: name, addrMode: "zeroPage" });
}
export function i16(name) {
  shiftLeft({ name: name, addrMode: "zeroPageX" });
}

function shiftLeft({
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  shift({
    type: "LEFT",
    name: name,
    accumulator: accumulator,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}
//logical shift right one bit
export function i4a(name) {
  shiftRight({ name: name, accumulator: true });
}
export function i4e(name) {
  shiftRight({ name: name, addrMode: "absolute" });
}
export function i5e(name) {
  shiftRight({ name: name, addrMode: "absoluteX" });
}
export function i46(name) {
  shiftRight({ name: name, addrMode: "zeroPage" });
}
export function i56(name) {
  shiftRight({ name: name, addrMode: "zeroPageX" });
}

export function shiftRight({
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  shift({
    type: "RIGHT",
    name: name,
    accumulator: accumulator,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}

function shift({
  type = "",
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let value = exports.reg.A;
  let addr;
  if (!accumulator) {
    addr = getAddressingModeAddr({
      addrMode: addrMode,
      onlyLowerByte: onlyLowerByte,
    });
    value = exports.memory.readByte(addr).value;
  }

  let oldValue = value;
  let byte;
  if (type === "LEFT") {
    byte = exports.flags.getByteClearedOn("carry") | ((value >> 7) & 1);
    exports.flags.setFromByte(byte);
    value <<= 1;
  } else {
    byte = exports.flags.getByteClearedOn("carry") | (value & 1);
    value >>= 1;
  }
  exports.flags.setFromByte(byte);

  consoleDebug({
    msg:
      name +
      ": shifting " +
      fmtToHex(oldValue) +
      " " +
      type +
      " to " +
      fmtToHex(value),
  });

  exports.flags.toggleZeroAndNegative(value);
  if (accumulator) {
    exports.reg.A = value;
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
