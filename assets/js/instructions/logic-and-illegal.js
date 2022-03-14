import { isNegative } from "../helper";
import { getBit } from "../flags";
import { ierr } from "./error";
import { and } from "./logic-and";
import { rotateRight } from "./rotate";
import { shiftRight } from "./shift";
import {
  logicInstructionOnRegAWithRegXResultToAddr,
  logicInstructionOnRegAWithRegXResultToRegA,
  logicInstructionOnRegAWithRegXResultToRegX,
  logicInstruction,
} from "./logic-base";
import { getAddressingModeAddr } from "./handleAddressingMode";
import { ByteEntry } from "../memory";
import { fmtToHex } from "../helper";

// Illegal Ands ------------------------------------------------------------------------------
// AAC:= Logic AND memory with Accumulator, set carry on negative result
export function _0b(name) {
  _2b(name);
}
export function _2b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
    return;
  }
  and({
    name: name,
    typeName: " with CarrySet",
    addrMode: "immediate",
  });
  if (isNegative(exports.reg.A)) {
    exports.flags.carry._set();
  }
}

// AAX:= Logic AND X register with with Accumulator, save to Memory [ A & X -> M ]
export function _8f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  andRegAWithRegX({
    name: name,
    typeName: " regX with regA and save to memory",
    addrMode: "absolute",
    writeToAddr: true,
  });
}
export function _87(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  andRegAWithRegX({
    name: name,
    typeName: " regX with regA and save to memory",
    addrMode: "zeroPage",
    writeToAddr: true,
  });
}
export function _97(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  andRegAWithRegX({
    name: name,
    typeName: " regX with regA and save to memory",
    addrMode: "zeroPageY",
    writeToAddr: true,
  });
}
export function _83(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  andRegAWithRegX({
    name: name,
    typeName: " regX with regA and save to memory",
    addrMode: "(zeroPage, X)",
    writeToAddr: true,
  });
} // AAX (indirect, X) => AAX (zp, X)

// ARR:= Logic AND memory with Accumulator, then rotate von bit right in accumulator and check bit 5 and 6
export function _6b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  and({
    name: name,
    typeName: " (, then rotate regA one bit right and check bit 5 and 6)",
    addrMode: "immediate",
  });
  rotateRight({ name: name, accumulator: true });
  const value = exports.reg.A;
  const valueBit5 = getBit(value, 5);
  const valueBit6 = getBit(value, 6);

  if (valueBit5 && valueBit6) {
    exports.flags.carry._set();
    exports.flags.overflow.clear();
  } else if (!valueBit5 && !valueBit6) {
    exports.flags.carry.clear();
    exports.flags.overflow.clear();
  } else if (valueBit5 && !valueBit6) {
    exports.flags.carry.clear();
    exports.flags.overflow._set();
  } else if (!valueBit5 && valueBit6) {
    exports.flags.carry._set();
    exports.flags.overflow._set();
  }
}

// ASR:= Logic AND memory with Accumulator, then shift von bit right in accumulator
export function _4b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  and({
    name: name,
    typeName: " (, then shift regA one bit right)",
    addrMode: "immediate",
  });
  shiftRight({ name: name, accumulator: true });
}

// ATX:= Logic AND memory with Accumulator, then transfer regA to regX
export function _ab(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  and({
    name: name,
    typeName: " (, then transfer regA to regX)",
    addrMode: "immediate",
  });
  exports.reg.X = exports.reg.A;
}

// AXA:= Logic AND regX with Accumulator, then AND result with 7 and store in memory
// ToDo: Check assumption that result of first AND written to regA
export function _9f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  axa({ name: name, addrMode: "absoluteY" });
}
export function _93(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  axa({ name: name, addrMode: "(zeroPage), Y" });
}

function axa({ name = "", addrMode = "" } = {}) {
  andRegAWithRegXToRegA({
    name: name,
    typeName: " regX with regA, then AND result with 7, then store to memory",
  });
  const value = exports.reg.A & 7; // second AND with 7
  const addr = getAddressingModeAddr({ addrMode: addrMode });
  exports.memory.writeByte(addr, new ByteEntry(value));
}

// AXS:= Logic AND regX with Accumulator, then store in regX, then substract byte from reg X without Borrow
export function _cb(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  //   andRegAWithRegXToRegX({
  //     name: name,
  // 	typeName: " regX with regA to regX, then substract memory from regX without borrow",
  //   });
  //   const andResult = exports.reg.X
  //   const addr = getAddressingModeAddr({ addrMode: addrMode });
  //   let value = exports.memory.readByte(addr).value;
}
// function andRegAWithRegXToRegX({ name = "", typeName = "" } = {}) {
//   logicInstructionOnRegAWithRegXResultToRegX({
//     type: "AND",
//     typeName: typeName,
//     name: name,
//   });
// }

function andRegAWithRegX({ name = "", typeName = "", addrMode = "" } = {}) {
  logicInstructionOnRegAWithRegXResultToAddr({
    type: "AND",
    typeName: typeName,
    name: name,
    addrMode: addrMode,
  });
}

function andRegAWithRegXToRegA({ name = "", typeName = "" } = {}) {
  logicInstructionOnRegAWithRegXResultToRegA({
    type: "AND",
    typeName: typeName,
    name: name,
  });
}

// LAR:= Logic AND memory with regSP, transfer to regA, regX and regSP
export function _bb(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  const addr = getAddressingModeAddr({ addrMode: "absoluteY" });
  const value = exports.memory.readByte(addr).value;
  exports.reg.A = logicInstruction({
    type: "AND",
    valueA: value,
    valueAName: "memory",
    valueB: exports.memory.regSP,
    valueBName: "regSP",
    name: name,
  });
  exports.reg.X = exports.reg.A;
  exports.memory.regSP = exports.reg.A;
}
