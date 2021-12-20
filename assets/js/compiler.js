import {
  Memory,
  ByteEntry,
  WordEntry,
  LabelEntry,
  OpCodeByteEntry,
} from "./memory";
import {
  printMessage,
  raiseError,
  raiseLabelError,
  raiseSyntaxError,
  raiseRangeError,
  raiseDCBValueError,
  raiseAddressingModeError,
} from "./message";

import { fmtToHex } from "./helper";

export class Compiler {
  constructor(plainCode) {
    this.plainCode = plainCode;
    this.codeLen = 0;
    this.codeLines = new Array();
    this.labelAddresses = new LabelAddresses();
    this.memory = new Memory();
  }

  preprocessCode() {
    let code = this.plainCode;
    code += "\n\n";
    code = code.split("\n");
    code.forEach((line, lineNumber) => {
      line = removeComments(line);
      line = trimLine(line);
      this.codeLines.push(new CodeLine(line, lineNumber + 1));
    });
    return this;

    // helper
    function removeComments(line) {
      return line.replace(/^(.*?);.*/, "$1");
    }
    function trimLine(line) {
      line = line.replace(/^\s+/, "");
      line = line.replace(/\s+$/, "");
      return line;
    }
  }

  scanLabels() {
    this.codeLines.forEach((codeLine) => {
      codeLine.scanLabel(this.labelAddresses);
    });
    this.labelAddresses.printLabelCount();
    return this;
  }

  compile() {
    let lineBeforeThisWasAddressOnly = false;
    this.codeLines.forEach((codeLine) => {
      let codeLen = codeLine.compileLine({
        memory: this.memory,
        lineBeforeThisWasAddressOnly: lineBeforeThisWasAddressOnly,
      });
      if (codeLen >= 0) {
        this.codeLen += codeLen;
        lineBeforeThisWasAddressOnly = false;
      } else {
        // do not count, if there was a line with only an address directly before this line
        lineBeforeThisWasAddressOnly = true;
      }
    });
    // insert 0x00 at largest used memory address to mark end of memory
    this.memory.writeByte(0xa28, new ByteEntry(0x00, -1));

    return this;
  }

  insertLabelAddressesToMemory() {
    if (this.noCode()) {
      return this;
    }
    for (let codePC = 0x600; codePC < 0xa28; codePC++) {
      this.labelAddresses.insertToMemory(codePC, this.memory);
    }

    return this;
  }

  noCode() {
    if (this.codeLines.every((v) => v.noCode() === true)) {
      return true;
    }
    return false;
  }
}

class CodeLine {
  constructor(content, number) {
    this.content = content;
    this.number = number;
    this.labelAddresses;
    this.regExp = {
      addressOnly: /^\*[\s]*=[\s]*([\$]?[0-9a-f]*)$/,
      label: /^(\w+):.*$/,
      commandWithLeadLabel: /^\w+:\s*(\w+)\s*.*$/,
      command: /^(\w\w\w)\s*.*$/,
      paramWithLeadLabel: /^\w+:\s*\w+\s+(.*?)/,
      param: /^\w\w\w+\s+(.*?)/,
    };
  }

  scanLabel(labelAddresses) {
    this.labelAddresses = labelAddresses;
    if (this.#isLabel()) {
      if (this.label in this.labelAddresses) {
        let defLineNumber = this.labelAddresses[this.label].lineNumber;
        raiseLabelError(
          codeLine.number,
          "Label '" + this.label + "' already defined at line " + defLineNumber
        );
        return;
      }
      // Use label as Address provisionaly => will be read correctly later!
      labelAddresses[this.label] = new LabelAddress(this.label, this.number);
    }
    return;
  }

