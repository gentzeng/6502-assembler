import { raiseAddressingModeError } from "./message";

import { OpCodeByteEntry } from "./memory";

import { fmtToHex } from "./helper";

export class Command {
  //prettier-ignore
  static opCodes = {
    // NoAd means, command can be called without param
    //Name NoAd  Imm   ZP    ZPX   ZPY   ABS   ABSI  ABSX  ABSY  INDX  INDY  BRA   rel+  rel-
    ADC: [ 0x00, 0x69, 0x65, 0x75, 0x00, 0x6d, 0x00, 0x7d, 0x79, 0x61, 0x71, 0x00, 0x00, 0x00, ],
    //
    AND: [ 0x00, 0x29, 0x25, 0x35, 0x00, 0x2d, 0x00, 0x3d, 0x39, 0x21, 0x31, 0x00, 0x00, 0x00, ],
    AAC: [ 0x00, 0x0b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    AAX: [ 0x00, 0x00, 0x87, 0x00, 0x97, 0x8f, 0x00, 0x00, 0x00, 0x83, 0x00, 0x00, 0x00, 0x00, ],
    ARR: [ 0x00, 0x6b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    ASR: [ 0x00, 0x4b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    ATX: [ 0x00, 0xab, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    AXA: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9f, 0x00, 0x93, 0x00, 0x00, 0x00, ],
    AXS: [ 0x00, 0xcb, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    LAR: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xbb, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    // DCB: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    ASL: [ 0x0a, 0x00, 0x06, 0x16, 0x00, 0x0e, 0x00, 0x1e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    BPL: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0x100, 0x101, ],
    BMI: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x102, 0x103, ],
    BVC: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x104, 0x105, ],
    BVS: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x70, 0x106, 0x107, ],
    BCC: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x90, 0x108, 0x109, ],
    BCS: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xb0, 0x110, 0x111, ],
    BNE: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xd0, 0x112, 0x113, ],
    BEQ: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x114, 0x115, ],
    BRK: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    BIT: [ 0x00, 0x00, 0x24, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    CLC: [ 0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    CLD: [ 0xd8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    CLI: [ 0x58, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    CLV: [ 0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    CMP: [ 0x00, 0xc9, 0xc5, 0xd5, 0x00, 0xcd, 0x00, 0xdd, 0xd9, 0xc1, 0xd1, 0x00, 0x00, 0x00, ],
    CPX: [ 0x00, 0xe0, 0xe4, 0x00, 0x00, 0xec, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    CPY: [ 0x00, 0xc0, 0xc4, 0x00, 0x00, 0xcc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    DEC: [ 0x00, 0x00, 0xc6, 0xd6, 0x00, 0xce, 0x00, 0xde, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    DEX: [ 0xca, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    DEY: [ 0x88, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    EOR: [ 0x00, 0x49, 0x45, 0x55, 0x00, 0x4d, 0x00, 0x5d, 0x59, 0x41, 0x51, 0x00, 0x00, 0x00, ],
    INC: [ 0x00, 0x00, 0xe6, 0xf6, 0x00, 0xee, 0x00, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    INX: [ 0xe8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    INY: [ 0xc8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    JMP: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x4c, 0x6c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    JSR: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    KIL: [ 0x00, 0xf2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    LDA: [ 0x00, 0xa9, 0xa5, 0xb5, 0x00, 0xad, 0x00, 0xbd, 0xb9, 0xa1, 0xb1, 0x00, 0x00, 0x00, ],
    LDX: [ 0x00, 0xa2, 0xa6, 0x00, 0xb6, 0xae, 0x00, 0x00, 0xbe, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    LDY: [ 0x00, 0xa0, 0xa4, 0xb4, 0x00, 0xac, 0x00, 0xbc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    LAX: [ 0x00, 0x00, 0xa7, 0x00, 0xb7, 0xaf, 0x00, 0x00, 0xbf, 0xa3, 0xb3, 0x00, 0x00, 0x00, ],
    LSR: [ 0x4a, 0x00, 0x46, 0x56, 0x00, 0x4e, 0x00, 0x5e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    
    //Name NoAd  Imm   ZP    ZPX   ZPY   ABS   ABSI  ABSX  ABSY  INDX  INDY  BRA
    NOP: [ 0xea, 0xfa, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    DOP: [ 0x00, 0xe2, 0x64, 0xf4, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    TOP: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x00, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],

    ORA: [ 0x00, 0x09, 0x05, 0x15, 0x00, 0x0d, 0x00, 0x1d, 0x19, 0x01, 0x11, 0x00, 0x00, 0x00, ],
    PHA: [ 0x48, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    PHP: [ 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    PLA: [ 0x68, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    PLP: [ 0x28, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    ROL: [ 0x2a, 0x00, 0x26, 0x36, 0x00, 0x2e, 0x00, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    ROR: [ 0x6a, 0x00, 0x66, 0x76, 0x00, 0x6e, 0x00, 0x7e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    RTI: [ 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    RTS: [ 0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    SBC: [ 0x00, 0xe9, 0xe5, 0xf5, 0x00, 0xed, 0x00, 0xfd, 0xf9, 0xe1, 0xf1, 0x00, 0x00, 0x00, ],
    SEC: [ 0x38, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    SED: [ 0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    SEI: [ 0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    STA: [ 0x00, 0x00, 0x85, 0x95, 0x00, 0x8d, 0x00, 0x9d, 0x99, 0x81, 0x91, 0x00, 0x00, 0x00, ],
    STX: [ 0x00, 0x00, 0x86, 0x00, 0x96, 0x8e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    STY: [ 0x00, 0x00, 0x84, 0x94, 0x00, 0x8c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    TAX: [ 0xaa, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    TAY: [ 0xa8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    TSX: [ 0xba, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    TXA: [ 0x8a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    TXS: [ 0x9a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    TYA: [ 0x98, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],
    DCB: [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ],

// illegal
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
    this.name = commandName;
    this.lineNumber = lineNumber;
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
    this.immediateRelativePlus = Command.opCodes[this.name][12];
    this.immediateRelativeMinus = Command.opCodes[this.name][13];
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
    const op = new OpCodeByteEntry(this.opCode, this.lineNumber);
    memory.pushByte(op);
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
