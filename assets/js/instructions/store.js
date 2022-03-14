import { fmtToHex, fmtToHexBr, fmtToHexWord } from "../helper";

import { WordEntry } from "../memory";
import { consoleDebug } from "../message";
import { Command } from "../compiler-command";
import { getAddressingModeAddr } from "./handleAddressingMode";
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
