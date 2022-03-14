import { Memory, ByteEntry } from "./memory";

import { CodeLine } from "./compiler-codeLine";
import { LabelAddresses } from "./compiler-labelAdress";

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
      const codeLen = codeLine.compileLine({
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
