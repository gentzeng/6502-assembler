import {
  fmtToHex,
  fmtToHexWord,
  fmtToBin,
} from "./helper"

export class Debugger {
  constructor() {
  }
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
    if (exports.started) { //reset highlighting
      let lastLine = exports.editor.state.doc.line(exports.lastLineNumber);
      exports.editor.dispatch({
        changes: {
          from : lastLine.from,
          to: lastLine.to,
          insert: exports.lastLineText
        }
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
    let html = "";

    html += this.#generateInfoCell("A", binaryMode ? fmtToBin(exports.reg.A) : "$" + fmtToHex(exports.reg.A));
    html += this.#generateInfoCell("X", binaryMode ? fmtToBin(exports.reg.X) : "$" + fmtToHex(exports.reg.X));
    html += this.#generateInfoCell("Y", binaryMode ? fmtToBin(exports.reg.Y) : "$" + fmtToHex(exports.reg.Y));
    html += this.#generateInfoCell("SP", binaryMode ? fmtToBin(exports.memory.regSP) : "$" + fmtToHex(exports.memory.regSP));
    html += this.#generateInfoCell("PC", binaryMode ? fmtToBin(exports.reg.PC) : "$" + fmtToHex(exports.reg.PC));
    // html += this.#generateInfoCell("SP", "$" + fmtToHex(exports.memory.regSP));
    // html += this.#generateInfoCell("PC", "$" + fmtToHexWord(exports.reg.PC));


    // let statusRegister = binaryMode ? "NV-BDIZC<br>" + fmtToBin(exports.flags.byte) : "$" + fmtToHex(exports.flags.byte);
    let statusRegister = "NV-BDIZC<br>" + fmtToBin(exports.flags.byte) + "    $" + fmtToHex(exports.flags.byte);

    html += "<div class='debug-info debug-info-status'><div class='debug-info-label'>P</div><div class='debug-info-content'>" + statusRegister + "</div></div>"


    $("#md").html(html);
  }

  #generateInfoCell(label, content) {
    return "<div class='debug-info'><div class='debug-info-label'>" + label + "</div><div class='debug-info-content'>" + content + "</div></div>"
  }
}