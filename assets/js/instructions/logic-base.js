import { fmtToHex, fmtToHexBr, fmtToHexWord } from "../helper";
import { consoleDebug, raiseRunTimeError } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";
import { ByteEntry } from "../memory";

export function logicInstructionOnRegAWithMemoryResultToRegA({
  type = "",
  typeName = "",
  name = "",
  addrMode = "",
} = {}) {
  const addr = getAddressingModeAddr({ addrMode: addrMode });
  const value = exports.memory.readByte(addr).value;

  exports.reg.A = logicInstructionOnRegA({
    value: value,
    valueName: "memory",
    type: type,
    typeName: typeName,
    name: name,
  });
  return;
}

export function logicInstructionOnRegAWithMemoryReturnResult({
  type = "",
  typeName = "",
  name = "",
  addrMode = "",
} = {}) {
  const addr = getAddressingModeAddr({ addrMode: addrMode });
  const value = exports.memory.readByte(addr).value;

  return logicInstructionOnRegA({
    value: value,
    valueName: "memory",
    type: type,
    typeName: typeName,
    name: name,
  });
}

export function logicInstructionOnRegAWithRegXResultToRegA({
  type = "",
  typeName = "",
  name = "",
} = {}) {
  exports.reg.A = logicInstructionOnRegA({
    value: exports.reg.X,
    valueName: "regX",
    type: type,
    typeName: typeName,
    name: name,
  });

  return;
}

export function logicInstructionOnRegAWithRegXResultToRegX({
  type = "",
  typeName = "",
  name = "",
} = {}) {
  exports.reg.X = logicInstructionOnRegA({
    value: exports.reg.X,
    valueName: "regX",
    type: type,
    typeName: typeName,
    name: name,
  });

  return;
}

export function logicInstructionOnRegAWithRegXResultToAddr({
  type = "",
  typeName = "",
  name = "",
  addrMode = "",
} = {}) {
  const value = logicInstructionOnRegA({
    value: exports.reg.X,
    valueName: "regX",
    type: type,
    typeName: typeName,
    name: name,
  });

  const addr = getAddressingModeAddr({ addrMode: addrMode });
  exports.memory.writeByte(addr, new ByteEntry(value));
  return;
}

export function logicInstructionOnRegAWithRegXReturnResult({
  type = "",
  typeName = "",
  name = "",
} = {}) {
  return logicInstructionOnRegA({
    value: exports.reg.X,
    valueName: "regX",
    type: type,
    typeName: typeName,
    name: name,
  });
}

function logicInstructionOnRegA({
  value = null,
  valueName = "",
  type = "",
  typeName = "",
  name = "",
} = {}) {
  return logicInstruction({
    valueA: exports.reg.A,
    valueAName: "regA",
    valueB: value,
    valueBName: valueName,
    type: type,
    typeName: typeName,
    name: name,
  });
}

export function logicInstruction({
  valueA = null,
  valueAName = "",
  valueB = null,
  valueBName = "",
  type = "",
  typeName = "",
  name = "",
} = {}) {
  if (valueA == null || valueB == null) {
    const errorMsg =
      "logicInstruction of " +
      type +
      typeName +
      " has null value, valueA[" +
      valueA +
      "], valueB[" +
      valueB +
      "]";
    raiseRunTimeError(fmtToHexWord(exports.reg.PC - 1), errorMsg);
  }
  consoleDebug({
    msg:
      name +
      ": " +
      type +
      typeName +
      " on " +
      valueAName +
      fmtToHexBr(valueA) +
      " and " +
      valueBName +
      fmtToHexBr(valueB),
  });

  switch (type) {
    case "AND":
      valueA &= valueB;
      break;
    case "ORA":
      valueA |= valueB;
      break;
    case "EOR":
      valueA ^= valueB;
      break;
  }
  exports.flags.toggleZeroAndNegative(valueA);
  return valueA;
}
