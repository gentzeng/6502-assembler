import { fmtToHex, fmtToHexBr, getLowerByte } from "../helper";

import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";

// Add memory to accumulator with carry
export function i69(name) {
  add({ name: name, addrMode: "immediate" });
}
export function i6d(name) {
  add({ name: name, addrMode: "absolute" });
}
export function i7d(name) {
  add({ name: name, addrMode: "absoluteX" });
}
export function i79(name) {
  add({ name: name, addrMode: "absoluteY" });
}
export function i65(name) {
  add({ name: name, addrMode: "zeroPage" });
}
export function i75(name) {
  add({ name: name, addrMode: "zeroPageX" });
}
// TODO: why i75 did this?? {exports.flags.setFromByte(exports.flags.getByteClearedOn("carry") | (value & 1));}
export function i61(name) {
  add({ name: name, addrMode: "(zeroPage, X)" });
}
export function i71(name) {
  add({ name: name, addrMode: "(zeroPage), Y" });
}

function add({ name = "", addrMode = "", onlyLowerByte = false } = {}) {
  let addr = getAddressingModeAddr({
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
  let value = exports.memory.readByte(addr).value;

  consoleDebug({
    msg:
      name +
      ": adding " +
      fmtToHex(value) +
      " to regA=" +
      fmtToHexBr(exports.reg.A),
  });
  exports.reg.A = addTest(value);
  exports.flags.toggleZeroAndNegative(exports.reg.A);
  return;

  function addTest(value) {
    if ((exports.reg.A ^ value) & 0x80) {
      exports.flags.overflow._set();
    } else {
      exports.flags.overflow.clear();
    }

    let tmp;
    if (exports.flags.decimal.isSet()) {
      tmp = (exports.reg.A & 0xf) + (value & 0xf) + exports.flags.carry.value;
      if (tmp >= 10) {
        tmp = 0x10 | ((tmp + 6) & 0xf);
      }

      tmp += (exports.reg.A & 0xf0) + (value & 0xf0);
      if (tmp >= 160) {
        exports.flags.carry._set();
        if (exports.flags.exports.flagsClearedOn("overflow") && tmp >= 0x180) {
          exports.flags.overflow.clear();
        }
        tmp += 0x60;
      } else {
        exports.flags.carry.clear();
        if (exports.flags.getByteClearedOn("overflow") && tmp < 0x80) {
          exports.flags.overflow.clear();
        }
      }
    } else {
      tmp = exports.reg.A + value + exports.flags.carry.value;
      if (tmp >= 0x100) {
        exports.flags.carry._set();
        if (exports.flags.getByteClearedOn("overflow") && tmp >= 0x180) {
          exports.flags.overflow.clear();
        }
      } else {
        exports.flags.carry.clear();
        if (exports.flags.getByteClearedOn("overflow") && tmp < 0x80) {
          exports.flags.overflow.clear();
        }
      }
    }
    return getLowerByte(tmp);
  }
}
