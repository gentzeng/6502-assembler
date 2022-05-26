import { fmtToHexWord, fmtToHexWordBr } from "../helper";

import { WordEntry } from "../memory";
import { consoleDebug } from "../message";
import { getAddressingModeAddr } from "./handleAddressingMode";
// jumping ===================================================================================
export function i20(name) {
  pushReturnAddress();
  jump({ name: name, msg: "subroutine " });
  return;

  function pushReturnAddress() {
    let addrBeforeNextInstruction = exports.reg.PC + 1;
    // exports.reg.PC + 1 because we get a word, i.e., 2 byte in jump()
    exports.memory.pushWordToStack(new WordEntry(addrBeforeNextInstruction));
  }
}
export function i4c(name) {
  jump({ name: name, addrMode: "absolute" });
}

export function i6c(name) {
  jump({ name: name, addrMode: "absoluteIndirect" });
  // ierr(name + ": [UNIMPL] jumping with absoluteIndirect addressingMode");
}
function jump({ name = "", msg = "", addrMode = "absolute" } = {}) {
  const addr = getAddressingModeAddr({ addrMode: addrMode });
  exports.reg.PC = addr; // the actual jump to address
  consoleDebug({
    msg:
      name +
      ": jumping to " +
      msg +
      exports.labelAddresses.getLabel(exports.reg.PC) +
      fmtToHexWordBr(exports.reg.PC) +
      "[lineNo: " +
      exports.addressLineNumbers[exports.reg.PC].lineNumber +
      "]",
    bold: true,
  });
}

export function i4cRelativePlus(name) {
  jumpRelative({ name: name, type: "Plus" });
}
export function i4cRelativeMinus(name) {
  jumpRelative({ name: name, type: "Minus" });
}
function jumpRelative({
  name = "",
  type = "Plus",
  msg = "",
  addrMode = "immediateRelative",
} = {}) {
  const addr = getAddressingModeAddr({ addrMode: `${addrMode}${type}` });
  const value = exports.memory.readByte(addr).value;
  const jumpAddr =
    type === "Plus"
      ? (exports.reg.PC + value) % exports.memory.size
      : (exports.reg.PC - value) % exports.memory.size;

  exports.reg.PC = jumpAddr; // the actual jump to address

  const addressLineNumber = exports.addressLineNumbers[exports.reg.PC];
  const lineNo =
    typeof addressLineNumber == "undefined"
      ? ""
      : "[lineNo: " + addressLineNumber.lineNumber + "]";
  consoleDebug({
    msg:
      name +
      ": jumping to " +
      exports.labelAddresses.getLabel(exports.reg.PC) +
      fmtToHexWordBr(exports.reg.PC) +
      lineNo,
    bold: true,
  });
}
// returning ---------------------------------------------------------------------------------
export function i40(name) {
  // this actually should pop flags/processor state from stack and pop PC from stack
  // const status = exports.memory.popByteFromStack();
  // const pc = exports.memory.popByteFromStack();
  consoleDebug({ msg: name + ": returning from interrupt", bold: true });
}
export function i60(name) {
  const returnAddr = exports.memory.popWordFromStack().value;
  exports.reg.PC = returnAddr;
  consoleDebug({
    msg:
      name +
      ": returning from subroutine to " +
      exports.labelAddresses.getLabel(exports.reg.PC) +
      fmtToHexWordBr(exports.reg.PC),
  });
}

// branching =================================================================================
export function i10(name) {
  jumpBranch({ type: "BPL", name: name });
}
export function i30(name) {
  jumpBranch({ type: "BMI", name: name });
}
export function i50(name) {
  jumpBranch({ type: "BVC", name: name });
}
export function i70(name) {
  jumpBranch({ type: "BVS", name: name });
}
export function i90(name) {
  jumpBranch({ type: "BCC", name: name });
}
export function ib0(name) {
  jumpBranch({ type: "BCS", name: name });
}
export function id0(name) {
  jumpBranch({ type: "BNE", name: name });
}
export function if0(name) {
  jumpBranch({ type: "BEQ", name: name });
}

function jumpBranch({ type = "", name = "" } = {}) {
  let conditions = {
    BCC: exports.flags.carry.isClear(),
    BCS: exports.flags.carry.isSet(),
    BNE: exports.flags.zero.isClear(),
    BEQ: exports.flags.zero.isSet(),
    BVC: exports.flags.overflow.isClear(),
    BVS: exports.flags.overflow.isSet(),
    BPL: exports.flags.negative.isClear(),
    BMI: exports.flags.negative.isSet(),
  };

  let offset = exports.memory.readByte(exports.reg.PC).value;
  exports.reg.PC++; // advance program counter
  if (!conditions[type]) {
    consoleDebug({
      msg:
        name +
        ": skipping branch, moving on to " +
        fmtToHexWord(exports.reg.PC),
    });
    return;
  }

  exports.reg.PC = getBranchAddress(offset); // the actual jump means setting the program counter
  consoleDebug({
    msg:
      name +
      ": branching to " +
      exports.labelAddresses.getLabel(exports.reg.PC) +
      fmtToHexWordBr(exports.reg.PC) +
      "[lineNo: " +
      exports.addressLineNumbers[exports.reg.PC].lineNumber +
      "]",
    bold: true,
  });
  return;

  function getBranchAddress(offset) {
    if (offset > 0x7f) {
      //0x7f = 127
      return exports.reg.PC - (0x100 - offset);
    }
    return exports.reg.PC + offset;
  }
}
