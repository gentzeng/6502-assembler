import { fmtToHex, fmtToHexWord, fmtToBin } from "./helper";

export class Debugger {
  constructor() {}
  toggle() {
    if (exports.debug) {
      this.disable();
    } else {
      this.enable();
    }
  }

  disable() {
    exports.debug = false;
    $("#stepButton").prop("disabled", true);
    $("#gotoButton").prop("disabled", true);
    if (exports.started) {
      //reset highlighting
      let lastLine = exports.editor.state.doc.line(exports.lastLineNumber);
      exports.editor.dispatch({
        changes: {
          from: lastLine.from,
          to: lastLine.to,
          insert: exports.lastLineText,
        },
      });
    }
  }

  enable() {
    exports.debug = true;
    // if (codeRunning) {
    this.updateInfo();
    $("#stepButton").prop("disabled", false);
    $("#gotoButton").prop("disabled", false);
    // }
  }

  updateInfo() {
    let binaryMode = $("#binaryCheckbox").prop("checked");

    let infoCellIDPrefix = "debug-info-content-";
    let register = ["A", "X", "Y", "PC"];
    let infoCell = null;

    register.map((regName) => {
      let infoCell = $("#" + infoCellIDPrefix + regName);
      infoCell.html(
        binaryMode
          ? fmtToBin(exports.reg[regName])
          : "$" + fmtToHex(exports.reg[regName])
      );
    });
    infoCell = $("#" + infoCellIDPrefix + "SP");
    infoCell.html(
      binaryMode
        ? fmtToBin(exports.memory.regSP)
        : "$" + fmtToHex(exports.memory.regSP)
    );

    infoCell = $("#" + infoCellIDPrefix + "P");
    let statusRegister =
      "NV-BDIZC<br>" +
      fmtToBin(exports.flags.byte) +
      "    $" +
      fmtToHex(exports.flags.byte);
    infoCell.html(statusRegister);
  }
}
