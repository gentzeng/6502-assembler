import { Command } from "./compiler-command";
import { LabelAddress } from "./compiler-labelAdress";
import { ParamFactory } from "./compiler-param";
import { raiseSyntaxError, raiseLabelError, raiseRangeError } from "./message";

export class CodeLine {
  constructor(content, number) {
    this.content = content;
    this.number = number;
    this.labelAddresses;
    this.regExp = {
      addressOnly: /^\*[\s]*=[\s]*([\$]?[0-9a-f]*)$/,
      label: /^(\w+):.*$/,
      labelWithEquAddrOnly: /^\w+:\s+(equ|EQU)\s+(\$[0-9a-f]+).*/,
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
      console.log(label, labelAddresses[label]);
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
    raiseSyntaxError(this.number, "Command '" + commandName + "' undefined");
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
  get addressFromLabelWithEquAddrOnly() {
    return this.#extract(this.regExp.labelWithEquAddrOnly);
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
  #isLabelWithEquAddrOnly() {
    if (this.content.match(this.regExp.labelWithEquAddrOnly)) {
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
