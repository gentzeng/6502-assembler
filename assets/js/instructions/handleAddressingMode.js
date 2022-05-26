import { getLowerByte } from "../helper";

export function getAddressingModeAddr({
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let zp;
  let addr;
  if (["immediate", "relativePlus", "relativeMinus"].includes(addrMode)) {
    addr = exports.reg.PC;
    exports.reg.PC++; //advance program counter;
    return addr;
  }

  switch (addrMode) {
    case "absolute":
    case "absoluteX":
    case "absoluteY":
    case "absoluteIndirect":
      addr = exports.memory.readWord(exports.reg.PC).value;
      exports.reg.PC += 2; //advance program counter by 2 = #byte in word
      break;
    case "relative":
    case "zeroPage":
    case "zeroPageX":
    case "zeroPageY":
    case "(zeroPage, X)":
    case "(zeroPage), Y":
      zp = addr = exports.memory.readByte(exports.reg.PC).value;
      exports.reg.PC++; // advance program counter
    default:
  }
  switch (addrMode) {
    case "absoluteIndirect":
      addr = exports.memory.readWord(addr).value;
      break;
    case "(zeroPage, X)":
      zp = getLowerByte(addr + exports.reg.X);
    case "(zeroPage), Y": // and "(zeroPage, X), due to missing break!!"
      let lowerByte = exports.memory.readByte(zp).value;
      let upperByte = exports.memory.readByte(zp + 1).value;
      addr = (upperByte << 8) + lowerByte;
      break;
    default:
  }

  addr += getRegisterAddr(addrMode.slice(-1));

  if (onlyLowerByte) {
    addr = getLowerByte(addr);
  }
  return addr;

  function getRegisterAddr(register) {
    switch (register) {
      case "X":
        return exports.reg.X;
      case "Y": // for "(zeroPage), Y" as well
        return exports.reg.Y;
      default:
        return 0x00;
    }
  }
}
