class Flag {
  constructor({ set = false } = {}) {
    this.set = set;
  }
  isSet() {
    return this.set;
  }
  isClear() {
    return !this.set;
  }

  _set() {
    this.set = true;
  }

  setByValue(value) {
    if (value === 1) {
      this.set = true;
      return;
    }
    this.set = false;
  }

  clear() {
    this.set = false;
  }

  get value() {
    if (this.set) {
      return 0x1;
    }
    return 0x0;
  }
}

export class Flags {
  constructor() {
    this.negative = new Flag();
    this.overflow = new Flag();
    this.unused = new Flag({ set: true });
    this.break = new Flag();
    this.decimal = new Flag();
    this.interruptDisable = new Flag();
    this.zero = new Flag();
    this.carry = new Flag();
  }
  clearAll() {
    this.negative.clear;
    this.overflow.clear;
    this.unused.set; // unused is always one according to 6502 specs
    this.break.clear;
    this.decimal.clear;
    this.interruptDisable.clear;
    this.zero.clear;
    this.carry.clear;
  }

  get byte() {
    return (
      (this.negative.value << 7) +
      (this.overflow.value << 6) +
      (this.unused.value << 5) +
      (this.break.value << 4) +
      (this.decimal.value << 3) +
      (this.interruptDisable.value << 2) +
      (this.zero.value << 1) +
      this.carry.value
    );
  }

  getByteClearedOn(flagName) {
    let byte = this.byte;
    switch (
      flagName //                               NV-B DIZC
    ) {
      case "negative":
        return byte & 0x7f; // 0b0111 1111
      case "overflow":
        return byte & 0xbf; // 0b1011 1111
      case "unused":
        return byte & 0xdf; // 0b1101 1111
      case "break":
        return byte & 0xef; // 0b1110 1111
      case "decimal":
        return byte & 0xf7; // 0b1111 0111
      case "interruptDisable":
        return byte & 0xfb; // 0b1111 1011
      case "zero":
        return byte & 0xfd; // 0b1111 1101
      case "carry":
        return byte & 0xfe; // 0b1111 1110
    }
  }

  getByteClearedOnNandV() {
    return this.byte & 0x7f & 0xbf;
  }

  setFromByte(byte) {
    this.negative.setByValue(getBit(byte, 7));
    this.overflow.setByValue(getBit(byte, 6));
    this.unused._set(); // unused is always one according to 6502 specs
    this.break.setByValue(getBit(byte, 4));
    this.decimal.setByValue(getBit(byte, 3));
    this.interruptDisable.setByValue(getBit(byte, 2));
    this.zero.setByValue(getBit(byte, 1));
    this.carry.setByValue(getBit(byte, 0));

    return;

    function getBit(byte, position) {
      return (byte >> position) & 1;
    }
  }

  toggleZeroAndNegative(value) {
    if (value) {
      this.zero.clear();
    } else {
      this.zero._set();
    }
    if (value & 0x80) {
      // 128 = 0b1000 0000 means sign bit is set
      this.negative._set();
    } else {
      this.negative.clear();
    }
    return;
  }
}
Flags.prototype.toString = function () {
  let msg =
    "Flag content" +
    "\nFlagName          Value" +
    "\nNegative          [" +
    this.negative.value +
    "]" +
    "\nOverflow          [" +
    this.overflow.value +
    "]" +
    "\nUnused            [" +
    this.unused.value +
    "]" +
    "\nBreak             [" +
    this.break.value +
    "]" +
    "\nDecimal           [" +
    this.decimal.value +
    "]" +
    "\nInterruptDisable  [" +
    this.interruptDisable.value +
    "]" +
    "\nZero              [" +
    this.zero.value +
    "]" +
    "\nCarry             [" +
    this.carry.value +
    "]";
  console.log(msg);
};
