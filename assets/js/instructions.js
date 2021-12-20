import {
  fmtToHex,
  fmtToHexBr,
  fmtToHexWord,
  fmtToHexWordBr,
  getLowerByte,
} from "./helper";

import { ByteEntry, WordEntry } from "./memory";

import { consoleDebug, raiseRunTimeError } from "./message";

import { Command } from "./compiler";

export var instructions = new Array( // /**/ means legal instruction
  i00,
  /**/ i01,
  i02,
  i03,
  i04,
  i05,
  /**/ i06,
  /**/ i07,
  i08 /**/,
  i09,
  /**/ i0a,
  /**/ i0b,
  i0c,
  i0d,
  i0e,
  /**/ i0f,
  i10,
  /**/ i11,
  i12,
  i13,
  i14,
  i15,
  /**/ i16,
  /**/ i17,
  i18 /**/,
  i19,
  /**/ i1a,
  i1b,
  i1c,
  i1d,
  i1e,
  /**/ i1f,
  i20,
  /**/ i21,
  i22,
  i23,
  i24,
  /**/ i25,
  /**/ i26,
  /**/ i27,
  i28 /**/,
  i29,
  /**/ i2a,
  /**/ i2b,
  i2c,
  /**/ i2d,
  i2e,
  /**/ i2f,
  i30,
  /**/ i31,
  i32,
  i33,
  i34,
  i35,
  /**/ i36,
  /**/ i37,
  i38 /**/,
  i39,
  /**/ i3a,
  i3b,
  i3c,
  i3d,
  i3e,
  /**/ i3f,
  i40,
  /**/ i41,
  i42,
  i43,
  i44,
  i45,
  /**/ i46,
  /**/ i47,
  i48 /**/,
  i49,
  /**/ i4a,
  /**/ i4b,
  i4c,
  /**/ i4d,
  i4e,
  /**/ i4f,
  i50,
  /**/ i51,
  i52,
  i53,
  i54,
  i55,
  /**/ i56,
  /**/ i57,
  i58 /**/,
  i59,
  /**/ i5a,
  i5b,
  /**/ i5c,
  i5d,
  i5e,
  /**/ i5f,
  i60,
  /**/ i61,
  i62,
  i63,
  i64,
  i65,
  /**/ i66,
  /**/ i67,
  i68 /**/,
  i69,
  /**/ i6a,
  /**/ i6b,
  i6c,
  /**/ i6d,
  i6e,
  /**/ i6f,
  i70,
  /**/ i71,
  i72,
  i73,
  i74,
  i75,
  /**/ i76,
  /**/ i77,
  i78 /**/,
  i79,
  /**/ i7a,
  i7b,
  i7c,
  i7d,
  i7e,
  /**/ i7f,
  i80,
  i81,
  i82,
  i83,
  i84,
  /**/ i85,
  /**/ i86,
  /**/ i87,
  i88 /**/,
  i89,
  i8a,
  /**/ i8b,
  i8c,
  /**/ i8d,
  i8e,
  /**/ i8f,
  i90,
  /**/ i91,
  i92,
  i93,
  i94,
  /**/ i95,
  /**/ i96,
  /**/ i97,
  i98 /**/,
  i99,
  /**/ i9a,
  /**/ i9b,
  i9c,
  i9d,
  i9e,
  i9f,
  ia0,
  /**/ ia1,
  ia2,
  /**/ ia3,
  ia4,
  /**/ ia5,
  /**/ ia6,
  /**/ ia7,
  ia8 /**/,
  ia9,
  /**/ iaa,
  /**/ iab,
  iac,
  /**/ iad,
  iae,
  /**/ iaf,
  ib0,
  /**/ ib1,
  ib2,
  ib3,
  ib4,
  /**/ ib5,
  /**/ ib6,
  /**/ ib7,
  ib8 /**/,
  ib9,
  /**/ iba,
  ibb,
  ibc,
  /**/ ibd,
  ibe,
  /**/ ibf,
  ic0,
  /**/ ic1,
  ic2,
  ic3,
  ic4,
  /**/ ic5,
  /**/ ic6,
  /**/ ic7,
  ic8 /**/,
  ic9,
  /**/ ica,
  icb,
  icc,
  /**/ icd,
  ice,
  /**/ icf,
  id0,
  /**/ id1,
  id2,
  id3,
  id4,
  id5,
  /**/ id6,
  /**/ id7,
  id8 /**/,
  id9,
  /**/ ida,
  idb,
  idc,
  idd,
  ide,
  /**/ idf,
  ie0,
  /**/ ie1,
  ie2,
  ie3,
  ie4,
  /**/ ie5,
  /**/ ie6,
  /**/ ie7,
  ie8 /**/,
  ie9,
  /**/ iea,
  /**/ ieb,
  iec,
  /**/ ied,
  iee,
  /**/ ief,
  if0,
  /**/ if1,
  if2,
  if3,
  if4,
  if5,
  /**/ if6,
  /**/ if7,
  if8 /**/,
  if9,
  /**/ ifa,
  ifb,
  /**/ ifc,
  ifd,
  ife,
  /**/ iff
);

