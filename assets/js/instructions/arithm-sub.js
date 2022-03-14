import { fmtToHex, fmtToHexBr, getLowerByte } from "../helper";

import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";

export function _eb(name) {
  ie9(name);
} // same as ie9, SUB immediate

// Subtract memory from accumulator with borrow
export function ie9(name) {
  substract({ name: name, addrMode: "immediate" });
}
export function ied(name) {
  substract({ name: name, addrMode: "absolute" });
}
export function ifd(name) {
  substract({ name: name, addrMode: "absoluteX" });
}
export function if9(name) {
  substract({ name: name, addrMode: "absoluteY" });
}
export function ie5(name) {
  substract({ name: name, addrMode: "zeroPage" });
}
export function if5(name) {
  substract({ name: name, addrMode: "zeroPageX" });
}
// TODO: why if5 did this?? {exports.flags.setFromByte(exports.flags.getByteClearedOn("carry") | (value & 1));}
export function ie1(name) {
  substract({ name: name, addrMode: "(zeroPage, X)" });
}
export function if1(name) {
  substract({ name: name, addrMode: "(zeroPage), Y" });
}

function substract({ name = "", addrMode = "", onlyLowerByte = false } = {}) {
  let addr = getAddressingModeAddr({
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
  let value = exports.memory.readByte(addr).value;

  consoleDebug({
    msg:
      name +
      ": substracting " +
      fmtToHex(value) +
      " from regA=" +
      fmtToHexBr(exports.reg.A),
  });
  exports.reg.A = testSubstract(value);
  exports.flags.toggleZeroAndNegative(exports.reg.A);

  return;

  function testSubstract(value) {
    if ((exports.reg.A ^ value) & 0x80) {
      vflag = 1;
    } else {
      vflag = 0;
    }

    let tmp;
    let w;
    if (exports.flags.decimal.isSet()) {
      tmp =
        0xf + (exports.reg.A & 0xf) - (value & 0xf) + exports.flags.carry.value;
      if (tmp < 0x10) {
        w = 0;
        tmp -= 6;
      } else {
        w = 0x10;
        tmp -= 0x10;
      }
      w += 0xf0 + (exports.reg.A & 0xf0) - (value & 0xf0);
      if (w < 0x100) {
        exports.flags.carry.clear();
        if (exports.flags.getByteClearedOn("overflow") && w < 0x80) {
          exports.flags.overflow.clear();
        }
        w -= 0x60;
      } else {
        exports.flags.carry._set();
        if (exports.flags.getByteClearedOn("overflow") && w >= 0x180) {
          exports.flags.overflow.clear();
        }
      }
      w += tmp;
    } else {
      w = 0xff + exports.reg.A - value + exports.flags.carry.value;
      if (w < 0x100) {
        exports.flags.carry.clear();
        if (exports.flags.getByteClearedOn("overflow") && w < 0x80) {
          exports.flags.overflow.clear();
        }
      } else {
        exports.flags.carr._set();
        if (exports.flags.getByteClearedOn("overflow") && w >= 0x180) {
          exports.flags.overflow.clear();
        }
      }
    }
    return getLowerByte(w);
  }
}
