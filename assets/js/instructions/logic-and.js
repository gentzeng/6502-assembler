import { logicInstructionOnRegAWithMemoryResultToRegA } from "./logic-base";
// Logic AND memory with Accumulator=[ A & M -> A ]===========================================
export function i29(name) {
  and({ name: name, addrMode: "immediate" });
}
export function i2d(name) {
  and({ name: name, addrMode: "absolute" });
}
export function i3d(name) {
  and({ name: name, addrMode: "absoluteX" });
}
export function i39(name) {
  and({ name: name, addrMode: "absoluteY" });
}
export function i25(name) {
  and({ name: name, addrMode: "zeroPage" });
}
export function i35(name) {
  and({ name: name, addrMode: "zeroPage" });
}
export function i21(name) {
  and({ name: name, addrMode: "(zeroPage, X)" });
}
export function i31(name) {
  and({ name: name, addrMode: "(zeroPage), Y" });
}

export function and({ typeName = "", name = "", addrMode = "" } = {}) {
  logicInstructionOnRegAWithMemoryResultToRegA({
    type: "AND",
    typeName: typeName,
    name: name,
    addrMode: addrMode,
  });
}