// jumping ===================================================================================
export function i20(name) {
  pushReturnAddress();
  jump(name, "subroutine ");
  return;

  function pushReturnAddress() {
    let addrBeforeNextInstruction = exports.reg.PC + 1;
    // exports.reg.PC + 1 because we get a word, i.e., 2 byte in jump()
    exports.memory.pushWordToStack(new WordEntry(addrBeforeNextInstruction));
  }
}
export function i4c(name) {
  jump(name, "");
}
export function i6c(name) {
  jump(name, "");
  // ierr(name + ": [UNIMPL] jumping with absoluteIndirect addressingMode");
}
function jump(name, msg) {
  let addr = exports.memory.readWord(exports.reg.PC).value;
  exports.reg.PC = addr; // the actual jump to address
  consoleDebug({
    msg:
      name +
      ": jumping to " +
      msg +
      exports.labelAddresses.getLabel(exports.reg.PC) +
      fmtToHexWordBr(exports.reg.PC) +
      "[lineNo: " +
      exports.addressLineNumbers[exports.reg.PC].lineNumber +
      "]",
    bold: true,
  });
}
// returning ---------------------------------------------------------------------------------
export function i40(name) {
  // this actually should pop PC from stack and pop flags/processor state from stack
  consoleDebug({ msg: name + ": returning from interrupt", bold: true });
}
export function i60(name) {
  let returnAddr = exports.memory.popWordFromStack().value;
  exports.reg.PC = returnAddr;
  consoleDebug({
    msg:
      name +
      ": returning from subroutine to " +
      exports.labelAddresses.getLabel(exports.reg.PC) +
      fmtToHexWordBr(exports.reg.PC),
  });
}

// branching =================================================================================
export function i10(name) {
  jumpBranch({ type: "BPL", name: name });
}
export function i30(name) {
  jumpBranch({ type: "BMI", name: name });
}
export function i50(name) {
  jumpBranch({ type: "BVC", name: name });
}
export function i70(name) {
  jumpBranch({ type: "BVS", name: name });
}
export function i90(name) {
  jumpBranch({ type: "BCC", name: name });
}
export function ib0(name) {
  jumpBranch({ type: "BCS", name: name });
}
export function id0(name) {
  jumpBranch({ type: "BNE", name: name });
}
export function if0(name) {
  jumpBranch({ type: "BEQ", name: name });
}

function jumpBranch({ type = "", name = "" } = {}) {
  let conditions = {
    BCC: exports.flags.carry.isClear(),
    BCS: exports.flags.carry.isSet(),
    BNE: exports.flags.zero.isClear(),
    BEQ: exports.flags.zero.isSet(),
    BVC: exports.flags.overflow.isClear(),
    BVS: exports.flags.overflow.isSet(),
    BPL: exports.flags.negative.isClear(),
    BMI: exports.flags.negative.isSet(),
  };

  let offset = exports.memory.readByte(exports.reg.PC).value;
  exports.reg.PC++; // advance program counter
  if (!conditions[type]) {
    consoleDebug({
      msg:
        name +
        ": skipping branch, moving on to " +
        fmtToHexWord(exports.reg.PC),
    });
    return;
  }

  exports.reg.PC = getBranchAddress(offset); // the actual jump means setting the program counter
  consoleDebug({
    msg:
      name +
      ": branching to " +
      exports.labelAddresses.getLabel(exports.reg.PC) +
      fmtToHexWordBr(exports.reg.PC) +
      "[lineNo: " +
      exports.addressLineNumbers[exports.reg.PC].lineNumber +
      "]",
    bold: true,
  });
  return;

  function getBranchAddress(offset) {
    if (offset > 0x7f) {
      //0x7f = 127
      return exports.reg.PC - (0x100 - offset);
    }
    return exports.reg.PC + offset;
  }
}

