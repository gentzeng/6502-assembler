/*
 *  keyPress() - Store keycode in ZP $ff
 */
import {
  Compiler,
  Command
} from "./compiler"
import {
  fmtToHex,
  getUpperByte,
  getLowerByte,
} from "./helper"
import {
  ByteEntry,
  OpCodeByteEntry
} from "./memory"

import {printMessage} from "./message"
import {
  instructions,
} from "./instructions"


export function keyPress(e) {
  if (typeof window.event != "undefined") {
    e = window.event;
  }
  if (e.type == "keypress") {
    exports.memory.writeByte(0xff, new ByteEntry(e.which));
  }
}

/*
 *  gotoAddr() - Set PC to address (or address of label)
 */
export function gotoAddr() {
  var input = prompt("Enter address or label", "");
  var addr = 0;
  if (input in exports.labelAddresses) {
    addr = exports.labelAddresses[input].address;
  } else {
    if (input.match(/^0x[0-9a-f]{1,4}$/i)) {
      input = input.replace(/^0x/, "");
      addr = parseInt(input, 16);
    } else if (input.match(/^\$[0-9a-f]{1,4}$/i)) {
      input = input.replace(/^\$/, "");
      addr = parseInt(input, 16);
    }
  }
  if (addr == 0) {
    alert("Unable to find/parse given address/label");
  } else {
    exports.reg.PC = addr; // the actual goto command
  }
  exports.debuggeR.updateInfo();
}

export function toggleScreenSize() {
  $("#screen").toggleClass("screen-large");
}

export function toggleBinaryMode() {
  exports.debuggeR.updateInfo();
}

export function togglePresentationMode() {
  $("body").toggleClass("presentation-mode");
}

/*
 *  disableButtons() - Disables the Run and Debug buttons when text is
 *                     altered in the code editor
 */
export function disableButtons() {
  exports.codeRunning = false;
  clearInterval(exports.myInterval);
  $("#runButton").prop("disabled", true);
  $("#hexDumpButton").prop("disabled", true);
  $("#fileSelect").prop("disabled", false);
  $("#compileButton").prop("disabled", false);
  $("#runButton").html("Run");
  $("#code").focus();
  $("#stepButton").prop("disabled", true);
  $("#gotoButton").prop("disabled", true);
}

/*
 *  Load() - Loads a file from server
 */
export function Load({file}={}) {
  console.log("loading")
  resetEverything();
  disableButtons();
  $("#code").value = "Loading, please wait ...";
  $("#compileButton").prop("disabled", true);
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = FileLoaded;
  xmlhttp.open("GET", "assets/js/examples/" + file);
  xmlhttp.send(null);
  exports.debuggeR.disable();

  function FileLoaded() {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 200) {
        $("#code").val(xmlhttp.responseText);
        $("#compileButton").prop("disabled", false);
      }
    }
  }
}

/*
 *  resetEverything() - Reset CPU and memory.
 */
export function resetEverything() {
  exports.codeRunning = false;
  $("#messages").html("");
  exports.display.reset();
  exports.memory.reset(); // clear ZP, stack

  exports.reg.A = exports.reg.X = exports.reg.Y = 0x0;
  exports.reg.PC = 0x600;
  exports.flags.clearAll();
  exports.instructionCounter = 0;

  exports.debuggeR.updateInfo();
}

export function compileCode() {
  resetEverything();

  let compiler = new Compiler(exports.editor.state.doc.toString())
    .preprocessCode()
    .scanLabels()
    .compile()
    .insertLabelAddressesToMemory();

  exports.memory = compiler.memory;

  if (compiler.noCode()) {
    printMessage("<b>No code to run.<\b>");
    setGuiNoCode();
  } else {
    setGuiCompileSuccess();
  }
  exports.labelAddresses = compiler.labelAddresses;

  exports.display.updateFull();
  printMessage("Code compiled successfully, " + compiler.codeLen + " bytes.");
  return;

  // helper
  function setGuiNoCode() {
    $("#runButton").prop("disabled", true);
    $("#compileButton").prop("disabled", false);
    $("#fileSelect").prop("disabled", false);
    return;
  }
  function setGuiCompileSuccess() {
    $("#runButton").prop("disabled", false);
    $("#compileButton").prop("disabled", true);
    $("#fileSelect").prop("disabled", false);
    $("#hexDumpButton").prop("disabled", false);
    return;
  }
}

/*
 *  hexDump() - Dump binary as hex to new window
 */

export function hexDump() {
  let w = window.open('', 'hexDump', 'width=500,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no' );

  let html = "<html><head>";
  html += "<link href='style.css' rel='stylesheet' type='text/css' />";
  html += "<title>hexDump</title></head><body>";
  html += "<code>";
  let x;
  for(x = 0; x < exports.memory.codeLen; x++) {
    if ((x & 15) == 0) {
      html += "<br/> ";
      n = (exports.memory.size + x);
      html += fmtToHex(getUpperByte((n)));
      html += fmtToHex(getLowerByte(n));
      html += ": ";
    }
    html += fmtToHex(exports.memory.readByte(exports.memory.size + x).value);
    if (x & 1) {
      html += " ";
    }
  }
  if (x & 1) {
    html += "-- [END]";
  }
  html += "</code></body></html>";
  w.document.write(html);
  w.document.close();
}

