import { printMessage } from "./message";

import { WordEntry, LabelEntry } from "./memory";

import { Command } from "./compiler-command";

export class LabelAddresses {
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

export class LabelAddress {
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