  compileLine({ memory, lineBeforeThisWasAddressOnly = false } = {}) {
    if (this.#isBlank()) {
      return 0;
    }
    if (this.#isOnlyAddress()) {
      memory.defaultCodePC = this.address;
      return -1; // to set lineBeforeThisWasAddressOnly
    }
    if (this.#isLabel()) {
      this.labelAddresses[this.label] = new LabelAddress(
        memory.defaultCodePC,
        this.number
      );
      if (!this.#isCommandWithLeadLabel()) {
        return 0; //lineLen = 0 and return here since labels might be recognized as commands
      }
    }

    let commandName = this.commandName;
    if (commandName == "") {
      return 0; // lineLen = 0
    }

    if (commandName in Command.opCodes) {
      let command = new Command(commandName, this.number);

      let param = new ParamFactory().create({
        name: this.paramName,
        lineNumber: this.number,
        labelAddresses: this.labelAddresses,
        commandName: commandName,
        memory: memory,
      });

      return command.compileOpCode(param, memory, lineBeforeThisWasAddressOnly);
    }
    raiseSyntaxError(this.number, "Command '" + command.name + "' undefined");
    return 0;
  }
  get address() {
    let addr = this.#extract(this.regExp.addressOnly);
    addr = this.#addrToHexOrDec(addr);
    return addr;
  }
  get label() {
    return this.#extract(this.regExp.label);
  }
  get commandName() {
    let lineContent = this.content;
    let commandName = "";
    if (lineContent.match(this.regExp.commandWithLeadLabel)) {
      commandName = this.#extract(
        this.regExp.commandWithLeadLabel
      ).toUpperCase();
    } else if (lineContent.match(this.regExp.command)) {
      commandName = this.#extract(this.regExp.command).toUpperCase();
    } else {
      raiseSyntaxError(
        this.number,
        "Command in line '" + this.content + "' undefined"
      );
    }
    return commandName;
  }
  get paramName() {
    let lineContent = this.content;
    let paramName = "";
    if (lineContent.match(this.regExp.paramWithLeadLabel)) {
      paramName = this.#extract(this.regExp.paramWithLeadLabel).replace(
        /[ ]/g,
        ""
      );
    } else if (lineContent.match(this.regExp.param)) {
      paramName = this.#extract(this.regExp.param).replace(/[ ]/g, "");
    }
    return paramName;
  }

  noCode() {
    if (this.content === "") {
      return true;
    }
    return false;
  }

  #isBlank() {
    if (this.content == "") {
      return true;
    }
    return false;
  }
  #isOnlyAddress() {
    if (this.content.match(this.regExp.addressOnly)) {
      return true;
    }
    return false;
  }
  #isLabel() {
    if (this.content.match(this.regExp.label)) {
      return true;
    }
    return false;
  }
  #isCommandWithLeadLabel() {
    if (this.content.match(this.regExp.commandWithLeadLabel)) {
      return true;
    }
    return false;
  }
  #extract(regExp) {
    return this.content.replace(regExp, "$1");
  }
  #addrToHexOrDec(addr) {
    if (addr[0] == "$") {
      addr = addr.replace(/^\$/, ""); //strip leading dollar sign
      addr = parseInt(addr, 16);
    } else {
      addr = parseInt(addr, 10);
    }
    this.#validateAddress(addr);
    return addr;
  }
  #validateAddress(addr) {
    if (addr < 0x0 || addr > 0xffff) {
      raiseRangeError(
        "Address '" + addr + "' out of range(" + 0x0 + ", " + 0xfff + ")"
      );
    }
    return;
  }
}
CodeLine.prototype.toString = function () {
  return "line " + this.number + ": " + this.content;
};

class LabelAddresses {
  printLabelCount() {
    let labelAddressesCount = Object.entries(this).length;
    let str = "Found " + labelAddressesCount + " label";
    str = labelAddressesCount == 1 ? (str += ".") : (str += "s.");
    printMessage(str);
  }
  isLabel(byte) {
    if (typeof byte == "string" && ["<", ">"].includes(byte.slice(0, 1))) {
      //high-low-label
      byte = byte.slice(1);
    }
    if (byte in this) {
      return true;
    }
    return false;
  }
  getLabel(address) {
    let label = "";
    Object.entries(this).forEach(([key, labelAddress]) => {
      if (labelAddress.word === address) {
        label = key;
        return;
      }
    });
    return label;
  }
  insertToMemory(codePC, memory) {
    let memoryEntry = memory.readByte(codePC);

    if (!(memoryEntry instanceof LabelEntry)) {
      return;
    }

    let label = memoryEntry.value;

    let highLowMark = "";
    if (["<", ">"].includes(label.slice(0, 1))) {
      //high-low-label
      highLowMark = label.slice(0, 1);
      label = label.slice(1);
    }

    let labelAddress = this[label];
    let labelAddressWord = labelAddress.word;
    let lineNumber = memory.readByte(codePC).lineNumber;
    if (label === labelAddressWord) {
      throw "Call insertLabelAddresses() only after calling scanLabels() and compileLines()!";
    }

    let opCode = memory.readByte(codePC - 1).value;
    if (Command.isBranchInstruction(opCode)) {
      this.#insertForBranch(codePC, labelAddressWord, lineNumber, memory);
    } else if (highLowMark == "<") {
      memory.writeByte(
        codePC,
        new WordEntry(labelAddressWord, lineNumber).lowerByteEntry
      );
    } else if (highLowMark == ">") {
      memory.writeByte(
        codePC,
        new WordEntry(labelAddressWord, lineNumber).upperByteEntry
      );
    } else {
      // is absolute opCod
      memory.writeWord(codePC, new WordEntry(labelAddressWord, lineNumber));
    }
    return;
  }