// INC increment =============================================================================
export function ie8(name) {
  increment({ name: name, impliedRegister: "X" });
}
export function ic8(name) {
  increment({ name: name, impliedRegister: "Y" });
}
export function iee(name) {
  increment({ name: name, addrMode: "absolute" });
}
export function ife(name) {
  increment({ name: name, addrMode: "absoluteX" });
}
export function ie6(name) {
  increment({ name: name, addrMode: "zeroPage" });
}
export function if6(name) {
  increment({ name: name, addrMode: "zeroPageX" });
}

export function increment({
  name = "",
  addrMode = "",
  impliedRegister = "",
} = {}) {
  crement({
    type: "IN",
    name: name,
    addrMode: addrMode,
    impliedRegister: impliedRegister,
  });
  return;
}

// decrement =================================================================================
export function ica(name) {
  decrement({ name: name, impliedRegister: "X" });
}
export function i88(name) {
  decrement({ name: name, impliedRegister: "Y" });
}
export function ice(name) {
  decrement({ name: name, addrMode: "absolute" });
}
export function ide(name) {
  decrement({ name: name, addrMode: "absoluteX" });
}
export function ic6(name) {
  decrement({ name: name, addrMode: "zeroPage" });
}
export function id6(name) {
  decrement({ name: name, addrMode: "zeroPageX" });
}

function decrement({ name = "", addrMode = "", impliedRegister = "" } = {}) {
  crement({
    type: "DE",
    name: name,
    addrMode: addrMode,
    impliedRegister: impliedRegister,
  });
  return;
}

function crement({
  type = "",
  name = "",
  addrMode = "",
  impliedRegister = "X",
} = {}) {
  let value = exports.reg[impliedRegister];
  let valueName = "reg" + impliedRegister;
  let addr;

  if (!["X", "Y"].includes(impliedRegister)) {
    addr = getAddressingModeAddr({ addrMode: addrMode });
    let byteEntry = exports.memory.readByte(addr);
    value = byteEntry.value;
    valueName = fmtToHex(addr);
    if (addr in exports.addressLineNumbers) {
      valueName +=
        "[lineNo: " + exports.addressLineNumbers[addr].lineNumber + "]";
    }
  }

  let oldValue = value;

  if (type === "IN") {
    value = getLowerByte(++value);
  } else {
    // if (type === "DE")
    value = getLowerByte(--value);
  }
  consoleDebug({
    msg:
      name +
      ": " +
      type +
      "crement value at " +
      valueName +
      fmtToHexBr(oldValue) +
      " to " +
      fmtToHex(value),
  });

  exports.flags.toggleZeroAndNegative(value);
  if (["X", "Y"].includes(impliedRegister)) {
    exports.reg[impliedRegister] = value;
    return;
  }
  let lineNumber = addr;
  if (addr in exports.addressLineNumbers) {
    lineNumber = exports.addressLineNumbers[addr];
  }
  exports.memory.writeByte(
    addr,
    new WordEntry(value, lineNumber).lowerByteEntry
  );
  return addr;
}

