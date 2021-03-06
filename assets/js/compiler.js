import { Memory, ByteEntry } from "./memory";

import { CodeLine } from "./compiler-codeLine";
import {
  LabelAddresses,
  LabelAddress,
  LabelAddressEquLabelPlusAddr,
  LabelAddressEquLabelPlusLabel,
} from "./compiler-labelAdress";

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

  resolveEquLabelAddresses() {
    if (this.noCode()) {
      return this;
    }

    Object.entries(this.labelAddresses).forEach(([label, labelAddress]) => {
      if (labelAddress instanceof LabelAddress) {
        return;
      }
      if (
        labelAddress instanceof LabelAddressEquLabelPlusAddr ||
        labelAddress instanceof LabelAddressEquLabelPlusLabel
      ) {
        resolveEquLabelAddress.bind(this)(label, " ");
        return;
      }
    });

    return this;

    //helper
    function resolveEquLabelAddress(label, offset) {
      const labelAddresses = this.labelAddresses;
      const labelAddress = labelAddresses[label];

      if (labelAddress instanceof LabelAddress) {
        return labelAddress.word;
      }
      if (labelAddress instanceof LabelAddressEquLabelPlusAddr) {
        const childLabel = labelAddress.label;
        let word = resolveEquLabelAddress.bind(this)(childLabel, offset + " ");
        word += labelAddress.word;
        labelAddresses[label] = new LabelAddress(word, this.number);
        return word;
      }
      if (labelAddress instanceof LabelAddressEquLabelPlusLabel) {
        const childLabelA = labelAddress.labelA;
        const childLabelB = labelAddress.labelB;
        let wordA = resolveEquLabelAddress.bind(this)(
          childLabelA,
          offset + " "
        );
        let wordB = resolveEquLabelAddress.bind(this)(
          childLabelB,
          offset + " "
        );
        const word = wordA + wordB;
        labelAddresses[label] = new LabelAddress(word, this.number);
        return word;
      }
    }
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
