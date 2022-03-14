import { logicInstructionOnRegAWithMemoryResultToRegA } from "./logic-base";

// Logic Exclusive-Or memory with accumulator
export function i49(name) {
  xor({ name: name, addrMode: "immediate" });
}
export function i4d(name) {
  xor({ name: name, addrMode: "absolute" });
}
export function i5d(name) {
  xor({ name: name, addrMode: "absoluteX" });
}
export function i59(name) {
  xor({ name: name, addrMode: "absoluteY" });
}
export function i45(name) {
  xor({ name: name, addrMode: "zeroPage" });
}
export function i55(name) {
  xor({ name: name, addrMode: "zeroPageX" });
}
export function i41(name) {
  xor({ name: name, addrMode: "(zeroPage, X)" });
}
export function i51(name) {
  xor({ name: name, addrMode: "(zeroPage), Y" });
}

function xor({ name = "", addrMode = "" } = {}) {
  logicInstructionOnRegAWithMemoryResultToRegA({
    type: "EOR",
    name: name,
    addrMode: addrMode,
  });
}
