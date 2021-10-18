// helper
export function fmtToHexBr(value) {
  return "[" + fmtToHexIntern(value) + "]";
}

export function fmtToHex(value) {
  return "0x" + value.toString(16).padStart(2, 0);
}

function fmtToHexIntern(value) {
  return "0x" + value.toString(16).padStart(2, 0);
}

export function fmtToHexWord(value) {
  return "0x" + value.toString(16).padStart(4, 0);
}

function fmtToHexWordIntern(value) {
  return "0x" + value.toString(16).padStart(4, 0);
}

export function fmtToHexWordBr(value) {
  return "[" + fmtToHexWordIntern(value) + "]";
}

export function fmtToBin(value) {
  return value.toString(2).padStart(8, 0);
}
export function getLowerByte(value) {
  return value & 0xff;
}
export function getUpperByte(value) {
  return (value >> 8) & 0xff;
}
