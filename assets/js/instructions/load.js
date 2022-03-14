import { fmtToHex } from "../helper";

import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";

// load accumulator with memory LDA
export function ia9(name) {
  load({ name: name, addrMode: "immediate" });
}
export function iad(name) {
  load({ name: name, addrMode: "absolute" });
}
export function ibd(name) {
  load({ name: name, addrMode: "absoluteX" });
}
export function ib9(name) {
  load({ name: name, addrMode: "absoluteY" });
}
export function ia5(name) {
  load({ name: name, addrMode: "zeroPage" });
}
export function ib5(name) {
  load({ name: name, addrMode: "zeroPageX", onlyLowerByte: true });
}
// TODO: why do we bytecut here?
export function ia1(name) {
  load({ name: name, addrMode: "(zeroPage, X)" });
}
export function ib1(name) {
  load({ name: name, addrMode: "(zeroPage), Y" });
}

// load index X with memory
export function ia2(name) {
  load({ name: name, register: "X", addrMode: "immediate" });
}
export function iae(name) {
  load({ name: name, register: "X", addrMode: "absolute" });
}
export function ibe(name) {
  load({ name: name, register: "X", addrMode: "absoluteY" });
}
export function ia6(name) {
  load({ name: name, register: "X", addrMode: "zeroPage" });
}
export function ib6(name) {
  load({ name: name, register: "X", addrMode: "zeroPageY" });
}

// load index Y with memory
export function ia0(name) {
  load({ name: name, register: "Y", addrMode: "immediate" });
}
export function iac(name) {
  load({ name: name, register: "Y", addrMode: "absolute" });
}
export function ibc(name) {
  load({ name: name, register: "Y", addrMode: "absoluteX" });
}
export function ia4(name) {
  load({ name: name, register: "Y", addrMode: "zeroPage" });
}
export function ib4(name) {
  load({ name: name, register: "Y", addrMode: "zeroPageX" });
}

export function load({
  name = "",
  register = "A",
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let addr = getAddressingModeAddr({
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
  let value = exports.memory.readByte(addr).value;
  let lineNumber = fmtToHex(addr);

  if (addr in exports.addressLineNumbers) {
    lineNumber +=
      "[lineNo: " + exports.addressLineNumbers[addr].lineNumber + "]";
  }

  consoleDebug({
    msg:
      name +
      ": loading value from addr " +
      lineNumber +
      "=" +
      fmtToHex(value) +
      " to reg" +
      register,
  });
  exports.reg[register] = value;
  exports.flags.toggleZeroAndNegative(value);
  return;
}