// CMP: Compare Memory and Accumulator =======================================================
export function ic9(name) {
  compare({ name: name, addrMode: "immediate" });
}
export function icd(name) {
  compare({ name: name, addrMode: "absolute" });
}
export function idd(name) {
  compare({ name: name, addrMode: "absoluteX" });
}
export function id9(name) {
  compare({ name: name, addrMode: "absoluteY" });
}
export function ic5(name) {
  compare({ name: name, addrMode: "zeroPage" });
}
export function id5(name) {
  compare({ name: name, addrMode: "zeroPageX" });
}
export function ic1(name) {
  compare({ name: name, addrMode: "(zeroPage, X)" });
}
export function id1(name) {
  compare({ name: name, addrMode: "(zeroPage), Y" });
}
// CMP: Compare Memory and Index X
export function ie0(name) {
  compare({ name: name, register: "X", addrMode: "immediate" });
}
export function iec(name) {
  compare({ name: name, register: "X", addrMode: "absolute" });
}
export function ie4(name) {
  compare({ name: name, register: "X", addrMode: "zeroPage" });
}
// CMP: Compare Memory and Index Y
// TODO: Was this old code for ic0 wrong, because its inconsitent?
// if( (exports.reg.Y+value) > 0xff ) exports.flags.zero._set(); else exports.flags.zero.clear();
// value = (exports.reg.Y-value);
export function ic0(name) {
  compare({ name: name, register: "Y", addrMode: "immediate" });
}
export function icc(name) {
  compare({ name: name, register: "Y", addrMode: "absolute" });
}
export function ic4(name) {
  compare({ name: name, register: "Y", addrMode: "zeroPage" });
}

