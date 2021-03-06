import { lineNumbers } from "@codemirror/gutter";
import { Compiler } from "./compiler";
import { Command } from "./compiler-command";
import { fmtToHex, fmtToHexBr } from "./helper";
import { ByteEntry, OpCodeByteEntry } from "./memory";

import { printMessage, resetMessageWindow } from "./message";
import { instructions } from "./instructions";

/*
 *  keyPress() - Store keycode in ZP $ff
 */
export function keyPress(e) {
  if (!exports.codeRunning) {
    return;
  }
  if (typeof window.event != "undefined") {
    e = window.event;
  }
  if (e.type == "keypress") {
    exports.memory.writeByte(0xff, new ByteEntry(e.which, 0xff));
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
  let button = $("#largeModeButton");
  if (button.html() === "Large Mode") {
    button.html("Normal Mode");
  } else if (button.html() === "Normal Mode") {
    button.html("Large Mode");
  }
  $("body").toggleClass("presentation-mode");
}

export function toggleIllegalOpCode() {
  exports.allowIllegalOpcode = !exports.allowIllegalOpcode;
}

/*
 *  Load() - Loads a file from server
 */
export function Load({ file } = {}) {
  exports.codeRunning = false;
  clearInterval(exports.myInterval);

  resetEverything();
  resetMessageWindow();
  $("#code").value = "Loading, please wait ...";
  $("#compileButton").prop("disabled", true);
  $.ajax({
    url: "./assets/js/examples/" + file,
    success: function (data, textStatus, _) {
      if (textStatus == 200) {
        $("#code").val(data);
        $("#compileButton").prop("disabled", false);
      }
    },
  });
  exports.debuggeR.disable();
}

/*
 *  resetEverything() - Reset CPU, memory and html (partly).
 */
export function resetEverything() {
  exports.compiler = null;
  exports.error = false;
  exports.codeRunning = false;
  exports.display.reset();
  exports.memory.reset(); // clear ZP, stack

  exports.reg.A = exports.reg.X = exports.reg.Y = 0x0;
  exports.reg.PC = 0x600;
  exports.flags.clearAll();
  exports.instructionCounter = 0;

  exports.debuggeR.updateInfo();

  $("#code").focus();
  $("#runButton").prop("disabled", true);
  $("#runButton").html("Run");
  $("#compileButton").prop("disabled", false);
  $("#fileSelect").prop("disabled", false);
  $("#stepButton").prop("disabled", true);
  $("#gotoButton").prop("disabled", true);
  $("#hexViewerButton").prop("disabled", true);
  $("#hexDumpButton").prop("disabled", true);
  $("#plainHexDumpButton").prop("disabled", true);
}

export function compileCode() {
  resetEverything();
  resetMessageWindow();

  const codeToCompileDoc = exports.editor.state.doc;
  const codeToCompile = codeToCompileDoc.toString();
  exports.codeToCompile = codeToCompile;
  if (codeToCompile === "") {
    resetEverything();
    printMessage("<b>No code in editor.<\b>");
    return;
  }

  let compiler = new Compiler(codeToCompile).preprocessCode();
  exports.compiler = compiler;

  if (compiler.noCode()) {
    resetEverything();
    printMessage("<b>No code to run.<\b>");
    return;
  }

  compiler
    .scanLabels()
    .compile()
    .resolveEquLabelAddresses()
    .insertLabelAddressesToMemory();

  if (exports.error) {
    resetEverything();
    return true;
  }

  exports.memory = compiler.memory;

  if (exports.debug) {
    console.log(exports.memory.toString());
  }
  setGuiCompileSuccess();

  exports.labelAddresses = compiler.labelAddresses;

  exports.display.updateFull();
  printMessage("Code compiled successfully, " + compiler.codeLen + " bytes.");

  setEditorLineNumbers();

  return;

  // helper
  function setGuiCompileSuccess() {
    $("#runButton").prop("disabled", false);
    $("#compileButton").prop("disabled", true);
    $("#fileSelect").prop("disabled", false);
    $("#hexViewerButton").prop("disabled", false);
    $("#hexDumpButton").prop("disabled", false);
    $("#plainHexDumpButton").prop("disabled", false);
    return;
  }
}

export function setEditorLineNumbers() {
  const lineNumbersForEditor = exports.memory.getLineNumbersForEditor();
  const lineCount = exports.editor.viewState.state.doc.length;

  const formatLineNumber = (n, _) => {
    let n_str = n.toString();

    if (!(n in lineNumbersForEditor)) {
      return n_str;
    }

    n_str = addLeadingSpace(n_str, lineCount.toString().length);

    const lineNumber = 0x600 + lineNumbersForEditor[n];
    const ret = `${fmtToHexBr(lineNumber)} ${n_str}`;
    return ret;
  };

  exports.editor.dispatch({
    effects: exports.lineNumberCompartment.reconfigure(
      lineNumbers({ formatNumber: formatLineNumber })
    ),
  });

  // helper
  function addLeadingSpace(n, size) {
    while (n.length < size) {
      n = " " + n;
    }
    return n;
  }
}

/*
 *  hexDump() - Dump binary as hex to new window in Hex Viewer style
 */
export function hexViewer() {
  let w = window.open(
    "",
    "HexViewer",
    "width=600,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no"
  );

  let html = "<html><head>";
  html += "<meta charset='utf-8'";
  html +=
    "<link href='assets/css/style.css' rel='stylesheet' type='text/css' />";
  html +=
    "<link href='assets/css/bootstrap.min.css' rel='stylesheet' type='text/css' />";
  html += "<title>HexViewer</title></head><body>";
  html += "<div class='container-fluid'>";
  html += "<div class='row d-flex justify-content-center'>";
  html += "<div class='col vh-100 overflow-auto'>";
  html += "<h3>";
  html += "HexViewer";
  html += "</h3>";
  html += "<div class='dropdown'>";
  html += "<button class='btn btn-light dropdown-toggle' type='button'";
  html +=
    "id='buttonDropDownOffset' data-bs-toggle='dropdown' aria-expanded='false'>";
  html += "Choose Offset Size";
  html += "</button>";
  html += "<ul class='dropdown-menu' aria-labelledby='buttonDropDownOffset'>";
  html +=
    "<li><a class='dropdown-item' href='#' onClick='adjustOffset(this.innerHTML)'>2</a></li>";
  html +=
    "<li><a class='dropdown-item' href='#' onClick='adjustOffset(this.innerHTML)'>4</a></li>";
  html +=
    "<li><a class='dropdown-item' href='#' onClick='adjustOffset(this.innerHTML)'>8</a></li>";
  html +=
    "<li><a class='dropdown-item' href='#' onClick='adjustOffset(this.innerHTML)'>12</a></li>";
  html +=
    "<li><a class='dropdown-item' href='#' onClick='adjustOffset(this.innerHTML)'>16</a></li>";
  html += "</ul>";
  html += "</div>";
  html += "<div>";
  html += "<a href='#idCodeBegin'>Goto begin of Codearea (0x600)</a>";
  html += "</div>";
  html += "<pre style='font-family:monospace'>";

  html += "<div class='dumpHTML d-none' id='dumpHTML2'>";
  html += exports.memory.hexViewer({ offset: 0x2 });
  html += "-- [END]";
  html += "</div>";

  html += "<div class='dumpHTML' id='dumpHTML4'>";
  html += exports.memory.hexViewer({ offset: 0x4 });
  html += "-- [END]";
  html += "</div>";

  html += "<div class='dumpHTML d-none' id='dumpHTML8'>";
  html += exports.memory.hexViewer({ offset: 0x8 });
  html += "-- [END]";
  html += "</div>";

  html += "<div class='dumpHTML d-none' id='dumpHTML12'>";
  html += exports.memory.hexViewer({ offset: 0xc });
  html += "-- [END]";
  html += "</div>";

  html += "<div class='dumpHTML d-none' id='dumpHTML16'>";
  html += exports.memory.hexViewer({ offset: 0x10 });
  html += "-- [END]";
  html += "</div>";

  html += "</pre>";
  html += "</div>";
  html += "</div>";
  html += "</div>";
  html +=
    "<script type='text/javascript' src='assets/js/bootstrap.bundle.min.js'></script>";
  html += "<script>";
  html += "function adjustOffset(offset) {\n";
  html += "  const offsets = [2,4,8,12,16];\n";
  html += "  offsets.forEach(offset_i => {\n";
  html += "    const offset_i_str = offset_i.toString();\n";
  html +=
    "    const dumpElem = document.getElementById(`dumpHTML${offset_i_str}`)\n";
  html += "    if (offset_i_str === offset) {\n";
  html += "      if (dumpElem.classList.contains('d-none')) {\n";
  html += "        dumpElem.classList.remove('d-none');\n";
  html += "      }\n";
  html += "    } else {\n";
  html += "      dumpElem.classList.add('d-none');\n";
  html += "    }\n";
  html += "  });\n";
  html += "}";
  html += "</script>";
  html += "</body></html>";
  w.document.write(html);
  w.document.close();

  //helper
  function adjustOffset(offset) {
    $(".dumpHTML").html(exports.memory.hexViewer({ offset: offset }));
  }
}

/*
 *  hexDump() - Dump binary as hex to new window
 */
export function hexDump({ plain = false } = {}) {
  let w = window.open(
    "",
    plain ? "plainHexDump" : "hexDump",
    "width=600,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no"
  );

  let html = "<html><head>";
  html += "<meta charset='utf-8'";
  html +=
    "<link href='assets/css/style.css' rel='stylesheet' type='text/css' />";
  html +=
    "<link href='assets/css/bootstrap.min.css' rel='stylesheet' type='text/css' />";
  html += "<title>hexDump</title></head><body>";
  html += "<div class='container'>";
  html += "<div class='row d-flex justify-content-center'>";
  html += "<div class='col vh-100 overflow-auto'>";
  html += "<h3>";
  html += plain === true ? "PlainHexDump" : "HexDump";
  html += "</h3>";
  html += "<div>";
  html += "<a href='#idCodeBegin'>Goto begin of Codearea (0x600)</a>";
  html += "</div>";
  html += "<div class='dumpHTML'>";
  html += "<pre style='font-family:monospace'>";

  html +=
    plain === true ? exports.memory.dumpPlainHTML() : exports.memory.dumpHTML();

  html += "-- [END]";
  html += "</pre>";
  html += "</div>";
  html += "</div>";
  html += "</div>";
  html += "</div>";
  html +=
    "<script type='text/javascript' src='assets/js/bootstrap.min.js'></script>";
  html += "</body></html>";
  w.document.write(html);
  w.document.close();
}

/*
 *  runBinary() - Executes the compiled code
 */
export function runBinary() {
  if (exports.codeRunning) {
    stopBinary();
  } else {
    startBinary();
  }
}

/*
 *  startBinary() - Start the running Binary
 */
function startBinary() {
  $("#runButton").html("Stop");
  $("#hexViewerButton").prop("disabled", true);
  $("#hexDumpButton").prop("disabled", true);
  $("#plainHexDumpButton").prop("disabled", true);
  $("#fileSelect").prop("disabled", true);
  if (!exports.debug) {
    $("#stepButton").prop("disabled", !exports.debug);
    $("#gotoButton").prop("disabled", !exports.debug);
  } else {
    $("#stepButton").prop("disabled", false);
    $("#gotoButton").prop("disabled", false);
  }
  exports.codeRunning = true;
  exports.myInterval = setInterval((_) => {
    multiExecute();
  }, 1);
}

/*
 *  runBinary() - Stop the running Binary
 */
export function stopBinary() {
  resetEditor();
  exports.codeRunning = false;
  $("#runButton").html("Run");
  $("#hexViewerButton").prop("disabled", false);
  $("#hexDumpButton").prop("disabled", false);
  $("#plainHexDumpButton").prop("disabled", false);
  $("#fileSelect").prop("disabled", false);
  if (!exports.debug) {
    exports.debuggeR.disable();
  }
  clearInterval(exports.myInterval);

  //helper
  function resetEditor() {
    if (typeof exports.codeToCompile !== "undefined") {
      exports.editor.dispatch({
        changes: {
          from: 0,
          to: exports.editor.state.doc.length,
          insert: exports.codeToCompile,
        },
      });
    }
  }
}

function multiExecute() {
  if (!exports.debug) {
    for (let w = 0; w < exports.steps; w++) {
      executeInstruction();
    }
  }
}

/*
 *  executeInstruction() - Executes one instruction. This is the main part of the CPU emulator.
 */
export function executeInstruction() {
  if (exports.processorLocked) {
    return;
  }
  if (!exports.codeRunning) {
    return;
  }

  let randomByte = Math.floor(Math.random() * 0x100); // 0x100 = 256
  exports.memory.writeByte(0xfe, new ByteEntry(randomByte, 0xfe)); // what does this do?

  let byteEntry = exports.memory.readByte(exports.reg.PC);
  if (exports.debug) {
    highlightCodeLine(byteEntry.lineNumber);
  }
  let opCode = byteEntry.value;
  let lineNumber =
    " [" + byteEntry.lineNumber.toString().padStart(4, " ") + "]";

  let instruction = instructions[opCode];
  let name =
    exports.instructionCounter.toString().padStart(6, " ") +
    "  " +
    instruction.name +
    "/" +
    Command.getOpCodeName(opCode) +
    lineNumber;
  exports.instructionCounter++; //advance instruction counter

  exports.reg.PC++; //advance programm counter
  if (!(byteEntry instanceof OpCodeByteEntry)) {
    console.warn("Using normal ByteEntry as OpCodeByteEntry: " + name);
  }
  let addr = instruction(name);
  if (isDisplayPixel(addr)) {
    exports.display.updatePixel(addr);
  }

  runEnd();
  return;

  function highlightCodeLine(lineNumber) {
    let line = exports.editor.state.doc.line(lineNumber);
    $(".cm-content")
      .children()
      .eq(lineNumber - 1)
      .css("background-color", "#C0C0C0");
    let lineText = line.text;
    exports.editor.dispatch({
      changes: {
        from: line.from,
        to: line.to,
        insert: lineText,
      },
    });

    if (exports.started) {
      $(".cm-content")
        .children()
        .eq(exports.lastLineNumber - 1)
        .css("background-color", "white");
      let lastLine = exports.editor.state.doc.line(exports.lastLineNumber);
      exports.editor.dispatch({
        changes: {
          from: lastLine.from,
          to: lastLine.to,
          insert: exports.lastLineText,
        },
      });
    } else {
      exports.started = true;
    }

    exports.lastLineNumber = lineNumber;
    exports.lastLineText = lineText;

    return;
  }

  function isDisplayPixel(addr) {
    if (addr >= 0x200 && addr <= 0x5ff) {
      return true;
    }
    return false;
  }

  function runEnd() {
    if (exports.reg.PC == 0 || !exports.codeRunning) {
      clearInterval(exports.myInterval);
      printMessage("Program end at PC=$" + fmtToHex(exports.reg.PC - 1));
      exports.codeRunning = false;
      $("#stepButton").prop("disabled", true);
      $("#gotoButton").prop("disabled", true);
      $("#runButton").html("Run");
      $("#fileSelect").prop("disabled", false);
      $("#hexViewerButton").prop("disabled", false);
      $("#hexDumpButton").prop("disabled", false);
      $("#plainHexDumpButton").prop("disabled", false);
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

  function repeat() {
    if (!exports.codeRunning) {
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

  function clearTimeoutT() {
    restart = true;
    clearTimeout(timeout);
  }
}
