/*7
 *
 *  6502 assembler and emulator in Javascript
 *  (C)2006-2010 Stian Soreng - www.6502asm.com
 *
 *  Released under the GNU General Public License
 *  see http://gnu.org/licenses/gpl.html
 *
 */

import "jquery"
import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {javascript} from "@codemirror/lang-javascript"
import {Display} from "./display"
import {Debugger} from "./debugger"
import {Flags} from "./flags"
import {
  compileCode,
  runBinary,
  resetEverything,
  hexDump,
  gotoAddr,
  toggleBinaryMode,
  toggleScreenSize,
  togglePresentationMode,
  disableButtons,
  Load,
  keyPress,
  debugExecHolding,
} from "./assembler"

export var test; // hack to initialize variables spanning over modules

exports.labelAddresses;
exports.codeRunning = false;
exports.myInterval;
exports.display = new Display(0x400);
exports.debuggeR = new Debugger(); // for some reason, "debugger" cannot be used
exports.debug = false;
exports.flags = new Flags();
exports.instructionCounter = 0;
exports.memory = {
  reset : function() {return;},
  regSP : 0x0,
};
exports.reg = {
  X : 0x0, // register/index X
  Y : 0x0, // register/index Y
  PC : 0x600, // program counter
}

exports.lastLineText = "";
exports.lastLineNumber = 0;
exports.started = false;

exports.editor = new EditorView({
  state: EditorState.create({
    extensions: [basicSetup, javascript()]
  }),
})

$(".code-area").append(exports.editor.dom);

$("#compileButton").prop("disabled", false);
$("#runButton").prop("disabled", true);
$("#hexDumpButton").prop("disabled", true);
$("#resetButton").prop("disabled", false);
$("#stepButton").prop("disabled", true);
$("#gotoButton").prop("disabled", true);
$("#fileSelect").prop("disabled", false);
$("#compileButton").click(compileCode);
$("#runButton").click(runBinary);
$("#hexDumpButton").click(hexDump);
$("#resetButton").click(resetEverything);
$("#gotoButton").click(gotoAddr);
$("#realTimeDebugCheckbox").click(exports.debuggeR.toggle.bind(exports.debuggeR));
$("#binaryCheckbox").click(toggleBinaryMode);
$("#screen").click(toggleScreenSize);
$("#fileSelect").change((event) => Load({file : event.target.value}));
$("#presentationCheckbox").change(togglePresentationMode);
$("#code").keypress(disableButtons);
document.addEventListener("keypress", keyPress, true);

debugExecHolding("#stepButton", 600, 1.25);

resetEverything();
