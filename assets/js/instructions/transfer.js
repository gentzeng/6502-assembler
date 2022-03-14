import { consoleDebug } from "../message";
import { getLowerByte } from "../helper";

export function iaa(name) {
  transfer(name, "A", "X");
}
export function ia8(name) {
  transfer(name, "A", "Y");
}
export function i8a(name) {
  transfer(name, "X", "A");
}
export function i98(name) {
  transfer(name, "Y", "A");
}
export function iba(name) {
  transfer(name, "SP", "X");
}
export function i9a(name) {
  transfer(name, "X", "SP");
}

function transfer(name, srcRegister, dstRegister) {
  let value = exports.reg[srcRegister];
  if (srcRegister === "SP") {
    value = exports.memory.regSP;
  }
  value = getLowerByte(value);
  if (dstRegister === "SP") {
    exports.memory.setRegSP(value);
  } else {
    exports.reg[dstRegister] = value;
    exports.flags.toggleZeroAndNegative(value); // why for stackpointer?
  }
  consoleDebug({
    msg: name + ": transfering reg" + srcRegister + " to reg" + dstRegister,
  });
}
