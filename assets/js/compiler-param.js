import {
  printMessage,
  raiseLabelError,
  raiseRangeError,
  raiseDCBValueError,
  raiseAddressingModeError,
} from "./message";

import { WordEntry, LabelEntry, ByteEntry } from "./memory";

export class Param {
  static regExps = {
    label: /^\w+/,
    labelIndirect: /^\(\w+\)/,
    relativeHexNo: /^\$([0-9a-f]{1,2})/,
    relativeDecNo: /^([0-9]{1,3})/,
    relativeDecMinusNo: /^-([0-9]{1,3})/,
    immediateHexNo: /^#\$([0-9a-f]{1,2})/,
    immediateDecNo: /^#([0-9]{1,3})/,
    highLowLabel: /^#[<>]\w+/,
    zeroPageHexNo: /^\$([0-9a-f]{1,2})/,
    zeroPageDecNo: /^([0-9]{1,3})/,
    absoluteHexNo: /^\$([0-9a-f]{1,4})/, // Todo:, wht not length 1,4?
    absoluteDecNo: /^([0-9]{1,5})/, // Todo: Why not only length of 4,5?
    absoluteHexNoIndirect: /^\$\(([0-9a-f]{1,4})\)/,
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
    if (
      !this.#isLabel() &&
      !this.#isRelativeHexNumber() &&
      !this.#isRelativeDecNumber()
    ) {
      return false;
    }
    return true;
  }
  isRelativeMinus() {
    if (!this.#isRelativeDecMinusNumber()) {
      return false;
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

  #isRelativeHexNumber() {
    return this.#matchesRegExp({ regExp: Param.regExps.relativeHexNo });
  }
  #isRelativeDecNumber() {
    return this.#matchesRegExp({ regExp: Param.regExps.relativeDecNo });
  }
  #isRelativeDecMinusNumber() {
    return this.#matchesRegExp({
      regExp: Param.regExps.relativeDecMinusNo,
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
  pushForBranch() {
    if (this.#isRelativeHexNumber()) {
      let byte = extractRelativeHexNumber.bind(this)();
      this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    if (this.#isRelativeDecNumber()) {
      let byte = extractRelativeDecNumber.bind(this)();
      this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    if (this.#isRelativeDecMinusNumber()) {
      let byte = extractRelativeDecMinusNumber.bind(this)();
      this.memory.pushByte(new ByteEntry(byte, this.lineNumber));
      return 1; // for lineLen/codeLen
    }
    if (this.#isLabel()) {
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
    }
    throw "Call pushForBranch() only if isBranch() or isRelative(|Minus) is true!";

    // helper
    function extractRelativeHexNumber() {
      return this.#extractNumber({ regExp: Param.regExps.relativeHexNo });
    }
    function extractRelativeDecNumber() {
      return this.#extractNumber({
        regExp: Param.regExps.relativeDecNo,
        base: 10,
        max: 127, // here, we are using the m number with an implicit plus sign.
        // hence, the max twos complement number is 127
      });
    }
    function extractRelativeDecMinusNumber() {
      return this.#extractNumber({
        regExp: Param.regExps.relativeDecMinusNo,
        base: 10,
        max: 128, // here, we are using the min number with a sign.
        // hence, the min twos complement number, FF is becoming -128
      });
    }
  }
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

export class ParamFactory {
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
    } else if (param.isBranchCommand() && param.isRelativeMinus()) {
      addrModeName = "relativeMinus";
      pushFunction = param.pushForBranch;
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
