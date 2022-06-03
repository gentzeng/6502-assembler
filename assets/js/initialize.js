/*
 *
 *  6502 assembler and emulator in Javascript
 *  (C)2006-2010 Stian Soreng - www.6502asm.com
 *
 *  Released under the GNU General Public License
 *  see http://gnu.org/licenses/gpl.html
 *
 */

import "jquery";
import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { lineNumbers } from "@codemirror/gutter";
import { Compartment } from "@codemirror/state";
//import { assembler6502 } from "6502assemblerCodeMix6";
//import { langTest } from "codemirror6langtest";
import { StreamLanguage } from "@codemirror/stream-parser";
import { gas } from "@codemirror/legacy-modes/mode/gas";
import { foldGutter } from "@codemirror/fold";
import { Display } from "./display";
import { Debugger } from "./debugger";
import { resetMessageWindow } from "./message";
import { Flags } from "./flags";
import {
  compileCode,
  runBinary,
  resetEverything,
  hexViewer,
  hexDump,
  gotoAddr,
  toggleBinaryMode,
  toggleScreenSize,
  togglePresentationMode,
  toggleIllegalOpCode,
  Load,
  keyPress,
  debugExecHolding,
} from "./assembler";

export var test; // hack to initialize variables spanning over modules

exports.compiler = null;
exports.labelAddresses;
exports.codeRunning = false;
exports.myInterval;
exports.display = new Display(0x400);
exports.debuggeR = new Debugger(); // for some reason, "debugger" cannot be used
exports.debug = false;
exports.flags = new Flags();
exports.instructionCounter = 0;
exports.memory = {
  reset: function () {
    return;
  },
  regSP: 0x0,
};
exports.reg = {
  X: 0x0, // register/index X
  Y: 0x0, // register/index Y
  PC: 0x600, // program counter
};

exports.error = false;
exports.addressLineNumbers = {};

exports.lastLineText = "";
exports.lastLineNumber = 0;
exports.started = false;

exports.allowIllegalOpcode;

// editor stuff
(exports.lineNumberCompartment = new Compartment(
  (exports.processorLocked = false)
)),
  (exports.editor = new EditorView({
    state: EditorState.create({
      extensions: [
        basicSetup,
        StreamLanguage.define(gas),
        //assembler6502(),
        //langTest(),
        foldGutter(),
        exports.lineNumberCompartment.of(lineNumbers()),
      ],
    }),
  }));

$(".code-area").append(exports.editor.dom);

$("#realTimeDebugCheckbox").click(
  exports.debuggeR.toggle.bind(exports.debuggeR)
);
$("#binaryCheckbox").click(toggleBinaryMode);
$("#screen").click(toggleScreenSize);
$("#illegalOpCodeCheckbox").click(toggleIllegalOpCode);

// $("#code").keypress(disableButtons);
document.addEventListener("keypress", keyPress, true);

$("#compileButton").click(compileCode);
$("#runButton").click(runBinary);
$("#resetButton").click((_) => {
  resetEverything();
  resetMessageWindow();
});
$("#hexViewerButton").click(hexViewer);
$("#hexDumpButton").click(hexDump);
$("#plainHexDumpButton").click(() => hexDump({ plain: true }));
$("#largeModeButton").click(togglePresentationMode);
$("#fileSelect").change((event) => Load({ file: event.target.value }));
$("#gotoButton").click(gotoAddr);

$("#realTimeDebugCheckbox").prop("checked", false);
$("#binaryCheckbox").prop("checked", false);
$("#illegalOpCodeCheckbox").prop("checked", false);

$("#largeModeButton").prop("disabled", false);

$("#hexViewerButton").prop("disabled", true);
$("#hexDumpButton").prop("disabled", true);
$("#plainHexDumpButton").prop("disabled", true);
$("#resetButton").prop("disabled", false);
$("#stepButton").prop("disabled", true);
$("#gotoButton").prop("disabled", true);

debugExecHolding("#stepButton", 600, 1.25);

resetEverything();
resetMessageWindow();
let slider = $("#stepsSlider");
slider.val(5);

exports.steps = 2 ** 5;
slider.on("input", function () {
  exports.steps = 2 ** this.value;
});
