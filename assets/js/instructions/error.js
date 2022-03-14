import { fmtToHexWord } from "../helper";
import { raiseRunTimeError } from "../message";

export function ierr(name) {
  let message = name + " illegal Opcode not allowed, skipping";
  raiseRunTimeError(fmtToHexWord(exports.reg.PC - 1), message);
  console.warn(message);
}