/*
 *  runBinary() - Executes the compiled code
 */
export function runBinary() {
  if (exports.codeRunning) {
    /* Switch OFF everything */
    exports.codeRunning = false;
    $("#runButton").html("Run");
    $("#hexDumpButton").prop("disabled", false);
    $("#fileSelect").prop("disabled", false);
    if (!exports.debug) {
      exports.debuggeR.disable();
    }
    clearInterval(exports.myInterval);
  } else {
    $("#runButton").html("Stop");
    $("#hexDumpButton").prop("disabled", true);
    $("#fileSelect").prop("disabled", true);
    if (!exports.debug) {
      $("#stepButton").prop("disabled", !exports.debug);
      $("#gotoButton").prop("disabled", !exports.debug);
    } else {
      $("#stepButton").prop("disabled", false);
      $("#gotoButton").prop("disabled", false);
    }
    exports.codeRunning = true;
    exports.myInterval = setInterval(
      (_) => {multiExecute(32);},
    1);
  }
}

function multiExecute(steps) {
  if (! exports.debug) {
    for(let w = 0; w < steps; w++) {
      executeInstruction();
    }
  }
}

/*
 *  executeInstruction() - Executes one instruction. This is the main part of the CPU emulator.
 */
export function executeInstruction() {
  if (! exports.codeRunning) {
    return;
  }

  let randomByte = Math.floor(Math.random() * 0x100); // 0x100 = 256
  exports.memory.writeByte(0xfe, new ByteEntry(randomByte)); // what does this do?

  let byteEntry = exports.memory.readByte(exports.reg.PC);
  let opCode = byteEntry.value;
  let lineNumber = "       ";
  if (byteEntry instanceof OpCodeByteEntry) {
    lineNumber = " [" + byteEntry.lineNumber.toString().padStart(4, " ") + "]";

    if (exports.debug) {
      highlightCodeLine(byteEntry.lineNumber);
    }


  }


  let instruction = instructions[opCode];
  let name = exports.instructionCounter.toString().padStart(6, " ")
    + "  "
    + instruction.name
    + "/"
    + Command.getOpCodeName(opCode)
    + lineNumber;
  exports.instructionCounter++; //advance instruction counter

  exports.reg.PC++; //advance programm counter
  if (! (byteEntry instanceof OpCodeByteEntry)) {
    console.warn("Using normal ByteEntry as OpCodeByteEntry: " + name);
  }
  let addr = instruction(name);
  if (isDisplayPixel(addr)) {
    exports.display.updatePixel(addr)
  }

  runEnd();
  return;

  function highlightCodeLine(lineNumber) {
    let line = exports.editor.state.doc.line(lineNumber);
    let lineText = line.text;
    exports.editor.dispatch({
      changes: {
        from : line.from,
        to: line.to,
        insert: ">>> " + lineText + " <<<"
      }
    });

    if (exports.started) {
      let lastLine = exports.editor.state.doc.line(exports.lastLineNumber);
      exports.editor.dispatch({
        changes: {
          from : lastLine.from,
          to: lastLine.to,
          insert: exports.lastLineText
        }
      });
    } else {
      exports.started = true;
    }

    exports.lastLineNumber = lineNumber;
    exports.lastLineText = lineText;

    return;
  }

  function isDisplayPixel(addr) {
    if ((addr >= 0x200) && (addr <= 0x5ff)) {
      return true;
    }
    return false;
  }

  function runEnd () {
    if ((exports.reg.PC == 0) || (!exports.codeRunning)) {
      clearInterval(exports.myInterval);
      printMessage("Program end at PC=$" + fmtToHex(exports.reg.PC - 1));
      exports.codeRunning = false;
      $("#stepButton").prop("disabled", true);
      $("#gotoButton").prop("disabled", true);
      $("#runButton").html("Run");
      $("#fileSelect").prop("disabled", false);
      $("#hexDumpButton").prop("disabled", false);
    }
  }
}

// https://stackoverflow.com/questions/79816/need-javascript-code-for-button-press-and-hold
// credits to neouser99
export function debugExecHolding(btn, start, speedup) {
  let timeout;
  let restart = true;
  let step = start;

  $(btn).mousedown(repeat);
  $(btn).mouseup(clearTimeoutT);

  function repeat () {
    if (! exports.codeRunning) {
      return;
    }
    if (restart) {
      step = start;
    }
    restart = false;
    debugExec();
    timeout = setTimeout(repeat, step);
    step /= speedup;
  }
  function debugExec() {
    if (exports.codeRunning) {
      executeInstruction();
    }
    exports.debuggeR.updateInfo();
  }

  function clearTimeoutT () {
    restart = true;
    clearTimeout(timeout)
  }
};
