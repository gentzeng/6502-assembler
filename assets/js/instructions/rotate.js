import { fmtToHex } from "../helper";
import { WordEntry } from "../memory";
import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";

// rotate left one bit
export function i2a(name) {
  rotateLeft({ name: name, accumulator: true });
}
export function i2e(name) {
  rotateLeft({ name: name, addrMode: "absolute" });
}
export function i3e(name) {
  rotateLeft({ name: name, addrMode: "absoluteX" });
}
export function i26(name) {
  rotateLeft({ name: name, addrMode: "zeroPage" });
}
export function i36(name) {
  rotateLeft({ name: name, addrMode: "zeroPageX" });
}

function rotateLeft({
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  rotate({
    type: "LEFT",
    name: name,
    accumulator: accumulator,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}
// rotate right one bit
export function i6a(name) {
  rotateRight({ name: name, accumulator: true });
}
export function i6e(name) {
  rotateRight({ name: name, addrMode: "absolute" });
}
export function i7e(name) {
  rotateRight({ name: name, addrMode: "absoluteX" });
}
export function i66(name) {
  rotateRight({ name: name, addrMode: "zeroPage" });
}
export function i76(name) {
  rotateRight({ name: name, addrMode: "zeroPageX", onlyLowerByte: true });
}

export function rotateRight({
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  rotate({
    type: "RIGHT",
    name: name,
    accumulator: accumulator,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}
function rotate({
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
    value = (value << 1) | exports.flags.carry.value;
  } else {
    byte = exports.flags.getByteClearedOn("carry") | (value & 1);
    value >>= 1;
    if (exports.flags.carry.isSet()) {
      value |= 0x80;
    }
  }
  exports.flags.setFromByte(byte);

  consoleDebug({
    msg:
      name +
      ": rotate " +
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