  #insertForBranch(codePC, labelAddress, labelAddressLineNumber, memory) {
    let offsetAddressWord;
    if (labelAddress < codePC - 0x600) {
      // Backwards
      offsetAddressWord = 0xff - (codePC - 0x600 - labelAddress);
    }
    if (labelAddress >= codePC - 0x600) {
      offsetAddressWord = labelAddress - (codePC - 0x600) - 0x1;
    }
    memory.writeByte(
      codePC,
      new WordEntry(offsetAddressWord, labelAddressLineNumber).lowerByteEntry
    );
    return;
  }
}
LabelAddresses.prototype.toString = function () {
  Object.entries(this).forEach(([label, labelAddress]) => {
    console.log(label + " : " + labelAddress.toString() + "\n");
  });
};

class LabelAddress {
  constructor(word, lineNumber) {
    this.word = word;
    this.lineNumber = lineNumber;
  }
}
LabelAddress.prototype.toString = function () {
  return (
    "line " + this.lineNumber + ": 0x" + this.word.toString(16).padStart(4, 0)
  );
};

export class Command {
  static opCodes = {
    // NoAd means, command can be called without param
    //Name  NoAd  Imm   ZP   ZPX   ZPY   ABS  ABSI  ABSX  ABSY  INDX  INDY  BRA
    ADC: [
      0x00, 0x69, 0x65, 0x75, 0x00, 0x6d, 0x00, 0x7d, 0x79, 0x61, 0x71, 0x00,
    ],
    AND: [
      0x00, 0x29, 0x25, 0x35, 0x00, 0x2d, 0x00, 0x3d, 0x39, 0x21, 0x31, 0x00,
    ],
    ASL: [
      0x0a, 0x00, 0x06, 0x16, 0x00, 0x0e, 0x00, 0x1e, 0x00, 0x00, 0x00, 0x00,
    ],
    BCC: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x90,
    ],
    BCS: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xb0,
    ],
    BEQ: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0,
    ],
    BIT: [
      0x00, 0x00, 0x24, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    BMI: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30,
    ],
    BNE: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xd0,
    ],
    BPL: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10,
    ],
    BRK: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    BVC: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50,
    ],
    BVS: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x70,
    ],
    CLC: [
      0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    CLD: [
      0xd8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    CLI: [
      0x58, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    CLV: [
      0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    CMP: [
      0x00, 0xc9, 0xc5, 0xd5, 0x00, 0xcd, 0x00, 0xdd, 0xd9, 0xc1, 0xd1, 0x00,
    ],
    CPX: [
      0x00, 0xe0, 0xe4, 0x00, 0x00, 0xec, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    CPY: [
      0x00, 0xc0, 0xc4, 0x00, 0x00, 0xcc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    DEC: [
      0x00, 0x00, 0xc6, 0xd6, 0x00, 0xce, 0x00, 0xde, 0x00, 0x00, 0x00, 0x00,
    ],
    DEX: [
      0xca, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    DEY: [
      0x88, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    EOR: [
      0x00, 0x49, 0x45, 0x55, 0x00, 0x4d, 0x00, 0x5d, 0x59, 0x41, 0x51, 0x00,
    ],
    INC: [
      0x00, 0x00, 0xe6, 0xf6, 0x00, 0xee, 0x00, 0xfe, 0x00, 0x00, 0x00, 0x00,
    ],
    INX: [
      0xe8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    INY: [
      0xc8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    JMP: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x4c, 0x6c, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    JSR: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    LDA: [
      0x00, 0xa9, 0xa5, 0xb5, 0x00, 0xad, 0x00, 0xbd, 0xb9, 0xa1, 0xb1, 0x00,
    ],
    LDX: [
      0x00, 0xa2, 0xa6, 0x00, 0xb6, 0xae, 0x00, 0x00, 0xbe, 0x00, 0x00, 0x00,
    ],
    LDY: [
      0x00, 0xa0, 0xa4, 0xb4, 0x00, 0xac, 0x00, 0xbc, 0x00, 0x00, 0x00, 0x00,
    ],
    LSR: [
      0x4a, 0x00, 0x46, 0x56, 0x00, 0x4e, 0x00, 0x5e, 0x00, 0x00, 0x00, 0x00,
    ],
    NOP: [
      0xea, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    ORA: [
      0x00, 0x09, 0x05, 0x15, 0x00, 0x0d, 0x00, 0x1d, 0x19, 0x01, 0x11, 0x00,
    ],
    PHA: [
      0x48, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    PHP: [
      0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    PLA: [
      0x68, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    PLP: [
      0x28, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    ROL: [
      0x2a, 0x00, 0x26, 0x36, 0x00, 0x2e, 0x00, 0x3e, 0x00, 0x00, 0x00, 0x00,
    ],
    ROR: [
      0x6a, 0x00, 0x66, 0x76, 0x00, 0x6e, 0x00, 0x7e, 0x00, 0x00, 0x00, 0x00,
    ],
    RTI: [
      0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    RTS: [
      0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    SBC: [
      0x00, 0xe9, 0xe5, 0xf5, 0x00, 0xed, 0x00, 0xfd, 0xf9, 0xe1, 0xf1, 0x00,
    ],
    SEC: [
      0x38, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    SED: [
      0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    SEI: [
      0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    STA: [
      0x00, 0x00, 0x85, 0x95, 0x00, 0x8d, 0x00, 0x9d, 0x99, 0x81, 0x91, 0x00,
    ],
    STX: [
      0x00, 0x00, 0x86, 0x00, 0x96, 0x8e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    STY: [
      0x00, 0x00, 0x84, 0x94, 0x00, 0x8c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    TAX: [
      0xaa, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    TAY: [
      0xa8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    TSX: [
      0xba, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    TXA: [
      0x8a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    TXS: [
      0x9a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    TYA: [
      0x98, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
    DCB: [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],

    // illegal
    // NOP, addressing mode has no significace, only timing
    // NOP : [0x1a, 0x3a, 0x5a, 0x7a, 0xda, 0xfb],
    // Double NOP, addressing mode has no significace, only timing
    // DOP : [0x04, 0x14, 0x34, 0x44, 0x54, 0x64, 0x74, 0x80, 0x82, 0x89, 0xc2, 0xd4, 0xe2, 0xf4],
    // Tripple NOP, addressing mode has no significace, only timing
    // TOP : [0x0c, 0x1c, 0x3c, 0x5c, 0x7c, 0xdc, 0xfc],
    // KIL, stop programm counter (processor lock up)
    // KIL : [0x02, 0x12, 0x22, 0x32, 0x42, 0x52, 0x62, 0x72, 0x92, 0xb2, 0xd2, 0xf2],
  };
  static getOpCodeName(opCode) {
    let opCodeName = fmtToHex(opCode);
    Object.entries(Command.opCodes).forEach(([name, opCodes]) => {
      if (opCode != 0x00 && opCodes.find((opCodeV) => opCodeV == opCode)) {
        opCodeName = name;
      }
    });
    return opCodeName;
  }
  static isBranchInstruction(opCode) {
    let branchOpCodes = new Array(
      0x10,
      0x30,
      0x50,
      0x70,
      0x90,
      0xb0,
      0xd0,
      0xf0
    );
    if (branchOpCodes.includes(opCode)) {
      return true;
    }
    return false;
  }
  static isJumpInstruction(opCode) {
    if (opCode == 0x4c || opCode == 0x6c) {
      return true;
    }
    return false;
  }
  constructor(commandName, lineNumber) {
    (this.name = commandName), (this.lineNumber = lineNumber);
    this.opCode = 0x00;
    this.noParam = Command.opCodes[this.name][0];
    this.immediate = Command.opCodes[this.name][1];
    this.zeroPage = Command.opCodes[this.name][2];
    this.zeroPageX = Command.opCodes[this.name][3];
    this.zeroPageY = Command.opCodes[this.name][4];
    this.absolute = Command.opCodes[this.name][5];
    this.absoluteIndirect = Command.opCodes[this.name][6];
    this.absoluteX = Command.opCodes[this.name][7];
    this.absoluteY = Command.opCodes[this.name][8];
    this.indirectX = Command.opCodes[this.name][9];
    this.indirectY = Command.opCodes[this.name][10];
    this.branch = Command.opCodes[this.name][11];
  }

  compileOpCode(param, memory, lineBeforeThisWasAddressOnly) {
    if (this.name == "DCB") {
      let countParam = param.compileDcb();
      if (!lineBeforeThisWasAddressOnly) {
        return 0;
      }
      return countParam;
    }
    this.opCode = this[param.addrModeName];
    if (this.opCode == 0x00 && this.name != "BRK") {
      raiseAddressingModeError(
        this.lineNumber,
        "OpCode for command " +
          this.name +
          " with addrMode " +
          param.addrModeName +
          " unset"
      );
    }

    let countPushedOpCodes = this.#pushOpCode(memory);
    countPushedOpCodes += param.push(memory);
    return countPushedOpCodes;
  }

  #pushOpCode(memory) {
    memory.pushByte(new OpCodeByteEntry(this.opCode, this.lineNumber));
    return 1; // for lineLen/codeLen
  }
}
Command.prototype.toString = function () {
  let str = "OpCode\n";
  Object.entries(this).forEach(([k, v]) => {
    str += "  " + k + ": " + v;
  });
  return str;
};

class Param {
  static regExps = {
    label: /^\w+/,
    labelIndirect: /^\(\w+\)/,
    immediateHexNo: /^#\$([0-9a-f]{1,2})/,
    immediateDecNo: /^#([0-9]{1,3})/,
    highLowLabel: /^#[<>]\w+/,
    zeroPageHexNo: /^\$([0-9a-f]{1,2})/,
    zeroPageDecNo: /^([0-9]{1,3})/,
    absoluteHexNo: /^\$([0-9a-f]{3,4})/,
    absoluteDecNo: /^([0-9]{1,5})/, // Todo: Why not only length of 4,5?
    absoluteHexNoIndirect: /^\$\(([0-9a-f]{3,4})\)/,
    absoluteDecNoIndirect: /^\(([0-9]{1,5})\)/, // Todo: Why not only length of 4,5?
    indirectHexNo: /^\(\$([0-9a-f]{1,2}).*/,
  };
  constructor({ name, lineNumber, labelAddresses, commandName, memory } = {}) {
    this.name = name;
    this.lineNumber = lineNumber;
    this.labelAddresses = labelAddresses;
    this.commandName = commandName;
    this.addrModeName = "";
    this.push = function (_) {
      return 0;
    }; //for lineLen/codeLen
    this.register = "";
    this.memory = memory;
  }
  isDcb() {
    if (this.commandName == "DCB") {
      return true;
    }
    return false;
  }
  empty() {
    if (this.name == "") {
      return true;
    }
    return false;
  }
  isBranchCommand() {
    let branchCommands = new Array(
      "BPL",
      "BMI",
      "BVC",
      "BVS",
      "BCC",
      "BCS",
      "BNE",
      "BEQ"
    );
    if (branchCommands.includes(this.commandName)) {
      //is branch command, skip absolute!
      return true;
    }
    return false;
  }
  isBranch() {
    if (!this.#isLabel()) {
      raiseError(this.lineNumber, "Branch opCode must be followed by a value");
    }
    return true;
  }

  isImmediate() {
    if (
      !this.#isImmediateHexNumber() &&
      !this.#isImmediateDecNumber() &&
      !this.#hasHighLowLabel()
    ) {
      return false;
    }
    return true;
  }
  isZeroPage(register) {
    if (
      !this.#isZeroPageHexNumber(register) &&
      !this.#isZeroPageDecNumber(register)
    ) {
      return false;
    }
    return true;
  }
  isAbsolute(register) {
    if (
      !this.#isAbsoluteHexNumber(register) &&
      !this.#isAbsoluteDecNumber(register) &&
      !this.#isLabel({ register: register })
    ) {
      return false;
    }
    return true;
  }
  isAbsoluteIndirect(register) {
    if (
      !this.#isAbsoluteHexNumberIndirect(register) &&
      !this.#isAbsoluteDecNumberIndirect(register) &&
      !this.#isLabelIndirect({ register: register })
    ) {
      return false;
    }
    return true;
  }
  isIndirect(register) {
    if (!this.#isIndirectHexNumber(register)) {
      return false;
    }
    return true;
  }
  #isLabel({ register = "" } = {}) {
    return this.#matchesRegExp({
      regExp: Param.regExps.label,
      register: register,
    });
  }
  #isLabelIndirect({ register = "" } = {}) {
    return this.#matchesRegExp({
      regExp: Param.regExps.labelIndirect,
      register: register,
    });
  }

  #isImmediateHexNumber() {
    return this.#matchesRegExp({ regExp: Param.regExps.immediateHexNo });
  }
  #isImmediateDecNumber() {
    return this.#matchesRegExp({ regExp: Param.regExps.immediateDecNo });
  }
  #hasHighLowLabel() {
    let bool = this.#matchesRegExp({ regExp: Param.regExps.highLowLabel });
    return bool;
  }
  #isZeroPageHexNumber(register) {
    return this.#matchesRegExp({
      regExp: Param.regExps.zeroPageHexNo,
      register: register,
    });
  }
  #isZeroPageDecNumber(register) {
    return this.#matchesRegExp({
      regExp: Param.regExps.zeroPageDecNo,
      register: register,
    });
  }
  #isAbsoluteHexNumber(register) {
    return this.#matchesRegExp({
      regExp: Param.regExps.absoluteHexNo,
      register: register,
    });
  }
  #isAbsoluteDecNumber(register) {
    return this.#matchesRegExp({
      regExp: Param.regExps.absoluteDecNo,
      register: register,
    });
  }
  #isAbsoluteHexNumberIndirect(register) {
    return this.#matchesRegExp({
      regExp: Param.regExps.absoluteHexNoIndirect,
      register: register,
    });
  }
  #isAbsoluteDecNumberIndirect(register) {
    return this.#matchesRegExp({
      regExp: Param.regExps.absoluteDecNoIndirect,
      register: register,
    });
  }
  #isIndirectHexNumber(register) {
    return this.#matchesRegExp({
      regExp: Param.regExps.indirectHexNo,
      register: register,
      indirect: true,
    });
  }
  #matchesRegExp({ regExp = /(?:)/, register = "", indirect = false } = {}) {
    let regExpString = this.#handleRegister({
      register: register,
      regExp: regExp,
      indirect: indirect,
    });
    regExp = this.#addLineEndCaseInsensitive(regExpString);
    if (this.name.match(regExp)) {
      return true;
    }
    return false;
  }

  // DCB handling
  compileDcb() {
    let lineLen = 0;
    let values = this.name.split(",");
    if (values.length == 0) {
      return 0;
    }

    for (let value of values) {
      lineLen += this.#compileDcbValue(value);
    }
    return lineLen;
  }
  #compileDcbValue(value) {
    if (value == undefined || value == null || value.length == 0) {
      raiseDCBValueError(lineNumber, "Unknown: DCB value: " + value);
      return 0; // +0 for lineLen
    }
    let base = 10;
    let leadChar = value.substring(0, 1);
    if (leadChar != "$" && (leadChar < "0" || leadChar > "9")) {
      raiseDCBValueError(this.lineNumber, "Unknown: DCB value: " + value);
      return 1; // +1 for lineLen
    }
    if (leadChar == "$") {
      value = value.replace(/^\$/, ""); //strip leading dollar sign
      base = 16;
    }
    let byte = parseInt(value, base);
    this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
    return 1; // +1 for lineLen
  }

  // push Functions
  pushForImmediate() {
    if (this.#isImmediateHexNumber()) {
      let byte = extractImmediateHexNumber.bind(this)();
      this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    if (this.#isImmediateDecNumber()) {
      let byte = extractImmediateDecNumber.bind(this)();
      this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    if (this.#hasHighLowLabel()) {
      let label = extractHighLowLabelAddress.bind(this)();
      this.memory.pushByte(new LabelEntry(label, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    throw "Call this function only if isImmediate() is true!";

    // helper
    function extractImmediateHexNumber() {
      return this.#extractNumber({ regExp: Param.regExps.immediateHexNo });
    }
    function extractImmediateDecNumber() {
      return this.#extractNumber({
        regExp: Param.regExps.immediateDecNo,
        base: 10,
        max: 255,
      });
    }
    function extractHighLowLabelAddress() {
      let label = this.name.replace(/^#[<>](\w+)$/, "$1");
      let hilo = this.name.replace(/^#([<>]).*$/, "$1");
      if (!(label in this.labelAddresses)) {
        throw "Call extractHighLowLabelAddress() only after calling scanLabels() and compileLines()!";
      }
      return hilo + this.labelAddresses[label].word;
    }
  }
  pushForZeroPage() {
    let register = this.register;
    if (this.#isZeroPageHexNumber(register)) {
      let byte = extractZeroPageHexNumber.bind(this, register)();
      this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    if (this.#isZeroPageDecNumber(register)) {
      let byte = extractZeroPageDecNumber.bind(this, register)();
      this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    throw "Call this function only if isZeroPage() is true!";

    // helper
    function extractZeroPageHexNumber(register) {
      return this.#extractNumber({
        register: register,
        regExp: Param.regExps.zeroPageHexNo,
      });
    }
    function extractZeroPageDecNumber(register) {
      return this.#extractNumber({
        register: register,
        regExp: Param.regExps.zeroPageDecNo,
        base: 10,
        max: 255,
      });
    }
  }
  pushForAbsolute() {
    let register = this.register;
    if (this.#isAbsoluteHexNumber(register)) {
      let word = extractAbsoluteHexNumber.bind(this, register)();
      this.memory.pushWord(new WordEntry(word, this.lineNumber));
      return 2; // for lineLen/codeLen
    }

    if (this.#isAbsoluteDecNumber(register)) {
      let word = extractAbsoluteDecNumber.bind(this, register)();
      this.memory.pushWord(new WordEntry(word, this.lineNumber));
      return 2; // for lineLen/codeLen
    }

    // can only be label now, since this function has to be called only if isAbsolute() is true
    let label = extractLabel.bind(this)(register);

    if (label in this.labelAddresses) {
      let labelAddressWord = this.labelAddresses[label].word;
      if (labelAddressWord === label) {
        // labelAddress will be inserted after compileLines()
        this.memory.pushByte(new LabelEntry(label, this.lineNumber));
        this.memory.pushByte(new LabelEntry(label, this.lineNumber));
      } else {
        this.memory.pushWord(new WordEntry(labelAddressWord, this.lineNumber));
      }
      return 2; // for lineLen/codeLen
    }

    if (!(label in this.labelAddresses)) {
      raiseLabelError(this.lineNumber, "Label '" + label + "' not existing");
      return 0;
    }
    throw "Call pushForAbsolute() only if isAbsolute() is true!";

    // helper
    function extractLabel(register) {
      if (register == "") {
      }
      return this.name.replace(new RegExp("," + register + "$", "i"), "");
    }
    function extractAbsoluteHexNumber(register) {
      return this.#extractNumber({
        register: register,
        regExp: Param.regExps.absoluteHexNo,
        max: 0xffff,
      });
    }
    function extractAbsoluteDecNumber(register) {
      return this.#extractNumber({
        register: register,
        regExp: Param.regExps.absoluteDecNo,
        base: 10,
        max: 65535,
      });
    }
  }
  pushForAbsoluteIndirect() {
    let register = this.register;
    if (this.#isAbsoluteHexNumberIndirect(register)) {
      let word = extractAbsoluteHexNumberIndirect.bind(this, register)();
      this.memory.pushWord(new WordEntry(word, this.lineNumber));
      return 2; // for lineLen/codeLen
    }

    if (this.#isAbsoluteDecNumberIndirect(register)) {
      let word = extractAbsoluteDecNumberIndirect.bind(this, register)();
      this.memory.pushWord(new WordEntry(word, this.lineNumber));
      return 2; // for lineLen/codeLen
    }

    // can only be label now, since this function has to be called only if isAbsolute() is true
    let label = extractLabelIndirect.bind(this)(register);

    if (label in this.labelAddresses) {
      let labelAddressWord = this.labelAddresses[label].word;
      if (labelAddressWord === label) {
        // labelAddress will be inserted after compileLines()
        this.memory.pushByte(new LabelEntry(label, this.lineNumber));
        this.memory.pushByte(new LabelEntry(label, this.lineNumber));
      } else {
        this.memory.pushWord(new WordEntry(labelAddressWord, this.lineNumber));
      }
      return 2; // for lineLen/codeLen
    }

    if (!(label in this.labelAddresses)) {
      raiseLabelError(this.lineNumber, "Label '" + label + "' not existing");
      return 0;
    }
    throw "Call pushForAbsoluteIndirect() only if isAbsoluteIndirect() is true!";

    // helper
    function extractLabelIndirect(register) {
      if (register == "") {
      }
      let label = this.name.replace(/^\(/, "");
      label = label.replace(/\)$/, "");
      return label;
    }
    function extractAbsoluteHexNumberIndirect(register) {
      return this.#extractNumber({
        register: register,
        regExp: Param.regExps.absoluteHexNoIndirect,
        max: 0xffff,
      });
    }
    function extractAbsoluteDecNumberIndirect(register) {
      return this.#extractNumber({
        register: register,
        regExp: Param.regExps.absoluteDecNoIndirect,
        base: 10,
        max: 65535,
      });
    }
  }
  pushForIndirect() {
    let register = this.register;
    let byte = extractIndirectHexNumber.bind(this, register)();
    this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
    return 1; // for lineLen/codeLen

    //helper
    function extractIndirectHexNumber(register) {
      return this.#extractNumber({
        register: register,
        regExp: Param.regExps.indirectHexNo,
        indirect: true,
      });
    }
  }
  pushForBranch() {
    let label = this.name;
    if (!(label in this.labelAddresses)) {
      raiseLabelError(this.lineNumber, "Label '" + label + "' not existing");
      return;
    }

    let labelAddress = this.labelAddresses[label].word;
    if (labelAddress === label) {
      //labelAddress will be inserted after compileLines()
      this.memory.pushByte(new LabelEntry(label, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    if (labelAddress < this.memory.defaultCodePC - 0x600) {
      // Backwards
      console.warn("backwards");
      let offsetAddressWord =
        0xff - (this.memory.defaultCodePC - 0x600 - labelAddress);
      this.memory.pushByte(
        new WordEntry(offsetAddressWord, this.lineNumber).lowerByteEntry
      );
      return 1; // for lineLen/codeLen
    }
    if (labelAddress >= this.memory.defaultCodePC - 0x600) {
      let offsetAddressWord =
        labelAddress - 1 - (this.memory.defaultCodePC - 0x600);
      this.memory.pushByte(
        new WordEntry(offsetAddressWord, this.lineNumber).lowerByteEntry
      );
      return 1; // for lineLen/codeLen
    }
    throw "Call pushForBranch() only if isBranch() is true!";
  }
  #extractNumber({
    // called with binding wrapper in pushFor methods
    register = "",
    regExp = /(?:)/,
    base = 16,
    min = 0,
    max = 0xff,
    indirect = false,
  } = {}) {
    let regExpString = this.#handleRegister({
      register: register,
      regExp: regExp,
      indirect: indirect,
    });
    regExp = this.#addLineEndCaseInsensitive(regExpString);
    let number = this.name.replace(regExp, "$1");
    number = parseInt(number, base);
    if (number < min || number > max) {
      raiseRangeError(
        this.lineNumber,
        "Value '" + number + "' out of range(" + min + ", " + max + ")"
      );
    }
    return number;
  }
  #handleRegister({ register = "", regExp = /(?:)/, indirect = false } = {}) {
    let regExpString = regExp.toString();
    // strip lead/tail '/' of reg exp representation for string representation
    regExpString = regExpString.substring(1, regExpString.length - 1);

    if (indirect) {
      if (register == "") {
        let errMsg = "No register given in indirect opCode!";
        printMessage(errMsg);
        throw errMsg;
      } else if (register == "X") {
        regExpString = regExpString + "," + register + "\\)";
      } else if (register == "Y") {
        regExpString = regExpString + "\\)" + "," + register;
      }
      return regExpString;
    }

    if (register != "") {
      return regExpString + "," + register;
    }
    return regExpString;
  }
  #addLineEndCaseInsensitive(regExpString) {
    return new RegExp(regExpString + "$", "i");
  }
}
Param.prototype.toString = function () {
  return "line " + this.lineNumber + ": " + this.name;
};