function compare({
  name = "",
  register = "A",
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let regValue = exports.reg[register];
  let addr = getAddressingModeAddr({
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
  let value = exports.memory.readByte(addr).value;

  consoleDebug({
    msg:
      name +
      ": compare reg" +
      register +
      "=" +
      fmtToHexBr(regValue) +
      " with " +
      fmtToHex(value),
  });
  let compareResult = compareTest(regValue, value);
  exports.flags.toggleZeroAndNegative(compareResult);
  return;

  function compareTest(regValue, value) {
    if (regValue >= value) {
      // Thanks, "Guest"
      exports.flags.zero._set();
    } else {
      exports.flags.zero.clear();
    }
    return regValue - value;
  }
}
// Logic AND memory with Accumulator==========================================================
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

function and({ name = "", addrMode = "", onlyLowerByte = false } = {}) {
  logicInstruction({
    type: "AND",
    name: name,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}
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

function or({ name = "", addrMode = "", onlyLowerByte = false } = {}) {
  logicInstruction({
    type: "ORA",
    name: name,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}
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

function xor({ name = "", addrMode = "", onlyLowerByte = false } = {}) {
  logicInstruction({
    type: "EOR",
    name: name,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}

function logicInstruction({
  type = "",
  name = "",
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let addr = getAddressingModeAddr({
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
  let value = exports.memory.readByte(addr).value;

  consoleDebug({
    msg:
      name +
      ": " +
      type +
      " on regA" +
      fmtToHexBr(exports.reg.A) +
      " and " +
      fmtToHex(value),
  });
  if (type === "AND") {
    value &= exports.reg.A;
  } else if (type === "ORA") {
    value |= exports.reg.A;
  } else if (type === "EOR") {
    value ^= exports.reg.A;
  }
  exports.flags.toggleZeroAndNegative(value);
  exports.reg.A = value;
  return;
}
// Shift and Rotate ===========================================================================
// arithmetic shift one bit left
export function i0a(name) {
  shiftLeft({ name: name, accumulator: true });
}
export function i0e(name) {
  shiftLeft({ name: name, addrMode: "absolute" });
}
export function i1e(name) {
  shiftLeft({ name: name, addrMode: "absoluteX" });
}
export function i06(name) {
  shiftLeft({ name: name, addrMode: "zeroPage" });
}
export function i16(name) {
  shiftLeft({ name: name, addrMode: "zeroPageX" });
}

function shiftLeft({
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  shift({
    type: "LEFT",
    name: name,
    accumulator: accumulator,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}
//logical shift right one bit
export function i4a(name) {
  shiftRight({ name: name, accumulator: true });
}
export function i4e(name) {
  shiftRight({ name: name, addrMode: "absolute" });
}
export function i5e(name) {
  shiftRight({ name: name, addrMode: "absoluteX" });
}
export function i46(name) {
  shiftRight({ name: name, addrMode: "zeroPage" });
}
export function i56(name) {
  shiftRight({ name: name, addrMode: "zeroPageX" });
}

function shiftRight({
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  shift({
    type: "RIGHT",
    name: name,
    accumulator: accumulator,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}

function shift({
  type = "",
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let value = exports.reg.A;
  let addr;
  if (!accumulator) {
    addr = getAddressingModeAddr({
      addrMode: addrMode,
      onlyLowerByte: onlyLowerByte,
    });
    value = exports.memory.readByte(addr).value;
  }

  let oldValue = value;
  let byte;
  if (type === "LEFT") {
    byte = exports.flags.getByteClearedOn("carry") | ((value >> 7) & 1);
    exports.flags.setFromByte(byte);
    value <<= 1;
  } else {
    byte = exports.flags.getByteClearedOn("carry") | (value & 1);
    value >>= 1;
  }
  exports.flags.setFromByte(byte);

  consoleDebug({
    msg:
      name +
      ": shifting " +
      fmtToHex(oldValue) +
      " " +
      type +
      " to " +
      fmtToHex(value),
  });

  exports.flags.toggleZeroAndNegative(value);
  if (accumulator) {
    exports.reg.A = value;
    return;
  }
  let lineNumber = addr;
  if (addr in exports.addressLineNumbers) {
    lineNumber = exports.addressLineNumbers[addr];
  }
  exports.memory.writeByte(
    addr,
    new WordEntry(value, lineNumber).lowerByteEntry
  );
  return addr;
}
// rotate left one bit
export function i2a(name) {
  rotateLeft({ name: name, accumulator: true });
}
export function i2e(name) {
  rotateLeft({ name: name, addrMode: "absolute" });
}
export function i3e(name) {
  rotateLeft({ name: name, addrMode: "absoluteX" });
}
export function i26(name) {
  rotateLeft({ name: name, addrMode: "zeroPage" });
}
export function i36(name) {
  rotateLeft({ name: name, addrMode: "zeroPageX" });
}

function rotateLeft({
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  rotate({
    type: "LEFT",
    name: name,
    accumulator: accumulator,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}
// rotate right one bit
export function i6a(name) {
  rotateRight({ name: name, accumulator: true });
}
export function i6e(name) {
  rotateRight({ name: name, addrMode: "absolute" });
}
export function i7e(name) {
  rotateRight({ name: name, addrMode: "absoluteX" });
}
export function i66(name) {
  rotateRight({ name: name, addrMode: "zeroPage" });
}
export function i76(name) {
  rotateRight({ name: name, addrMode: "zeroPageX", onlyLowerByte: true });
}

function rotateRight({
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  rotate({
    type: "RIGHT",
    name: name,
    accumulator: accumulator,
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
}
function rotate({
  type = "",
  name = "",
  accumulator = false,
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let value = exports.reg.A;
  let addr;
  if (!accumulator) {
    addr = getAddressingModeAddr({
      addrMode: addrMode,
      onlyLowerByte: onlyLowerByte,
    });
    value = exports.memory.readByte(addr).value;
  }

  let oldValue = value;
  let byte;
  if (type === "LEFT") {
    byte = exports.flags.getByteClearedOn("carry") | ((value >> 7) & 1);
    value = (value << 1) | exports.flags.carry.value;
  } else {
    byte = exports.flags.getByteClearedOn("carry") | (value & 1);
    value >>= 1;
    if (exports.flags.carry.isSet()) {
      value |= 0x80;
    }
  }
  exports.flags.setFromByte(byte);

  consoleDebug({
    msg:
      name +
      ": shifting " +
      fmtToHex(oldValue) +
      " " +
      type +
      " to " +
      fmtToHex(value),
  });

  exports.flags.toggleZeroAndNegative(value);
  if (accumulator) {
    exports.reg.A = value;
    return;
  }
  let lineNumber = addr;
  if (addr in exports.addressLineNumbers) {
    lineNumber = exports.addressLineNumbers[addr];
  }
  exports.memory.writeByte(
    addr,
    new WordEntry(value, lineNumber).lowerByteEntry
  );
  return addr;
}
// Arithmetic =================================================================================
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
// LOAD and S==================================================================================
// load accumulator with memory LDA
export function ia9(name) {
  load({ name: name, addrMode: "immediate" });
}
export function iad(name) {
  load({ name: name, addrMode: "absolute" });
}
export function ibd(name) {
  load({ name: name, addrMode: "absoluteX" });
}
export function ib9(name) {
  load({ name: name, addrMode: "absoluteY" });
}
export function ia5(name) {
  load({ name: name, addrMode: "zeroPage" });
}
export function ib5(name) {
  load({ name: name, addrMode: "zeroPageX", onlyLowerByte: true });
}
// TODO: why do we bytecut here?
export function ia1(name) {
  load({ name: name, addrMode: "(zeroPage, X)" });
}
export function ib1(name) {
  load({ name: name, addrMode: "(zeroPage), Y" });
}

// load index X with memory
export function ia2(name) {
  load({ name: name, register: "X", addrMode: "immediate" });
}
export function iae(name) {
  load({ name: name, register: "X", addrMode: "absolute" });
}
export function ibe(name) {
  load({ name: name, register: "X", addrMode: "absoluteY" });
}
export function ia6(name) {
  load({ name: name, register: "X", addrMode: "zeroPage" });
}
export function ib6(name) {
  load({ name: name, register: "X", addrMode: "zeroPageY" });
}

// load index Y with memory
export function ia0(name) {
  load({ name: name, register: "Y", addrMode: "immediate" });
}
export function iac(name) {
  load({ name: name, register: "Y", addrMode: "absolute" });
}
export function ibc(name) {
  load({ name: name, register: "Y", addrMode: "absoluteX" });
}
export function ia4(name) {
  load({ name: name, register: "Y", addrMode: "zeroPage" });
}
export function ib4(name) {
  load({ name: name, register: "Y", addrMode: "zeroPageX" });
}

function load({
  name = "",
  register = "A",
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let addr = getAddressingModeAddr({
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
  let value = exports.memory.readByte(addr).value;
  let lineNumber = fmtToHex(addr);

  if (addr in exports.addressLineNumbers) {
    lineNumber +=
      "[lineNo: " + exports.addressLineNumbers[addr].lineNumber + "]";
  }

  consoleDebug({
    msg:
      name +
      ": loading value from addr " +
      lineNumber +
      "=" +
      fmtToHex(value) +
      " to reg" +
      register,
  });
  exports.reg[register] = value;
  exports.flags.toggleZeroAndNegative(value);
  return;
}
// store accumulator in memory
export function i8d(name) {
  return store({ name: name, addrMode: "absolute" });
}
export function i9d(name) {
  return store({ name: name, addrMode: "absoluteX" });
}
export function i99(name) {
  return store({ name: name, addrMode: "absoluteY" });
}
export function i85(name) {
  return store({ name: name, addrMode: "zeroPage" });
}
export function i95(name) {
  return store({ name: name, addrMode: "zeroPageX" });
}
export function i81(name) {
  return store({ name: name, addrMode: "(zeroPage, X)" });
}
export function i91(name) {
  return store({ name: name, addrMode: "(zeroPage), Y" });
}

// store index X in memory
export function i8e(name) {
  return store({ name: name, register: "X", addrMode: "absolute" });
}
export function i86(name) {
  return store({ name: name, register: "X", addrMode: "zeroPage" });
}
export function i96(name) {
  return store({ name: name, register: "X", addrMode: "zeroPageY" });
}

// store index Y in memory
export function i8c(name) {
  return store({ name: name, register: "Y", addrMode: "absolute" });
}
export function i84(name) {
  return store({ name: name, register: "Y", addrMode: "zeroPage" });
}
export function i94(name) {
  return store({ name: name, register: "Y", addrMode: "zeroPageX" });
}

function store({
  name = "",
  register = "A",
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let addr = getAddressingModeAddr({
    addrMode: addrMode,
    onlyLowerByte: onlyLowerByte,
  });
  let lineNumber = addr;
  if (addr in exports.addressLineNumbers) {
    lineNumber = exports.addressLineNumbers[addr].lineNumber;
  }
  let byteEntry = new WordEntry(exports.reg[register], lineNumber)
    .lowerByteEntry;
  exports.memory.writeByte(addr, byteEntry);

  let msg =
    name +
    ": storing reg" +
    register +
    "=" +
    fmtToHexBr(byteEntry.value) +
    " to addr " +
    fmtToHexWord(addr);
  if (addr in exports.addressLineNumbers) {
    msg += "[lineNo: " + exports.addressLineNumbers[addr].lineNumber + "]";
  }

  if (exports.debug) {
    adjustTextLine(addr, lineNumber);
  }

  consoleDebug({ msg: msg });
  return addr;

  function adjustTextLine(addr, lineNumber) {
    if (addr in exports.addressLineNumbers) {
      let line = exports.editor.state.doc.line(lineNumber);
      let lastLineText = line.text;
      let label = "";
      if (hasLabel(lastLineText)) {
        label = lastLineText.replace(/^(\w*:).*$/, "$1");
      }
      lastLineText = lastLineText.replace(/^\w+:(.*)/, "$1");
      let lineLeadSpace = lastLineText.replace(/^(\s*).*/, "$1");
      lastLineText = lastLineText.replace(/^\s+/, "");
      lastLineText = lastLineText.replace(/\s+$/, "");

      let lastLineTextInstruction = lastLineText.replace(/(\w+)\s*.*/, "$1");
      let lastLineTextRemainder = lastLineText.replace(/\w+\s*(\w*)/, "$1");
      let lastLineToChange = lastLineTextInstruction;

      if (exports.addressLineNumbers[addr].isInstruction) {
        exports.editor.dispatch({
          changes: {
            from: line.from,
            to: line.to,
            insert:
              label +
              lineLeadSpace +
              Command.getOpCodeName(byteEntry.value) +
              " " +
              lastLineTextRemainder +
              " [" +
              lastLineTextInstruction +
              " " +
              lastLineTextRemainder +
              "]",
          },
        });
      } else {
        exports.editor.dispatch({
          changes: {
            from: line.from,
            to: line.to,
            insert:
              label +
              lineLeadSpace +
              lastLineTextInstruction +
              " " +
              fmtToHex(byteEntry.value) +
              " [" +
              lastLineTextInstruction +
              " " +
              lastLineTextRemainder +
              "]",
          },
        });
      }
    }

    return;
  }

  function hasLabel(line) {
    if (line.match(/^(\w+):.*$/)) {
      return true;
    }
    return false;
  }
}

export function getAddressingModeAddr({
  addrMode = "",
  onlyLowerByte = false,
} = {}) {
  let zp;
  let addr;
  if (addrMode == "immediate") {
    addr = exports.reg.PC;
    exports.reg.PC++; //advance program counter;
    return addr;
  }

  switch (addrMode) {
    case "absolute":
    case "absoluteX":
    case "absoluteY":
      addr = exports.memory.readWord(exports.reg.PC).value;
      exports.reg.PC += 2; //advance program counter by 2 = #byte in word
      break;
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

// Test bits in memory with accumulator =======================================================
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

// Transfer [implied addressing mode]==========================================================
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

// Stack [addressing Mode: implied]============================================================
export function i08(name) {
  pushInstruction(name, "P");
}
export function i28(name) {
  pullInstruction(name, "P");
}
export function i48(name) {
  pushInstruction(name, "A");
}
export function i68(name) {
  pullInstruction(name, "A");
}

function pushInstruction(name, register) {
  let byte = exports.reg.A;
  let valueName = "regA/accumulator=" + fmtToHexBr(exports.reg.A);
  if (register !== "A") {
    byte = exports.flags.byte;
    valueName = "regP/processor status=" + fmtToHexBr(byte);
  }
  consoleDebug({ msg: name + ": pushing " + valueName + " to Stack" });
  exports.memory.pushByteToStack(new ByteEntry(byte));
}
function pullInstruction(name, register = "A") {
  let valueName;
  let byte = exports.memory.popByteFromStack().value;
  if (register === "A") {
    exports.reg.A = byte;
    valueName = "regA/accumulator=" + fmtToHexBr(exports.reg.A);
    exports.flags.toggleZeroAndNegative(exports.reg.A);
  } else {
    exports.flags.setFromByte(byte);
    valueName = "regP/processor status=" + fmtToHexBr(exports.flags.byte);
  }
  consoleDebug({ msg: name + ": pulling " + valueName + " from Stack" });
}
// Set and Clear [implied addressing mode]=====================================================
// TODO: i58 and i78 are not implemented?
export function i58(name) {
  exports.flags.clear();
  console.warn(name + ": clearing interrupt disable status");
}
export function i78(name) {
  exports.flags._set();
  console.warn(name + ": setting interrupt disable status");
}
export function i18(name) {
  clearFlag(name, "carry");
}
export function i38(name) {
  setFlag(name, "carry");
}
export function id8(name) {
  clearFlag(name, "decimal");
}
export function if8(name) {
  setFlag(name, "decimal");
}
export function ib8(name) {
  clearFlag(name, "overflow");
}
// clearValue + SetValue = 0xff = 255
function clearFlag(name, flagName) {
  consoleDebug({ msg: name + ": clearing " + flagName + " flag" });
  exports.flags[flagName].clear();
}
function setFlag(name, flagName) {
  consoleDebug({ msg: name + ": setting " + flagName + " flag" });
  exports.flags[flagName]._set();
}

// Miscellaneous ==============================================================================
export function i00(name) {
  // implied
  exports.codeRunning = false;
  exports.flags.break._set();
  exports.flags.interruptDisable._set();
  consoleDebug({ msg: name + "BRK : Forcing interrupt" });
}

export function iea(name) {
  // implied
  consoleDebug({ msg: name + ": NOOP" });
}
// undefined opcodes ==========================================================================

export function i1a(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // NOP implied
export function i3a(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // NOP implied
export function i5a(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // NOP implied
export function i7a(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // NOP implied
export function ida(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // NOP implied
export function ifa(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // NOP implied

export function i04(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp
export function i14(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp,X
export function i34(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp,X
export function i44(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp
export function i54(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp,X
export function i64(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp
export function i74(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp,X
export function i80(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP imm
export function i82(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP imm
export function i89(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP imm
export function ic2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP imm
export function id4(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp,X
export function ie2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP imm
export function if4(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DOP zp,X

export function i0c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // TOP abs
export function i1c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // TOP abs,X
export function i3c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // TOP abs,X
export function i5c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // TOP abs,X
export function i7c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // TOP abs,X
export function idc(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // TOP abs,X
export function ifc(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // TOP abs,X

export function i02(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function i12(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function i22(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function i32(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function i42(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function i52(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function i62(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function i72(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function i92(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function ib2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function id2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied
export function if2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // KIL implied

// --------------------------------------------------------------------------------------------
export function i0b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AAC immediate
export function i2b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AAC immediate

export function i87(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AAX zp
export function i97(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AAX zp, Y
export function i83(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AAX (indirect, Y)
export function i8f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AAX abs

export function i6b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ARR immediate

export function i4b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ASR immediate

export function iab(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ATX immediate

export function i9f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AXA abs, y
export function i93(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AXA (ind), Y

export function icb(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // AXS

export function ic7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP zp
export function id7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP zp, X
export function icf(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP abs
export function idf(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP abs, X
export function idb(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP abs, Y
export function ic3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP (ind, X)
export function id3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP (ind), Y

export function ie7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC zp
export function if7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC zp, X
export function ief(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC abs
export function iff(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC abs,X
export function ifb(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC abs,Y
export function ie3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC (ind,X)
export function if3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC (ind), Y

export function ibb(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // LAR abs,y

export function ia7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // LAX zp
export function ib7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // LAX zp,Y
export function iaf(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // LAX abs
export function ibf(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // LAX abs,Y
export function ia3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // LAX (ind, X)
export function ib3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // LAX (ind), Y

export function i27(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA zp
export function i37(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA zp,X
export function i2f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA abs
export function i3f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA abs,X
export function i3b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA abs,Y
export function i23(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA (ind,X)
export function i33(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA (ind), Y

export function i67(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA zp
export function i77(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA zp,X
export function i6f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA abs
export function i7f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA abs,X
export function i7b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA abs,Y
export function i63(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA (ind, X)
export function i73(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA (ind), Y

export function ieb(name) {
  ie9(name);
} // same as ie9, SUB immediate

export function i07(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO zp
export function i17(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO zp,X
export function i0f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO abs
export function i1f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO abs,X
export function i1b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO abs,Y
export function i03(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO (ind, X)
export function i13(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO (ind), Y

export function i47(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE zp
export function i57(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE zp,X
export function i4f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE abs
export function i5f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE abs,X
export function i5b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE abs,Y
export function i43(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE (ind, X)
export function i53(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE (ind), Y

export function i9e(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SXA abs, Y

export function i9c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SYA abs, X

export function i8b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // XAA exact operation unknown

export function i9b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // XAS abs,Y

function ierr(name) {
  let message = name + " illegal Opcode not allowed, skipping";
  raiseRunTimeError(fmtToHexWord(exports.reg.PC - 1), message);
  console.warn(message);
}
