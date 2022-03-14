import { fmtToHex, fmtToHexWord } from "../helper";

import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";

export function i2c(name) {
  testBits(name, "absolute");
}
export function i24(name) {
  testBits(name, "zeroPage");
}

function testBits(name, addrMode) {
  let addr = getAddressingModeAddr(addrMode);
  let value = exports.memory.readByte(addr).value;

  consoleDebug({
    msg:
      name +
      ": testing bits " +
      fmtToHex(value) +
      " at " +
      fmtToHexWord(addr) +
      " with regA/accumulator",
  });
  if (value & exports.reg.A) {
    //0xfd + 0x02 = 0xff
    exports.flags.zero.clear();
  } else {
    exports.flags.zero._set();
  }
  let byte = exports.flags.getByteClearedOnNandV() | (value & 0xc0); // 0x3f + 0xc0 = 0xff
  exports.flags.setFromByte(byte);
  return;
}