class ParamFactory {
  create = function ({
    name = "",
    lineNumber = 0,
    labelAddresses,
    commandName = "",
    memory,
  } = {}) {
    let param = new this.param({
      name: name,
      lineNumber: lineNumber,
      labelAddresses: labelAddresses,
      commandName: commandName,
      memory: memory,
    });
    let addrModeName = "";
    let pushFunction = function (_) {
      return 0;
    }; //for lineLen/codeLen
    let register = "";
    if (param.isDcb()) {
      return param;
    } else if (param.empty()) {
      addrModeName = "noParam";
    } else if (param.isBranchCommand() && param.isBranch()) {
      addrModeName = "branch";
      pushFunction = param.pushForBranch;
    } else if (param.isImmediate()) {
      addrModeName = "immediate";
      pushFunction = param.pushForImmediate;
    } else if (param.isZeroPage("")) {
      addrModeName = "zeroPage";
      pushFunction = param.pushForZeroPage;
      register = "";
    } else if (param.isZeroPage("X")) {
      addrModeName = "zeroPageX";
      pushFunction = param.pushForZeroPage;
      register = "X";
    } else if (param.isZeroPage("Y")) {
      addrModeName = "zeroPageY";
      pushFunction = param.pushForZeroPage;
      register = "Y";
    } else if (param.isAbsolute("")) {
      addrModeName = "absolute";
      pushFunction = param.pushForAbsolute;
      register = "";
    } else if (param.isAbsoluteIndirect("")) {
      addrModeName = "absoluteIndirect";
      pushFunction = param.pushForAbsoluteIndirect;
      register = "";
    } else if (param.isAbsolute("X")) {
      addrModeName = "absoluteX";
      pushFunction = param.pushForAbsolute;
      register = "X";
    } else if (param.isAbsolute("Y")) {
      addrModeName = "absoluteY";
      pushFunction = param.pushForAbsolute;
      register = "Y";
    } else if (param.isIndirect("X")) {
      addrModeName = "indirectX";
      pushFunction = param.pushForIndirect;
      register = "X";
    } else if (param.isIndirect("Y")) {
      addrModeName = "indirectY";
      pushFunction = param.pushForIndirect;
      register = "Y";
    } else {
      raiseAddressingModeError(
        lineNumber,
        "Addressing mode of parameter '" + addrModeName + "' unknown"
      );
    }
    param.addrModeName = addrModeName;
    param.push = pushFunction;
    param.register = register;
    return param;
  };
}
ParamFactory.prototype.param = Param;
