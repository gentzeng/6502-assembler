import { getLowerByte, fmtToHex } from "./helper";
import { Command } from "./compiler";
import { raiseStackEmpty, raiseStackOverflow } from "./message";

export class Memory extends Array {
  constructor() {
    super(0xa28); // 0xa28 = 0x600 + 0x3ff is maximum memory size
    this.regSP = 0x100;
    this.size = 0xa28;
    this.defaultCodePC = 0x600;
    for (let codePC = 0x0; codePC < this.size; codePC++) {
      this[codePC] = new ByteEntry(0x00, -1);
    }
  }

  reset() {
    for (let x = 0; x < this.size; x++) {
      // clear ZeroPage and Stack
      this[x] = 0x00;
    }
    this._regSP = 0x100;
    this.defaultCodePC = 0x600;
  }

  // generell memory setter and getter --------------------------------------------------------
  readWord(address) {
    let lowerByteEntry = this.readByte(address);
    let lowerByte = lowerByteEntry.value;
    let upperByte = this.readByte(address + 1).value;
    let word = (upperByte << 8) + lowerByte;
    return new WordEntry(word, lowerByteEntry.lineNumber);
  }

  readByte(address) {
    let memoryEntry = this[address];
    if (!(memoryEntry instanceof MemoryEntry)) {
      // pseudo type checking
      throw (
        "TypeError: memoryEntry[" +
        memoryEntry +
        "] at address [" +
        fmtToHex(address) +
        "] is not of type MemoryEntry"
      );
    }

    if (!(memoryEntry instanceof LabelEntry)) {
      // for label insertion
      memoryEntry = memoryEntry.lowerByteEntry; // make sure, this is a byte
    }

    return memoryEntry;
  }

  pushWord(wordEntry) {
    this.pushByte(wordEntry.lowerByteEntry);
    this.pushByte(wordEntry.upperByteEntry);
  }

  pushByte(byteEntry) {
    this.writeByte(this.defaultCodePC, byteEntry);

    let isInstruction = false;
    if (byteEntry instanceof OpCodeByteEntry) {
      isInstruction = true;
    }
    exports.addressLineNumbers[this.defaultCodePC] = {
      lineNumber: byteEntry.lineNumber,
      isInstruction: isInstruction,
    };
    this.defaultCodePC++;
  }

  writeWord(address, wordEntry) {
    this.writeByte(address, wordEntry.lowerByteEntry);
    this.writeByte(address + 1, wordEntry.upperByteEntry);
  }

  writeByte(address, memoryEntry) {
    if (!(memoryEntry instanceof MemoryEntry)) {
      // pseudo type checking
      throw (
        "TypeError: memoryEntry[" + memoryEntry + "] is not of type MemoryEntry"
      );
    }
    if (memoryEntry.isNaN()) {
      throw "Value for address " + fmtToHex(address) + " is NaN!";
    }
    if (!(memoryEntry instanceof LabelEntry)) {
      // for label insertion
      memoryEntry = memoryEntry.lowerByteEntry;
    }
    this[address] = memoryEntry;
  }

  // stack setter and getter ------------------------------------------------------------------
  popByteFromStack() {
    if (this.regSP < 0x100) {
      let addr = this.regSP + 0x100;
      let byteEntry = this.readByte(addr);
      this.regSP++; // stack shrinks forwards
      return byteEntry;
    } else {
      raiseStackEmpty("", "");
      exports.codeRunning = false;
      return 0;
    }
  }

  popWordFromStack() {
    let lowerByteEntry = this.popByteFromStack();
    let lowerByte = lowerByteEntry.value + 1;
    let upperByte = this.popByteFromStack().value;
    let word = (upperByte << 8) + lowerByte;
    return new WordEntry(word, lowerByteEntry.lineNumber);
  }

  pushByteToStack(byteEntry) {
    if (this.regSP >= 0) {
      this.regSP--; // stack grows backwards
      let addr = getLowerByte(this.regSP) + 0x100;
      this.writeByte(addr, byteEntry.lowerByteEntry);
    } else {
      raiseStackOverflow("", "Stack full: " + this.regSP);
      exports.codeRunning = false;
    }
  }

  pushWordToStack(wordEntry) {
    this.pushByteToStack(wordEntry.upperByteEntry);
    this.pushByteToStack(wordEntry.lowerByteEntry);
  }

  dumpHTML() {
    let dump = "";
    this.forEach((memoryEntry, address) => {
      dump += "<br/>";
      if (address == 1536) {
        dump += "<b>Begin of code area</b>";
        dump += "<br/>";
      }
      dump += "  " + fmtToHex(address) + " : " + memoryEntry.toString();
    });
    return dump;
  }
}
Memory.prototype.toString = function () {
  let info = "Memory content: \n";
  this.slice(0x600).forEach((memoryEntry, address) => {
    address += 0x600;
    info += "  " + fmtToHex(address) + " : " + memoryEntry.toString() + "\n";
  });
  return info;
};

export class MemoryEntry {
  constructor(value) {
    this.value = value;
  }

  isNaN() {
    if (this.value != this.value) {
      //if NaN
      return true;
    }
    return false;
  }
}

export class LabelEntry extends MemoryEntry {
  constructor(value, lineNumber) {
    super(value);
    this.lineNumber = lineNumber;
  }
}
LabelEntry.prototype.toString = function () {
  return "LabelEntry      : " + this.value;
};

export class ByteEntry extends MemoryEntry {
  constructor(value, lineNumber) {
    super(value & 0xff);
    this.lineNumber = lineNumber;
  }

  get lowestNibble() {
    return this.value & 0x0f;
  }

  get lowerByteEntry() {
    return this;
  }
}
ByteEntry.prototype.toString = function () {
  return (
    "      ByteEntry : " +
    fmtToHex(this.value) +
    lineNumberToString.bind(this)()
  );

  function lineNumberToString() {
    if (this.value === this.lineNumber) {
      return "                   ";
    }
    if (typeof this.lineNumber === "undefined") {
      return "                   ";
    }
    if (this.lineNumber < 0) {
      return "                   ";
    }
    return "       at line " + this.lineNumber.toString().padStart(4, " ");
  }
};

export class OpCodeByteEntry extends MemoryEntry {
  constructor(value, lineNumber) {
    super(value);
    this.lineNumber = lineNumber;
  }

  get lowerByteEntry() {
    return new OpCodeByteEntry(this.value & 0xff, this.lineNumber);
  }
}
OpCodeByteEntry.prototype.toString = function () {
  return (
    "OpCodeByteEntry : " +
    fmtToHex(this.value) +
    " [" +
    Command.getOpCodeName(this.value) +
    "] at line " +
    this.lineNumber.toString().padStart(4, " ")
  );
};

export class WordEntry extends MemoryEntry {
  constructor(value, lineNumber) {
    super(value);
    this.lineNumber = lineNumber;
  }

  get lowerByte() {
    return this.value & 0xff;
  }

  get lowerByteEntry() {
    return new ByteEntry(this.lowerByte, this.lineNumber);
  }

  get upperByte() {
    return (this.value >> 8) & 0xff;
  }

  get upperByteEntry() {
    return new ByteEntry(this.upperByte, this.lineNumber);
  }
}
WordEntry.prototype.toString = function () {
  return "WordEntry       : " + fmtToHex(this.value) + ")";
};
