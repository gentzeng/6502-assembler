import { Command } from "./compiler-command";
import {
  LabelAddress,
  LabelAddressEquLabelPlusAddr,
  LabelAddressEquLabelPlusLabel,
} from "./compiler-labelAdress";
import { ParamFactory } from "./compiler-param";
import { raiseSyntaxError, raiseLabelError, raiseRangeError } from "./message";
import { stripLeadingDollarSign } from "./helper";

export class CodeLine {
  constructor(content, number) {
    this.content = content;
    this.number = number;
    this.labelAddresses;
    this.regExp = {
      addressOnly: /^\*[\s]*=[\s]*([\$]?[0-9a-f]*)$/,
      label: /^(\w+):.*$/,
      labelEquAddrOnly: /^\w+:\s+(equ|EQU)\s+(\$[0-9a-f]+).*/,
      labelEquLabelPlusAddr: /^\w+:\s+(equ|EQU)\s+(\w+)\s*\+\s*(\$[0-9a-f]+).*/,
      labelEquAddrPlusLabel: /^\w+:\s+(equ|EQU)\s+(\$[0-9a-f]+)\s*\+\s*(\w+).*/,
      labelEquLabelPlusLabel: /^\w+:\s+(equ|EQU)\s+(\w+)\s*\+\s*(\w+).*/,
      commandWithLeadLabel: /^\w+:\s*(\w+)\s*.*$/,
      command: /^(\w\w\w)\s*.*$/,
      paramWithLeadLabel: /^\w+:\s*\w+\s+([-]?.*?)/,
      param: /^\w\w\w+\s+([-]?.*?)/,
    };
  }

  scanLabel(labelAddresses) {
    this.labelAddresses = labelAddresses;
    if (this.#isLabel()) {
      const label = this.label;
      if (label in this.labelAddresses) {
        let defLineNumber = this.labelAddresses[label].lineNumber;
        raiseLabelError(
          this.number,
          "Label '" + label + "' already defined at line " + defLineNumber
        );
        return;
      }
      // Use label as Address provisionaly => will be read correctly later!
      labelAddresses[label] = new LabelAddress(label, this.number);
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
    if (this.#isLabelEquAddrPlusLabel()) {
      let plusAddress = stripLeadingDollarSign(this.addressEquAddrPlusLabel);
      plusAddress = parseInt(plusAddress, 16);

      const plusLabel = this.labelEquAddrPlusLabel;

      this.labelAddresses[this.label] = new LabelAddressEquLabelPlusAddr(
        plusLabel,
        plusAddress,
        this.number
      );
      return 0; // lineLen = 0
    }
    if (this.#isLabelEquAddrOnly()) {
      let address = stripLeadingDollarSign(this.addressEquAddrOnly);
      address = parseInt(address, 16);
      this.labelAddresses[this.label] = new LabelAddress(address, this.number);
      return 0; // lineLen = 0
    }
    if (this.#isLabelEquLabelPlusAddr()) {
      let plusAddress = stripLeadingDollarSign(this.addressEquLabelPlusAddr);
      plusAddress = parseInt(plusAddress, 16);

      const plusLabel = this.labelEquLabelPlusAddr;

      this.labelAddresses[this.label] = new LabelAddressEquLabelPlusAddr(
        plusLabel,
        plusAddress,
        this.number
      );
      return 0; // lineLen = 0
    }

    if (this.#isLabelEquLabelPlusLabel()) {
      const labelA = this.labelAEquLabelPlusLabel;
      const labelB = this.labelBEquLabelPlusLabel;

      this.labelAddresses[this.label] = new LabelAddressEquLabelPlusLabel(
        labelA,
        labelB,
        this.number
      );
      return 0; // lineLen = 0
    }
    if (
      this.#isLabel() &&
      !this.#isLabelEquAddrOnly() &&
      !this.#isLabelEquLabelPlusAddr() &&
      !this.#isLabelEquAddrPlusLabel() &&
      !this.#isLabelEquLabelPlusLabel()
    ) {
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

    if (!(commandName in Command.opCodes)) {
      raiseSyntaxError(this.number, "Command '" + commandName + "' undefined");
      return 0;
    }

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
  get address() {
    let addr = this.#extract({ regExp: this.regExp.addressOnly });
    addr = this.#addrToHexOrDec(addr);
    return addr;
  }
  get label() {
    return this.#extract({ regExp: this.regExp.label });
  }
  get addressEquAddrOnly() {
    return this.#extract({
      regExp: this.regExp.labelEquAddrOnly,
      position: "$2",
    });
  }
  get labelEquLabelPlusAddr() {
    return this.#extract({
      regExp: this.regExp.labelEquLabelPlusAddr,
      position: "$2",
    });
  }
  get addressEquLabelPlusAddr() {
    return this.#extract({
      regExp: this.regExp.labelEquLabelPlusAddr,
      position: "$3",
    });
  }
  get labelEquAddrPlusLabel() {
    return this.#extract({
      regExp: this.regExp.labelEquAddrPlusLabel,
      position: "$3",
    });
  }
  get addressEquAddrPlusLabel() {
    return this.#extract({
      regExp: this.regExp.labelEquAddrPlusLabel,
      position: "$2",
    });
  }
  get labelAEquLabelPlusLabel() {
    return this.#extract({
      regExp: this.regExp.labelEquLabelPlusLabel,
      position: "$2",
    });
  }
  get labelBEquLabelPlusLabel() {
    return this.#extract({
      regExp: this.regExp.labelEquLabelPlusLabel,
      position: "$3",
    });
  }
  get commandName() {
    let lineContent = this.content;
    let commandName = "";
    if (lineContent.match(this.regExp.commandWithLeadLabel)) {
      commandName = this.#extract({
        regExp: this.regExp.commandWithLeadLabel,
      }).toUpperCase();
    } else if (lineContent.match(this.regExp.command)) {
      commandName = this.#extract({
        regExp: this.regExp.command,
      }).toUpperCase();
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
      paramName = this.#extract({
        regExp: this.regExp.paramWithLeadLabel,
      }).replace(/[ ]/g, "");
    } else if (lineContent.match(this.regExp.param)) {
      paramName = this.#extract({ regExp: this.regExp.param }).replace(
        /[ ]/g,
        ""
      );
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
  #isLabelEquAddrOnly() {
    if (this.content.match(this.regExp.labelEquAddrOnly)) {
      return true;
    }
    return false;
  }
  #isLabelEquLabelPlusAddr() {
    if (this.content.match(this.regExp.labelEquLabelPlusAddr)) {
      return true;
    }
    return false;
  }
  #isLabelEquAddrPlusLabel() {
    if (this.content.match(this.regExp.labelEquAddrPlusLabel)) {
      return true;
    }
    return false;
  }
  #isLabelEquLabelPlusLabel() {
    if (this.content.match(this.regExp.labelEquLabelPlusLabel)) {
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
  #extract({ regExp = /^$/, position = "$1" } = {}) {
    return this.content.replace(regExp, position);
  }
  #addrToHexOrDec(addr) {
    if (addr[0] == "$") {
      addr = stripLeadingDollarSign(addr);
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
