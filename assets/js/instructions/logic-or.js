import { logicInstructionOnRegAWithMemoryResultToRegA } from "./logic-base";

//Logic Or Memory with Accumulator
export function i09(name) {
  or({ name: name, addrMode: "immediate" });
}
export function i0d(name) {
  or({ name: name, addrMode: "absolute" });
}
export function i1d(name) {
  or({ name: name, addrMode: "absoluteX" });
}
export function i19(name) {
  or({ name: name, addrMode: "absoluteY" });
}
export function i05(name) {
  or({ name: name, addrMode: "zeroPage" });
}
export function i15(name) {
  or({ name: name, addrMode: "zeroPageX" });
}
export function i01(name) {
  or({ name: name, addrMode: "(zeroPage, X)" });
}
export function i11(name) {
  or({ name: name, addrMode: "(zeroPage), Y" });
}

function or({ name = "", addrMode = "" } = {}) {
  logicInstructionOnRegAWithMemoryResultToRegA({
    type: "ORA",
    name: name,
    addrMode: addrMode,
  });
}
