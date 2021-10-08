/*
 *  6502 assembler and emulator in Javascript
 *  (C)2006-2010 Stian Soreng - www.6502asm.com
 *
 *  Released under the GNU General Public License
 *  see http://gnu.org/licenses/gpl.html
 *
 */

class MemoryStack {
  constructor(size) {
    this._memoryStack = new Array(size);
    this._regSP = 0x100
    this.size = size
  }

  get stack () {
    return this._memoryStack
  }

  getElement (address) {
    return this._memoryStack[address]
  }

  setElement (address, element) {
    return this._memoryStack[address] = element
  }

  get regSP () {
    return this._regSP
  }

  set regSP (address) {
    this._regSP = address
  }

  reset(){
    for( x=0; x<this.size; x++ ) { // clear ZP, stack and screen
      this._memoryStack[x] = 0x00;
    }
    this._regSP = 0x100;
  }

  push( value ) { // push byte to stack
    if( this._regSP >= 0 ) {
    this._regSP--;
    this._memoryStack[(this._regSP&0xff)+0x100] = value & 0xff;
    } else {
    printMessage( "Stack full: " + this._regSP );
    codeRunning = false;
    }
  }

  pop() { //Pop byte from stack
    if( this._regSP < 0x100 ) {
      value = this._memoryStack[this._regSP+0x100];
      this._regSP++;
      return value;
    } else {
      printMessage( "Stack empty" );
      codeRunning = false;
      return 0;
    }
  }

  pushByte(value) { //Push byte to compiledCode variable
    this._memoryStack[defaultCodePC] = value & 0xff;
    defaultCodePC++;
    codeLen++;
  }

  pushWord(value) { //Push a word
    this.pushByte(value & 0xff);
    this.pushByte((value>>8) & 0xff);
  }

  popByte() {
    return ( this._memoryStack[regPC++] & 0xff );
  }

  popWord() {
    return this.popByte() + (this.popByte() << 8);
  }
}
var BREAK_EXCEPTION = {};
var MAX_MEM = ((32*32)-1);
var codeCompiledOK = false;
var regA = 0;
var regX = 0;
var regY = 0;
var regP = 0;
var regPC = 0x600;
var memoryStack = new MemoryStack(0x600);
var runForever = false;
var labelAddresses = {};
var codeRunning = false;
var xmlhttp;
var myInterval;
var display = new Array( 0x400 );
var defaultCodePC = 0x600;
var debug = false;
var palette = new Array(
  "#000000", "#ffffff", "#880000", "#aaffee",
  "#cc44cc", "#00cc55", "#0000aa", "#eeee77",
  "#dd8855", "#664400", "#ff7777", "#333333",
  "#777777", "#aaff66", "#0088ff", "#bbbbbb"
);

var instructions = new Array( // /**/ means legal instruction
  i00, /**/ i01, i02,      i03, i04,      i05, /**/ i06, /**/ i07, i08, /**/ i09, /**/ i0a, /**/ i0b,      i0c,      i0d, i0e, /**/ i0f,
  i10, /**/ i11, i12,      i13, i14,      i15, /**/ i16, /**/ i17, i18, /**/ i19, /**/ i1a,      i1b,      i1c,      i1d, i1e, /**/ i1f,
  i20, /**/ i21, i22,      i23, i24, /**/ i25, /**/ i26, /**/ i27, i28, /**/ i29, /**/ i2a, /**/ i2b,      i2c, /**/ i2d, i2e, /**/ i2f,
  i30, /**/ i31, i32,      i33, i34,      i35, /**/ i36, /**/ i37, i38, /**/ i39, /**/ i3a,      i3b,      i3c,      i3d, i3e, /**/ i3f,
  i40, /**/ i41, i42,      i43, i44,      i45, /**/ i46, /**/ i47, i48, /**/ i49, /**/ i4a, /**/ i4b,      i4c, /**/ i4d, i4e, /**/ i4f,
  i50, /**/ i51, i52,      i53, i54,      i55, /**/ i56, /**/ i57, i58, /**/ i59, /**/ i5a,      i5b, /**/ i5c,      i5d, i5e, /**/ i5f,
  i60, /**/ i61, i62,      i63, i64,      i65, /**/ i66, /**/ i67, i68, /**/ i69, /**/ i6a, /**/ i6b,      i6c, /**/ i6d, i6e, /**/ i6f,
  i70, /**/ i71, i72,      i73, i74,      i75, /**/ i76, /**/ i77, i78, /**/ i79, /**/ i7a,      i7b,      i7c,      i7d, i7e, /**/ i7f,
  i80,      i81, i82,      i83, i84, /**/ i85, /**/ i86, /**/ i87, i88, /**/ i89,      i8a, /**/ i8b,      i8c, /**/ i8d, i8e, /**/ i8f,
  i90, /**/ i91, i92,      i93, i94, /**/ i95, /**/ i96, /**/ i97, i98, /**/ i99, /**/ i9a, /**/ i9b,      i9c,      i9d, i9e,      i9f,
  ia0, /**/ ia1, ia2, /**/ ia3, ia4, /**/ ia5, /**/ ia6, /**/ ia7, ia8, /**/ ia9, /**/ iaa, /**/ iab,      iac, /**/ iad, iae, /**/ iaf,
  ib0, /**/ ib1, ib2,      ib3, ib4, /**/ ib5, /**/ ib6, /**/ ib7, ib8, /**/ ib9, /**/ iba,      ibb,      ibc, /**/ ibd, ibe, /**/ ibf,
  ic0, /**/ ic1, ic2,      ic3, ic4, /**/ ic5, /**/ ic6, /**/ ic7, ic8, /**/ ic9, /**/ ica,      icb,      icc, /**/ icd, ice, /**/ icf,
  id0, /**/ id1, id2,      id3, id4,      id5, /**/ id6, /**/ id7, id8, /**/ id9, /**/ ida,      idb,      idc,      idd, ide, /**/ idf,
  ie0, /**/ ie1, ie2,      ie3, ie4, /**/ ie5, /**/ ie6, /**/ ie7, ie8, /**/ ie9, /**/ iea, /**/ ieb,      iec, /**/ ied, iee, /**/ ief,
  if0, /**/ if1, if2,      if3, if4,      if5, /**/ if6, /**/ if7, if8, /**/ if9, /**/ ifa,      ifb, /**/ ifc,      ifd, ife, /**/ iff,
);

var Opcodes = new Array(

  /*     Name, Imm,  ZP,   ZPX,  ZPY,  ABS,  ABSX, ABSY, INDX, INDY, SNGL, BRA */

  Array("ADC", 0x69, 0x65, 0x75, 0x00, 0x6d, 0x7d, 0x79, 0x61, 0x71, 0x00, 0x00 ),
  Array("AND", 0x29, 0x25, 0x35, 0x00, 0x2d, 0x3d, 0x39, 0x21, 0x31, 0x00, 0x00 ),
  Array("ASL", 0x00, 0x06, 0x16, 0x00, 0x0e, 0x1e, 0x00, 0x00, 0x00, 0x0a, 0x00 ),
  Array("BIT", 0x00, 0x24, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("BPL", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10 ),
  Array("BMI", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30 ),
  Array("BVC", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50 ),
  Array("BVS", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x70 ),
  Array("BCC", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x90 ),
  Array("BCS", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xb0 ),
  Array("BNE", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xd0 ),
  Array("BEQ", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0 ),
  Array("CMP", 0xc9, 0xc5, 0xd5, 0x00, 0xcd, 0xdd, 0xd9, 0xc1, 0xd1, 0x00, 0x00 ),
  Array("CPX", 0xe0, 0xe4, 0x00, 0x00, 0xec, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("CPY", 0xc0, 0xc4, 0x00, 0x00, 0xcc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("DEC", 0x00, 0xc6, 0xd6, 0x00, 0xce, 0xde, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("EOR", 0x49, 0x45, 0x55, 0x00, 0x4d, 0x5d, 0x59, 0x41, 0x51, 0x00, 0x00 ),
  Array("CLC", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x00 ),
  Array("SEC", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x38, 0x00 ),
  Array("CLI", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x58, 0x00 ),
  Array("SEI", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x78, 0x00 ),
  Array("CLV", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xb8, 0x00 ),
  Array("CLD", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xd8, 0x00 ),
  Array("SED", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf8, 0x00 ),
  Array("INC", 0x00, 0xe6, 0xf6, 0x00, 0xee, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("JMP", 0x00, 0x00, 0x00, 0x00, 0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("JSR", 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("LDA", 0xa9, 0xa5, 0xb5, 0x00, 0xad, 0xbd, 0xb9, 0xa1, 0xb1, 0x00, 0x00 ),
  Array("LDX", 0xa2, 0xa6, 0x00, 0xb6, 0xae, 0x00, 0xbe, 0x00, 0x00, 0x00, 0x00 ),
  Array("LDY", 0xa0, 0xa4, 0xb4, 0x00, 0xac, 0xbc, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("LSR", 0x00, 0x46, 0x56, 0x00, 0x4e, 0x5e, 0x00, 0x00, 0x00, 0x4a, 0x00 ),
  Array("NOP", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xea, 0x00 ),
  Array("ORA", 0x09, 0x05, 0x15, 0x00, 0x0d, 0x1d, 0x19, 0x01, 0x11, 0x00, 0x00 ),
  Array("TAX", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xaa, 0x00 ),
  Array("TXA", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x8a, 0x00 ),
  Array("DEX", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xca, 0x00 ),
  Array("INX", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe8, 0x00 ),
  Array("TAY", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa8, 0x00 ),
  Array("TYA", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x98, 0x00 ),
  Array("DEY", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x88, 0x00 ),
  Array("INY", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc8, 0x00 ),
  Array("ROR", 0x00, 0x66, 0x76, 0x00, 0x6e, 0x7e, 0x00, 0x00, 0x00, 0x6a, 0x00 ),
  Array("ROL", 0x00, 0x26, 0x36, 0x00, 0x2e, 0x3e, 0x00, 0x00, 0x00, 0x2a, 0x00 ),
  Array("RTI", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00 ),
  Array("RTS", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x60, 0x00 ),
  Array("SBC", 0xe9, 0xe5, 0xf5, 0x00, 0xed, 0xfd, 0xf9, 0xe1, 0xf1, 0x00, 0x00 ),
  Array("STA", 0x00, 0x85, 0x95, 0x00, 0x8d, 0x9d, 0x99, 0x81, 0x91, 0x00, 0x00 ),
  Array("TXS", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9a, 0x00 ),
  Array("TSX", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xba, 0x00 ),
  Array("PHA", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x48, 0x00 ),
  Array("PLA", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x68, 0x00 ),
  Array("PHP", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x00 ),
  Array("PLP", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x28, 0x00 ),
  Array("STX", 0x00, 0x86, 0x00, 0x96, 0x8e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("STY", 0x00, 0x84, 0x94, 0x00, 0x8c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ),
  Array("---", 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 )
);

// Initialize everything.
(function() {
  document.getElementById( "compileButton" ).disabled = false;
  document.getElementById( "runButton" ).disabled = true;
  document.getElementById( "hexdumpButton" ).disabled = true;
  document.getElementById( "fileSelect" ).disabled = false;
  //document.getElementById( "submitCode" ).disabled = true;
  //document.getElementById( "watch" ).disabled = true;
  document.getElementById( "watch" ).checked = false;
  document.getElementById( "stepButton" ).disabled = true;
  document.getElementById( "gotoButton" ).disabled = true;
  document.addEventListener( "keypress", keyPress, true );

  // Paint the "display"

  html = '<table class="screen">';
  for( y=0; y<32; y++ ) {
    html += "<tr>";
    for( x=0; x<32; x++ ) {
    html += '<td class="screen" id="x' + x + 'y' + y + '"></td>';
    }
    html += "</tr>";
  }
  html += "</table>";
  document.getElementById( "screen" ).innerHTML = html;

  // Reset everything

  reset();
})();

/*
 *  keyPress() - Store keycode in ZP $ff
 */
function keyPress( e ) {
  if( typeof window.event != "undefined" ) {
    e = window.event;
  }
  if( e.type == "keypress" ) {
    value = e.which;
    memStoreByte(0xff, value);
  }
}

/*
 *  debugExec() - Execute one instruction and print values
 */
function debugExec() {
  if( codeRunning ) {
    execute();
  }
  updateDebugInfo();
}

function generateDebugInfoCell(label, content, binaryMode) {
  return "<div class='debug-info'><div class='debug-info-label'>" + label + "</div><div class='debug-info-content'>" + content + "</div></div>"
}

function updateDebugInfo() {
  var binaryMode = document.getElementById('binary').checked;
  var html = "";

  html += generateDebugInfoCell("A", binaryMode ? num2bin(regA, 8) : "$" + num2hex(regA));
  html += generateDebugInfoCell("X", binaryMode ? num2bin(regX, 8) : "$" + num2hex(regX));
  html += generateDebugInfoCell("Y", binaryMode ? num2bin(regY, 8) : "$" + num2hex(regY));

  var statusRegister = binaryMode ? "NV1BDIZC<br>" + num2bin(regP, 8) : "$" + num2hex(regP);

  html += "<div class='debug-info debug-info-status'><div class='debug-info-label'>P</div><div class='debug-info-content'>" + statusRegister + "</div></div>"

  html += generateDebugInfoCell("SP", "$" + addr2hex(memoryStack.regSP));
  html += generateDebugInfoCell("PC", "$" + addr2hex(regPC));

  document.getElementById("md").innerHTML = html;
}

/*
 *  gotoAddr() - Set PC to address (or address of label)
 */
function gotoAddr() {
  var input = prompt( "Enter address or label", "" );
  var addr = 0;
  if( input in labelAddresses ) {
    addr = labelAddresses[input];
  } else {
    if( input.match( new RegExp( /^0x[0-9a-f]{1,4}$/i ) ) ) {
      input = input.replace( /^0x/, "" );
      addr = parseInt( input, 16 );
    } else if( input.match( new RegExp( /^\$[0-9a-f]{1,4}$/i))) {
      input = input.replace( /^\$/, "" );
      addr = parseInt( input, 16 );
    }
  }
  if( addr == 0 ) {
    alert( "Unable to find/parse given address/label" );
  } else {
    regPC = addr;
  }
  updateDebugInfo();
}

/*
 *  stopDebugger() - stops debugger
 */
function stopDebugger() {
  debug = false;
  if( codeRunning ) {
    document.getElementById( "stepButton" ).disabled = true;
    document.getElementById( "gotoButton" ).disabled = true;
  }
}

function enableDebugger() {
  debug = true;
  if( codeRunning ) {
    updateDebugInfo();
    document.getElementById( "stepButton" ).disabled = false;
    document.getElementById( "gotoButton" ).disabled = false;
  }
}
/*
 *  toggleDebug() - Toggles debugging on/off
 */

function toggleDebug() {
  // alert( "debug="+debug+" og codeRunning="+codeRunning );
  debug = !debug;
  if( debug ) {
    enableDebugger();
  } else {
    stopDebugger();
  }
}

function toggleScreen() {
  document.getElementById('screen').classList.toggle('screen-large');
}

function toggleBinaryMode() {
  updateDebugInfo();
}

function togglePresentationMode() {
  document.getElementsByTagName('body')[0].classList.toggle('presentation-mode');
}

/*
 *  disableButtons() - Disables the Run and Debug buttons when text is
 *                     altered in the code editor
 */
function disableButtons() {
  document.getElementById( "runButton" ).disabled = true;
  document.getElementById( "hexdumpButton" ).disabled = true;
  document.getElementById( "fileSelect" ).disabled = false;
  document.getElementById( "compileButton" ).disabled = false;
  document.getElementById( "runButton" ).value = "Run";
  // document.getElementById( "submitCode" ).disabled = true;
  codeCompiledOK = false;
  codeRunning = false;
  document.getElementById( "code" ).focus();
  document.getElementById( "stepButton" ).disabled = true;
  document.getElementById( "gotoButton" ).disabled = true;
  clearInterval( myInterval );
}

/*
 *  Load() - Loads a file from server
 */
function Load( file ) {
  reset();
  disableButtons();
  document.getElementById( "code" ).value = "Loading, please wait ...";
  document.getElementById( "compileButton" ).disabled = true;
  xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = FileLoaded;
  xmlhttp.open( "GET", "assets/js/examples/" + file );
  xmlhttp.send( null );
  stopDebugger();
}

function FileLoaded() {
  if( xmlhttp.readyState == 4 ) {
    if( xmlhttp.status == 200 ) {
      document.getElementById( "code" ).value = xmlhttp.responseText;
      document.getElementById( "compileButton" ).disabled = false;
    }
  }
}

/*
 *  reset() - Reset CPU and memoryStack.
 */

function reset() {
  for( y=0; y<32; y++ ) {
    for( x=0; x<32; x++ ) {
      display[y*32+x] = document.getElementById( "x"+x+"y"+y ).style;
      display[y*32+x].background = "#000000";
    }
  }
  memoryStack.reset(); // clear ZP, stack and screen

  regA = regX = regY = 0;
  defaultCodePC = regPC = 0x600;
  regP = 0x20;
  runForever = false;

  updateDebugInfo();
}


/*
 *  printMessage() - Prints text in the message window
 */

function printMessage( text ) {
  obj = document.getElementById( "messages" );
  obj.innerHTML += text + "<br />";
  obj.scrollTop = obj.scrollHeight;
}

/*
 *  compileCode()
 *  "Compiles" the code into a string (global var compiledCode)
 */

function compileCode() {
  reset();
  document.getElementById( "messages" ).innerHTML = "";

  let code = document.getElementById( "code" ).value;
  code += "\n\n";
  let codeLines = code.split( "\n" );

  labelAddresses = {};

  indexLabels(codeLines);

  defaultCodePC = regPC = 0x600;
  printMessage( "Compiling code.." );

  let codeCompiledOK = true;
  for( let line_i = 0; line_i < codeLines.length; line_i++ ) {
    if( ! compileLine( codeLines[line_i], line_i ) ) {
      codeCompiledOK = false;
      break;
    }
  }

  if( codeLen == 0 ) {
    codeCompiledOK = false;
  }

  if( ! codeCompiledOK ) {
    if( codeLen == 0 ) {
      printMessage( "No code to run." );
    } else {
      str = codeLines[x].replace( "<", "&lt;" ).replace( ">", "&gt;" );
      printMessage( "<b>Syntax error line " + (x+1) + ": " + str + "</b>");
    }
    document.getElementById( "runButton" ).disabled = true;
    document.getElementById( "compileButton" ).disabled = false;
    document.getElementById( "fileSelect" ).disabled = false;
    return;
  }

  document.getElementById( "runButton" ).disabled = false;
  document.getElementById( "hexdumpButton" ).disabled = false;
  document.getElementById( "compileButton" ).disabled = true;
  document.getElementById( "fileSelect" ).disabled = false;
  // document.getElementById( "submitCode" ).disabled = false;
  memoryStack.setElement(defaultCodePC, 0x00);

  updateDisplayFull();
  printMessage( "Code compiled successfully, " + codeLen + " bytes." );
  return;
}

function indexLabels(codeLines) {
  printMessage( "Indexing labels.." );
  defaultCodePC = regPC = 0x600;

  codeLines.forEach((line, line_number) => {
    indexLabel(line, line_number)
  });

  labelAddressesCount = Object.entries(labelAddresses).length;
  str = "Found " + labelAddressesCount + " label";
  str = labelAddressesCount == 1 ? str += "." : str += "s.";
  printMessage(str);
  defaultCodePC = regPC = 0x600;
}

function indexLabel( line, line_number ) {
  line = removeComments(line);
  line = trimLine(line);

  // Figure out how many bytes this instuction takes
  thisPC = defaultCodePC;

  codeLen = 0;
  // defaultCodePC = 0x600;
  compileLine( line );
  regPC += codeLen;

  // Find command or label
  if( line.match( new RegExp( /^\w+:/ ) ) ) {
    label = line.replace( new RegExp( /(^\w+):.*$/ ), "$1" );
    if ( label in labelAddresses ) {
      printMessage( "<b>Label already defined at line " + (line_number+1) + ":</b> " + line );
      return;
    }
    labelAddresses[label] = thisPC;
  }
  return;
}

function removeComments(input) {
  return input.replace( new RegExp( /^(.*?);.*/ ), "$1" );
}

function trimLine(input) {
  input = input.replace( new RegExp( /^\s+/ ), "" );
  input = input.replace( new RegExp( /\s+$/ ), "" );
  return input
}

/*
 *  compileLine()
 *  Compiles one line of code.  Returns true if it compiled successfully,
 *  false otherwise.
 */
function compileLine( input, lineno ) {
  input = removeComments(input);
  input = trimLine(input);
  let command = "";

  // Find command or label
  if( input.match( new RegExp( /^\w+:/ ) ) ) {
    label = input.replace( new RegExp( /(^\w+):.*$/ ), "$1" );
    if( input.match( new RegExp( /^\w+:[\s]*\w+.*$/ ) ) ) {
      input = input.replace( new RegExp( /^\w+:[\s]*(.*)$/ ), "$1" );
      command = input.replace( new RegExp( /^(\w+).*$/ ), "$1" );
    }
  } else {
    command = input.replace( new RegExp( /^(\w+).*$/ ), "$1" );
  }

  // Blank line?  Return.
  if( command == "" ) {
    return true;
  }

  command = command.toUpperCase();

  if( input.match( /^\*[\s]*=[\s]*[\$]?[0-9a-f]*$/ ) ) {
    // equ spotted
    param = input.replace( new RegExp( /^[\s]*\*[\s]*=[\s]*/ ), "" );
    if( param[0] == "$" ) {
      param = param.replace( new RegExp( /^\$/ ), "" );
      addr = parseInt( param, 16 );
    } else {
      addr = parseInt( param, 10 );
    }
    if( (addr < 0) || (addr > 0xffff) ) {
      printMessage( "Unable to relocate code outside 64k memoryStack" );
      return false;
    }
    defaultCodePC = addr;
    return true;
  }

  if( input.match( /^\w+\s+.*?$/ ) ) {
    param = input.replace( new RegExp( /^\w+\s+(.*?)/ ), "$1" );
  } else {
    if( input.match( /^\w+$/ ) ) {
      param = "";
    } else {
      return false;
    }
  }

  param = param.replace( /[ ]/g, "" );

  if( command == "DCB" ) {
    return DCB( param );
  }

  for( o=0; o<Opcodes.length; o++ ) {
    if( Opcodes[o][0] == command ) {
      if(
          checkSingle(param, Opcodes[o][10])
        || checkImmediate(param, Opcodes[o][1])
        || checkZeroPage(param, Opcodes[o][2])
        || checkZeroPageX(param, Opcodes[o][3])
        || checkZeroPageY(param, Opcodes[o][4])
        || checkAbsoluteX(param, Opcodes[o][6])
        || checkAbsoluteY(param, Opcodes[o][7])
        || checkIndirectX(param, Opcodes[o][8])
        || checkIndirectY(param, Opcodes[o][9])
        || checkAbsolute(param, Opcodes[o][5])
        || checkBranch(param, Opcodes[o][11])
      ) {
        return true;
      }
    }
  }
  return false; // Unknown opcode
}

/*****************************************************************************
 ****************************************************************************/

function DCB( param ) {
  values = param.split( "," );
  if( values.length == 0 ) return false;
  for( v=0; v<values.length; v++ ) {
    str = values[v];
    if( str != undefined && str != null && str.length > 0 ) {
      ch = str.substring( 0, 1 );
      if( ch == "$" ) {
        number = parseInt( str.replace( /^\$/, "" ), 16 );
        memoryStack.pushByte( number );
      } else if( ch >= "0" && ch <= "9" ) {
        number = parseInt( str, 10 );
        memoryStack.pushByte( number );
      } else {
        return false;
      }
    }
  }
  return true;
}

/*
 *  checkBranch() - Commom branch function for all branches (BCC, BCS, BEQ, BNE..)
 */

function checkBranch( param, opcode ) {
  if( opcode == 0x00 ) {
    return false;
  }

  addr = -1;
  if( param.match( /\w+/ ) ) {
    addr = labelAddresses[param];
  }
  if( addr == -1 ) {
    memoryStack.pushWord( 0x00 );
    return false;
  }
  memoryStack.pushByte( opcode );
  if( addr < (defaultCodePC-0x600) ) {  // Backwards?
    memoryStack.pushByte( (0xff - ((defaultCodePC-0x600)-addr)) & 0xff );
    return true;
  }
  memoryStack.pushByte( (addr-(defaultCodePC-0x600)-1) & 0xff );
  return true;
}

/*
 * checkImmediate() - Check if param is immediate and push value
 */

function checkImmediate( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param.match( new RegExp( /^#\$[0-9a-f]{1,2}$/i ) ) ) {
    memoryStack.pushByte( opcode );
    value = parseInt( param.replace( /^#\$/, "" ), 16 );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( value );
    return true;
  }
  if( param.match( new RegExp( /^#[0-9]{1,3}$/i ) ) ) {
    memoryStack.pushByte( opcode );
    value = parseInt( param.replace( /^#/, "" ), 10 );
    if( value < 0 || value > 255 ) {
      return false;
    }

    memoryStack.pushByte( value );
    return true;
  }
  // Label lo/hi
  if( param.match( new RegExp( /^#[<>]\w+$/ ) ) ) {
    label = param.replace( new RegExp( /^#[<>](\w+)$/ ), "$1" );
    hilo = param.replace( new RegExp( /^#([<>]).*$/ ), "$1" );
    memoryStack.pushByte( opcode );
    if( label in labelAddresses ) {
      addr = labelAddresses[label];
      switch( hilo ) {
        case ">":
          memoryStack.pushByte( (addr >> 8) & 0xff );
          return true;
          break;
        case "<":
          memoryStack.pushByte( addr & 0xff );
          return true;
          break;
        default:
          return false;
          break;
      }
    }

    memoryStack.pushByte( 0x00 );
    return true;
  }
  return false;
}

/*
 * checkIndZP() - Check indirect ZP
 */


/*
 * checkIndirectX() - Check if param is indirect X and push value
 */

function checkIndirectX( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param.match( /^\(\$[0-9a-f]{1,2},X\)$/i ) ) {
    memoryStack.pushByte( opcode );
    value = param.replace( new RegExp( /^\(\$([0-9a-f]{1,2}).*$/i ), "$1" );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( parseInt( value, 16 ) );
    return true;
  }
  return false;
}

/*
 * checkIndirectY() - Check if param is indirect Y and push value
 */

function checkIndirectY( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param.match( /^\(\$[0-9a-f]{1,2}\),Y$/i ) ) {
    memoryStack.pushByte( opcode );
    value = param.replace( new RegExp( /^\([\$]([0-9a-f]{1,2}).*$/i ), "$1" );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( parseInt( value, 16 ) );
    return true;
  }
  return false;
}

/*
 *  checkSingle() - Single-byte opcodes
 */

function checkSingle( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param != "" ) return false;
  memoryStack.pushByte( opcode );
  return true;
}

/*
 *  checkZeroaPage() - Check if param is ZP and push value
 */

function checkZeroPage( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param.match( /^\$[0-9a-f]{1,2}$/i ) ) {
    memoryStack.pushByte( opcode );
    value = parseInt( param.replace( /^\$/, "" ), 16 );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( value );
    return true;
  }
  if( param.match( /^[0-9]{1,3}$/i ) ) {
    memoryStack.pushByte( opcode );
    value = parseInt( param, 10 );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( value );
    return true;
  }
  return false;
}

/*
 *  checkAbsoluteX() - Check if param is ABSX and push value
 */

function checkAbsoluteX( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param.match( /^\$[0-9a-f]{3,4},X$/i ) ) {
    memoryStack.pushByte( opcode );
    number = param.replace( new RegExp( /^\$([0-9a-f]*),X/i ), "$1" );
    value = parseInt( number, 16 );
    if( value < 0 || value > 0xffff ) return false;
    memoryStack.pushWord( value );
    return true;
  }

  if( param.match( /^\w+,X$/i ) ) {
    param = param.replace( new RegExp( /,X$/i ), "" );
    memoryStack.pushByte( opcode );
    if( param in labelAddresses ) {
      addr = labelAddresses[param];
      if( addr < 0 || addr > 0xffff ) {
        return false;
      }
      memoryStack.pushWord( addr );
      return true;
    }

    memoryStack.pushWord( 0x1234 );
    return true;
  }

  return false;
}

/*
 *  checkAbsoluteY() - Check if param is ABSY and push value
 */

function checkAbsoluteY( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param.match( /^\$[0-9a-f]{3,4},Y$/i ) ) {
    memoryStack.pushByte( opcode );
    number = param.replace( new RegExp( /^\$([0-9a-f]*),Y/i ), "$1" );
    value = parseInt( number, 16 );
    if( value < 0 || value > 0xffff ) return false;
    memoryStack.pushWord( value );
    return true;
  }

  // it could be a label too..

  if( param.match( /^\w+,Y$/i ) ) {
    param = param.replace( new RegExp( /,Y$/i ), "" );
    memoryStack.pushByte( opcode );
    if( param in labelAddresses ) {
      addr = labelAddresses[param];
      if( addr < 0 || addr > 0xffff ) {
        return false;
      }
      memoryStack.pushWord( addr );
      return true;
    }

    memoryStack.pushWord( 0x1234 );
    return true;
  }
  return false;
}

/*
 *  checkZeroPageX() - Check if param is ZPX and push value
 */

function checkZeroPageX( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param.match( /^\$[0-9a-f]{1,2},X/i ) ) {
    memoryStack.pushByte( opcode );
    number = param.replace( new RegExp( /^\$([0-9a-f]{1,2}),X/i ), "$1" );
    value = parseInt( number, 16 );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( value );
    return true;
  }
  if( param.match( /^[0-9]{1,3},X/i ) ) {
    memoryStack.pushByte( opcode );
    number = param.replace( new RegExp( /^([0-9]{1,3}),X/i ), "$1" );
    value = parseInt( number, 10 );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( value );
    return true;
  }
  return false;
}

function checkZeroPageY( param, opcode ) {
  if( opcode == 0x00 ) return false;
  if( param.match( /^\$[0-9a-f]{1,2},Y/i ) ) {
    memoryStack.pushByte( opcode );
    number = param.replace( new RegExp( /^\$([0-9a-f]{1,2}),Y/i ), "$1" );
    value = parseInt( number, 16 );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( value );
    return true;
  }
  if( param.match( /^[0-9]{1,3},Y/i ) ) {
    memoryStack.pushByte( opcode );
    number = param.replace( new RegExp( /^([0-9]{1,3}),Y/i ), "$1" );
    value = parseInt( number, 10 );
    if( value < 0 || value > 255 ) return false;
    memoryStack.pushByte( value );
    return true;
  }
  return false;
}

/*
 *  checkAbsolute() - Check if param is ABS and push value
 */

function checkAbsolute( param, opcode ) {
  if( opcode == 0x00 ) return false;
  memoryStack.pushByte( opcode );
  if( param.match( /^\$[0-9a-f]{3,4}$/i ) ) {
    value = parseInt( param.replace( /^\$/, "" ), 16 );
    if( value < 0 || value > 0xffff ) return false;
    memoryStack.pushWord( value );
    return true;
  }
  if( param.match( /^[0-9]{1,5}$/i ) ) {  // Thanks, Matt!
    value = parseInt( param, 10 );
    if( value < 0 || value > 65535 ) return false;
    memoryStack.pushWord( value );
    return( true );
  }
  // it could be a label too..
  if( param.match( /^\w+$/ ) ) {
    if( param in labelAddresses ) {
      addr = labelAddresses[param];
      if( addr < 0 || addr > 0xffff ) {
        return false;
      }
      memoryStack.pushWord( addr );
      return true;
    }

    memoryStack.pushWord( 0x1234 );
    return true;
  }
  return false;
}


/*
 * memStoreByte() - Poke a byte, don't touch any registers
 */

function memStoreByte(addr, value) {
  memoryStack.setElement(addr, (value & 0xff));
  if( (addr >= 0x200) && (addr<=0x5ff) )
    display[addr-0x200].background = palette[memoryStack.getElement(addr) & 0x0f];
}

/*
 *  hexDump() - Dump binary as hex to new window
 */

function addr2hex( addr ) {
  return num2hex((addr>>8)&0xff)+num2hex(addr&0xff);
}

function num2bin( nr, pad ) {
  var res_str = bin = (nr >> 0).toString(2);
  var pad_str = "";

  for (var i = 0; i < (pad || 0) - res_str.length; i++) {
    pad_str += "0";
  }

  return pad_str + res_str;
}

function num2hex( nr ) {
  str = "0123456789abcdef";
  hi = ((nr&0xf0)>>4);
  lo = (nr&15);
  return str.substring( hi, hi+1  ) + str.substring( lo, lo+1 );
}

function hexdump() {
  w = window.open('', 'hexdump', 'width=500,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no' );

  html = "<html><head>";
  html += "<link href='style.css' rel='stylesheet' type='text/css' />";
  html += "<title>hexdump</title></head><body>";
  html += "<code>";
  for( x=0; x<codeLen; x++ ) {
    if( (x&15) == 0 ) {
      html += "<br/> ";
      n = (0x600+x);
      html += num2hex( ((n>>8)&0xff) );
      html += num2hex( (n&0xff) );
      html += ": ";
    }
    html += num2hex( memoryStack.getElement(0x600+x) );
    if( x&1 ) html += " ";
  }
  if( (x&1) ) html += "-- [END]";
  html += "</code></body></html>";
  w.document.write( html );
  w.document.close();
}

/*
 *  runBinary() - Executes the compiled code
 */

function runBinary() {
  if( codeRunning ) {
    /* Switch OFF everything */
    codeRunning = false;
    document.getElementById( "runButton" ).value = "Run";
    document.getElementById( "hexdumpButton" ).disabled = false;
    document.getElementById( "fileSelect" ).disabled = false;
//    document.getElementById( "submitCode" ).disabled = false;
//    document.getElementById( "watch" ).disabled = true;
    toggleDebug();
    stopDebugger();
    clearInterval( myInterval );
  } else {
    document.getElementById( "runButton" ).value = "Stop";
    document.getElementById( "fileSelect" ).disabled = true;
    document.getElementById( "hexdumpButton" ).disabled = true;
//    document.getElementById( "submitCode" ).disabled = true;
    codeRunning = true;
    myInterval = setInterval( "multiexecute()", 1 );
   document.getElementById( "stepButton" ).disabled = !debug;
   document.getElementById( "gotoButton" ).disabled = !debug;
  }
}

/*
 *  readZeroPage() - Get value from ZP
 */

function jumpBranch( offset ) {
  if( offset > 0x7f )
    regPC = (regPC - (0x100 - offset));
  else
    regPC = (regPC + offset );
}

function jumpBranchConditionally( condition ) {
  if( condition ) {
    offset = memoryStack.popByte();
    jumpBranch( offset );
  }
}

function doCompare( reg, val ) {
//  if( (reg+val) > 0xff ) regP |= 1; else regP &= 0xfe;
  if( reg>=val ) regP |= 1; else regP &= 0xfe;  // Thanks, "Guest"
  val = (reg-val);
  if( val ) regP &= 0xfd; else regP |= 0x02;
  if( val & 0x80 ) regP |= 0x80; else regP &= 0x7f;
}

function testSBC( value ) {
  if( (regA ^ value ) & 0x80 )
    vflag = 1;
  else
    vflag = 0;

  if( regP & 8 ) {
    tmp = 0xf + (regA & 0xf) - (value & 0xf) + (regP&1);
    if( tmp < 0x10 ) {
      w = 0;
      tmp -= 6;
    } else {
      w = 0x10;
      tmp -= 0x10;
    }
    w += 0xf0 + (regA & 0xf0) - (value & 0xf0);
    if( w < 0x100 ) {
      regP &= 0xfe;
      if( (regP&0xbf) && w<0x80) regP&=0xbf;
      w -= 0x60;
    } else {
      regP |= 1;
      if( (regP&0xbf) && w>=0x180) regP&=0xbf;
    }
    w += tmp;
  } else {
    w = 0xff + regA - value + (regP&1);
    if( w<0x100 ) {
      regP &= 0xfe;
      if( (regP&0xbf) && w<0x80 ) regP&=0xbf;
    } else {
      regP |= 1;
      if( (regP&0xbf) && w>= 0x180) regP&=0xbf;
    }
  }
  regA = w & 0xff;
  if( regA ) regP &= 0xfd; else regP |= 0x02;
  if( regA & 0x80 ) regP |= 0x80; else regP &= 0x7f;
}

function testADC( value ) {
  if( (regA ^ value) & 0x80 ) {
    regP &= 0xbf;
  } else {
    regP |= 0x40;
  }

  if( regP & 8 ) {
    tmp = (regA & 0xf) + (value & 0xf) + (regP&1);
    if( tmp >= 10 ) {
      tmp = 0x10 | ((tmp+6)&0xf);
    }
    tmp += (regA & 0xf0) + (value & 0xf0);
    if( tmp >= 160) {
      regP |= 1;
      if( (regP&0xbf) && tmp >= 0x180 ) regP &= 0xbf;
      tmp += 0x60;
    } else {
      regP &= 0xfe;
      if( (regP&0xbf) && tmp<0x80 ) regP &= 0xbf;
    }
  } else {
    tmp = regA + value + (regP&1);
    if( tmp >= 0x100 ) {
      regP |= 1;
      if( (regP&0xbf) && tmp>=0x180) regP &= 0xbf;
    } else {
      regP &= 0xfe;
      if( (regP&0xbf) && tmp<0x80) regP &= 0xbf;
    }
  }
  regA = tmp & 0xff;
  if( regA ) regP &= 0xfd; else regP |= 0x02;
  if( regA & 0x80 ) regP |= 0x80; else regP &= 0x7f;
}

function multiexecute() {
  if( ! debug ) {
    for( var w=0; w<64; w++ ) {
      execute();
      execute();
    }
  }
}

/*
 *  execute() - Executes one instruction.
 *              This is the main part of the CPU emulator.
 */

function execute() {
  if( ! codeRunning ) {
    return;
  }

  memoryStack.setElement(0xfe, Math.floor( Math.random()*256 ));
  instruction = instructions[memoryStack.popByte()]
  console.log(instruction.name);
  instruction();

  if( (regPC == 0) || (!codeRunning) ) {
    clearInterval( myInterval );
    printMessage( "Program end at PC=$" + addr2hex( regPC-1 ) );
    codeRunning = false;
    document.getElementById( "stepButton" ).disabled = true;
    document.getElementById( "gotoButton" ).disabled = true;
    document.getElementById( "runButton" ).value = "Run";
    document.getElementById( "fileSelect" ).disabled = false;
    document.getElementById( "hexdumpButton" ).disabled = false;
//    document.getElementById( "submitCode" ).disabled = false;
  }
}

function setRegisterP ( reg ) {
  if( reg ) {
     regP &= 0xfd;
  } else {
    regP |= 0x02;
  }
  if( reg & 0x80 ) {
    regP |= 0x80;
  } else {
    regP &= 0x7f;
  }
}

function i00() {
  codeRunning = false;
}

function i01() {
  addr = memoryStack.popByte() + regX;
  value = memoryStack.getElement(addr) + (memoryStack.getElement(addr+1) << 8);
  regA |= value;
  setRegisterP(regA);
}

function i05() {
  zp = memoryStack.popByte();
  regA |= memoryStack.getElement(zp);
  setRegisterP(regA);
}

function i06() {
  zp = memoryStack.popByte();
  value = memoryStack.getElement(zp);
  regP = (regP & 0xfe) | ((value>>7)&1);
  value = value << 1;
  memStoreByte(zp, value);
  setRegisterP(value);
}

function i08() {
  memoryStack.push( regP );
}

function i09() {
  regA |= memoryStack.popByte();
  setRegisterP(regA);
}

function i0a() {
  regP = (regP & 0xfe) | ((regA>>7)&1);
  regA = regA<<1;
  setRegisterP(regA);
}

function i0d() {
  regA |= memoryStack.getElement(memoryStack.popWord());
  setRegisterP(regA);
}

function i0e() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  regP = (regP & 0xfe) | ((value>>7)&1);
  value = value << 1;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i10() {
  jumpBranchConditionally((regP & 0x80) == 0)
}

function i11() {
  zp = memoryStack.popByte();
  value = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8) + regY;
  regA |= memoryStack.getElement(value);
  setRegisterP(regA);
}

function i15() {
  addr = (memoryStack.popByte() + regX) & 0xff;
  regA |= memoryStack.getElement(addr);
  setRegisterP(regA);
}

function i16() {
  addr = (memoryStack.popByte() + regX) & 0xff;
  value = memoryStack.getElement(addr);
  regP = (regP & 0xfe) | ((value>>7)&1);
  value = value << 1;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i18() {
  regP &= 0xfe;
}

function i19() {
  addr = memoryStack.popWord() + regY;
  regA |= memoryStack.getElement(addr);
  setRegisterP(regA);
}

function i1d() {
  addr = memoryStack.popWord() + regX;
  regA |= memoryStack.getElement(addr);
  setRegisterP(regA);
}

function i1e() {
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  regP = (regP & 0xfe) | ((value>>7)&1);
  value = value << 1;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i20() {
  addr = memoryStack.popWord();
  currAddr = regPC-1;
  memoryStack.push( ((currAddr >> 8) & 0xff) );
  memoryStack.push( (currAddr & 0xff) );
  regPC = addr;
}

function i21() {
  addr = (memoryStack.popByte() + regX)&0xff;
  value = memoryStack.getElement(addr)+(memoryStack.getElement(addr+1) << 8);
  regA &= value;
  setRegisterP(regA);
}

function i24() {
  zp = memoryStack.popByte();
  value = memoryStack.getElement(zp);
  if( value & regA ) {
    regP &= 0xfd;
  } else {
    regP |= 0x02;
  }
  regP = (regP & 0x3f) | (value & 0xc0);
}

function i25() {
  zp = memoryStack.popByte();
  regA &= memoryStack.getElement(zp);
  if( regA ) regP &= 0xfd; else regP |= 2;
  if( regA & 0x80 ) regP &= 0x80; else regP &= 0x7f; // regP &= 0x80 or |=??
}

function i26() {
  sf = (regP & 1);
  addr = memoryStack.popByte();
  value = memoryStack.getElement(addr); //  & regA;  -- Thanks DMSC ;)
  regP = (regP & 0xfe) | ((value>>7)&1);
  value = value << 1;
  value |= sf;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i28() {
  regP = memoryStack.pop() | 0x20;
}

function i29() {
  regA &= memoryStack.popByte();
  setRegisterP(regA);
}

function i2a() {
  sf = (regP&1);
  regP = (regP&0xfe) | ((regA>>7)&1);
  regA = regA << 1;
  regA |= sf;
  setRegisterP(regA);
}

function i2c() {
  value = memoryStack.getElement(memoryStack.popWord());
  if( value & regA ) {
    regP &= 0xfd;
  } else {
    regP |= 0x02;
  }
  regP = (regP & 0x3f) | (value & 0xc0);
}

function i2d() {
  value = memoryStack.getElement(memoryStack.popWord());
  regA &= value
  setRegisterP(regA);
}

function i2e() {
  sf = regP & 1;
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  regP = (regP & 0xfe) | ((value>>7)&1);
  value = value << 1;
  value |= sf;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i30() {
  jumpBranchConditionally(regP & 0x80)
}

function i31() {
  zp = memoryStack.popByte();
  value = memoryStack.getElement(zp)+(memoryStack.getElement(zp+1)<<8) + regY;
  regA &= memoryStack.getElement(value);
  setRegisterP(regA);
}

function i35() {
  zp = memoryStack.popByte();
  value = memoryStack.getElement(zp)+(memoryStack.getElement(zp+1)<<8) + regX;
  regA &= memoryStack.getElement(value);
  setRegisterP(regA);
}

function i36() {
  sf = regP & 1;
  addr = (memoryStack.popByte() + regX) & 0xff;
  value = memoryStack.getElement(addr);
  regP = (regP & 0xfe) | ((value>>7)&1);
  value = value << 1;
  value |= sf;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i38() {
  regP |= 1;
}

function i39() {
  addr = memoryStack.popWord() + regY;
  value = memoryStack.getElement(addr);
  regA &= value;
  setRegisterP(regA);
}

function i3d() {
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  regA &= value;
  setRegisterP(regA);
}

function i3e() {
  sf = regP&1;
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  regP = (regP & 0xfe) | ((value>>7)&1);
  value = value << 1;
  value |= sf;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i40() {
}

function i41() {
  zp = (memoryStack.popByte() + regX)&0xff;
  value = memoryStack.getElement(zp)+ (memoryStack.getElement(zp+1)<<8);
  regA ^= memoryStack.getElement(value);
  setRegisterP(regA);
}

function i45() {
  addr = memoryStack.popByte() & 0xff;
  value = memoryStack.getElement(addr);
  regA ^= value;
  setRegisterP(regA);
}

function i46() {
  addr = memoryStack.popByte() & 0xff;
  value = memoryStack.getElement(addr);
  regP = (regP & 0xfe) | (value&1);
  value = value >> 1;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i48() {
  memoryStack.push( regA );
}

function i49() {
  regA ^= memoryStack.popByte();
  setRegisterP(regA);
}

function i4a() {
  regP = (regP&0xfe) | (regA&1);
  regA = regA >> 1;
  setRegisterP(regA);
}

function i4c() {
  regPC = memoryStack.popWord();
}

function i4d() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  regA ^= value;
  setRegisterP(regA);
}

function i4e() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  regP = (regP&0xfe)|(value&1);
  value = value >> 1;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i50() {
  jumpBranchConditionally((regP & 0x40) == 0)
}

function i51() {
  zp = memoryStack.popByte();
  value = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8) + regY;
  regA ^= memoryStack.getElement(value);
  setRegisterP(regA);
}

function i55() {
  addr = (memoryStack.popByte() + regX) & 0xff;
  regA ^= memoryStack.getElement(addr);
  setRegisterP(regA);
}

function i56() {
  addr = (memoryStack.popByte() + regX) & 0xff;
  value = memoryStack.getElement(addr);
  regP = (regP&0xfe) | (value&1);
  value = value >> 1;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i58() {
}

function i59() {
  addr = memoryStack.popWord() + regY;
  value = memoryStack.getElement(addr);
  regA ^= value;
  setRegisterP(regA);
}

function i5d() {
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  regA ^= value;
  setRegisterP(regA);
}

function i5e() {
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  regP = (regP&0xfe) | (value&1);
  value = value >> 1;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i60() {
  regPC = (memoryStack.pop()+1) | (memoryStack.pop()<<8);
}

function i61() {
  zp = (memoryStack.popByte() + regX)&0xff;
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8);
  value = memoryStack.getElement(addr);
  testADC( value );
}

function i65() {
  addr = memoryStack.popByte();
  value = memoryStack.getElement(addr);
  testADC( value );
}

function i66() {
  sf = regP&1;
  addr = memoryStack.popByte();
  value = memoryStack.getElement(addr);
  regP = (regP&0xfe)|(value&1);
  value = value >> 1;
  if( sf ) {
    value |= 0x80;
  }
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i68() {
  regA = memoryStack.pop();
  setRegisterP(regA);
}

function i69() {
  value = memoryStack.popByte();
  testADC( value );
}

function i6a() {
  sf = regP&1;
  regP = (regP&0xfe) | (regA&1);
  regA = regA >> 1;
  if( sf ) {
    regA |= 0x80;
  }
  setRegisterP(regA);
}

function i6c() {
}

function i6d() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  testADC( value );
}

function i6e() {
  sf = regP&1;
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  regP = (regP&0xfe)|(value&1);
  value = value >> 1;
  if( sf ) {
    value |= 0x80;
  }
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i70() {
  jumpBranchConditionally(regP & 0x40)
}

function i71() {
  zp = memoryStack.popByte();
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8);
  value = memoryStack.getElement( addr + regY );
  testADC( value );
}

function i75() {
  addr = (memoryStack.popByte() + regX) & 0xff;
  value = memoryStack.getElement(addr);
  //regP = (regP&0xfe) | (value&1);
  testADC( value );
}

function i76() {
  sf = (regP&1);
  addr = (memoryStack.popByte() + regX) & 0xff;
  value = memoryStack.getElement(addr);
  regP = (regP&0xfe) | (value&1);
  value = value >> 1;
  if( sf ) value |= 0x80;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i78() {
}

function i79() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement( addr + regY );
  testADC( value );
}

function i7d() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement( addr + regX );
  testADC( value );
}

function i7e() {
  sf = regP&1;
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  regP = (regP&0xfe) | (value&1);
  value = value >> 1;
  if( value ) {
    value |= 0x80;
  }
  memStoreByte(addr, value);
  setRegisterP(value);
}

function i81() {
  zp = (memoryStack.popByte()+regX)&0xff;
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8);
  memStoreByte(addr, regA);
}

function i84() {
  memStoreByte(memoryStack.popByte(), regY);
}

function i85() {
  memStoreByte(memoryStack.popByte(), regA);
}

function i86() {
  memStoreByte(memoryStack.popByte(), regX);
}

function i88() {
  regY = (regY-1) & 0xff;
  setRegisterP(regY);
}

function i8a() {
  regA = regX & 0xff;
  setRegisterP(regA);
}

function i8c() {
  memStoreByte(memoryStack.popWord(), regY);
}

function i8d() {
  memStoreByte(memoryStack.popWord(), regA);
}

function i8e() {
  memStoreByte(memoryStack.popWord(), regX);
}

function i90() {
  jumpBranchConditionally(regP & 1)
}

function i91() {
  zp = memoryStack.popByte();
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8) + regY;
  memStoreByte(addr, regA);
}

function i94() {
  memStoreByte(memoryStack.popByte() + regX, regY);
}

function i95() {
  memStoreByte(memoryStack.popByte() + regX, regA);
}

function i96() {
  memStoreByte(memoryStack.popByte() + regY, regX);
}

function i98() {
  regA = regY & 0xff;
  setRegisterP(regA);
}

function i99() {
  memStoreByte(memoryStack.popWord() + regY, regA);
}

function i9a() {
  memoryStack.setRegSP(regX & 0xff);
}

function i9d() {
  addr = memoryStack.popWord();
  memStoreByte(addr + regX, regA);
}

function ia0() {
  regY = memoryStack.popByte();
  setRegisterP(regY);
}

function ia1() {
  zp = (memoryStack.popByte()+regX)&0xff;
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8);
  regA = memoryStack.getElement(addr);
  setRegisterP(regA);
}

function ia2() {
  regX = memoryStack.popByte();
  setRegisterP(regX);
}

function ia4() {
  regY = memoryStack.getElement(memoryStack.popByte());
  setRegisterP(regY);
}

function ia5() {
  regA = memoryStack.getElement(memoryStack.popByte());
  setRegisterP(regA);
}

function ia6() {
  regX = memoryStack.getElement(memoryStack.popByte());
  setRegisterP(regX);
}

function ia8() {
  regY = regA & 0xff;
  setRegisterP(regY);
}

function ia9() {
  regA = memoryStack.popByte();
  setRegisterP(regA);
}

function iaa() {
  regX = regA & 0xff;
  setRegisterP(regX);
}

function iac() {
  regY = memoryStack.getElement(memoryStack.popWord());
  setRegisterP(regY);
}

function iad() {
  regA = memoryStack.getElement(memoryStack.popWord());
  setRegisterP(regA);
}

function iae() {
  regX = memoryStack.getElement(memoryStack.popWord());
  setRegisterP(regX);
}

function ib0() {
  jumpBranchConditionally(regP & 1)
}

function ib1() {
  zp = memoryStack.popByte();
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8) + regY;
  regA = memoryStack.getElement(addr);
  setRegisterP(regA);
}

function ib4() {
  regY = memoryStack.getElement(memoryStack.popByte() + regX);
  setRegisterP(regY);
}

function ib5() {
  regA = memoryStack.getElement((memoryStack.popByte() + regX) & 0xff);
  setRegisterP(regA);
}

function ib6() {
  regX = memoryStack.getElement(memoryStack.popByte() + regY);
  setRegisterP(regX);
}

function ib8() {
  regP &= 0xbf;
}

function ib9() {
  addr = memoryStack.popWord() + regY;
  regA = memoryStack.getElement(addr);
  setRegisterP(regA);
}

function iba() {
  regX = memoryStack.regSP & 0xff;
}

function ibc() {
  addr = memoryStack.popWord() + regX;
  regY = memoryStack.getElement(addr);
  setRegisterP(regY);
}

function ibd() {
  addr = memoryStack.popWord() + regX;
  regA = memoryStack.getElement(addr);
  setRegisterP(regA);
}

function ibe() {
  addr = memoryStack.popWord() + regY;
  regX = memoryStack.getElement(addr);
  setRegisterP(regX);
}

function ic0() {
  value = memoryStack.popByte();
  if( (regY+value) > 0xff ) regP |= 1; else regP &= 0xfe;
  ov = value; // TODO: Is this needed?
  value = (regY-value);
  setRegisterP(value);
}

function ic1() {
  zp = memoryStack.popByte();
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8) + regY;
  value = memoryStack.getElement(addr);
  doCompare( regA, value );
}

function ic4() {
  value = memoryStack.getElement(memoryStack.popByte());
  doCompare( regY, value );
}

function ic5() {
  value = memoryStack.getElement(memoryStack.popByte());
  doCompare( regA, value );
}

function ic6() {
  zp = memoryStack.popByte();
  value = memoryStack.getElement(zp);
  --value;
  memStoreByte(zp, value&0xff);
  setRegisterP(value);
}

function ic8() {
  regY = (regY + 1) & 0xff;
  setRegisterP(regY);
}

function ic9() {
  value = memoryStack.popByte();
  doCompare( regA, value );
}

function ica() {
  regX = (regX-1) & 0xff;
  setRegisterP(regX);
}

function icc() {
  value = memoryStack.getElement(memoryStack.popWord());
  doCompare( regY, value );
}

function icd() {
  value = memoryStack.getElement(memoryStack.popWord());
  doCompare( regA, value );
}

function ice() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  --value;
  value = value&0xff;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function id0() {
  jumpBranchConditionally((regP&2)==0)
}

function id1() {
  zp = memoryStack.popByte();
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8) + regY;
  value = memoryStack.getElement(addr);
  doCompare( regA, value );
}

function id5() {
  value = memoryStack.getElement(memoryStack.popByte() + regX);
  doCompare( regA, value );
}

function id6() {
  addr = memoryStack.popByte() + regX;
  value = memoryStack.getElement(addr);
  --value;
  value = value&0xff;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function id8() {
  regP &= 0xf7;
}

function id9() {
  addr = memoryStack.popWord() + regY;
  value = memoryStack.getElement(addr);
  doCompare( regA, value );
}

function idd() {
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  doCompare( regA, value );
}

function ide() {
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  --value;
  value = value&0xff;
  memStoreByte(addr, value);
  setRegisterP(value);
}

function ie0() {
  value = memoryStack.popByte();
  doCompare( regX, value );
}

function ie1() {
  zp = (memoryStack.popByte()+regX)&0xff;
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8);
  value = memoryStack.getElement(addr);
  testSBC( value );
}

function ie4() {
  value = memoryStack.getElement(memoryStack.popByte());
  doCompare( regX, value );
}

function ie5() {
  addr = memoryStack.popByte();
  value = memoryStack.getElement(addr);
  testSBC( value );
}

function ie6() {
  zp = memoryStack.popByte();
  value = memoryStack.getElement(zp);
  ++value;
  value = (value)&0xff;
  memStoreByte(zp, value);
  setRegisterP(value)
}

function ie8() {
  regX = (regX + 1) & 0xff;
  setRegisterP(regX)
}

function ie9() {
  value = memoryStack.popBytetack.popByte();
  testSBC( value );
}

function iea() {
}

function iec() {
  value = memoryStack.getElement(memoryStack.popWord());
  doCompare( regX, value );
}

function ied() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  testSBC( value );
}

function iee() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr);
  ++value;
  value = (value)&0xff;
  memStoreByte(addr, value);
  setRegisterP(value)
}

function if0() {
  jumpBranchConditionally(regP&2)
}

function if1() {
  zp = popByte();
  addr = memoryStack.getElement(zp) + (memoryStack.getElement(zp+1)<<8);
  value = memoryStack.getElement(addr + regY);
  testSBC( value );
}

function if5() {
  addr = (memoryStack.popByte() + regX)&0xff;
  value = memoryStack.getElement(addr);
  regP = (regP&0xfe)|(value&1);
  testSBC( value );
}

function if6() {
  addr = memoryStack.popByte() + regX;
  value = memoryStack.getElement(addr);
  ++value;
  value=value&0xff;
  memStoreByte(addr, value);
  setRegisterP(value)
}

function if8() {
  regP |= 8;
}

function if9() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr + regY);
  testSBC( value );
}

function ifd() {
  addr = memoryStack.popWord();
  value = memoryStack.getElement(addr + regX);
  testSBC( value );
}

function ife() {
  addr = memoryStack.popWord() + regX;
  value = memoryStack.getElement(addr);
  ++value;
  value=value&0xff;
  memStoreByte(addr, value);
  setRegisterP(value)
}

function ierr(caller_name) {
  // printMessage( "Address $" + addr2hex(regPC) + " - unknown opcode " + opcode );
  let name = caller_name.substr('function '.length);
  name = name.substr(0, name.indexOf('('));
  message = "instruction " + name + "unknown\n  Address $" + addr2hex(regPC);
  printMessage(message);
  console.log(message);
  codeRunning = false;
}

function i02 () { ierr(arguments.callee.toString()); }
function i03 () { ierr(arguments.callee.toString()); }
function i04 () { ierr(arguments.callee.toString()); }
function i07 () { ierr(arguments.callee.toString()); }
function i0b () { ierr(arguments.callee.toString()); }
function i0c () { ierr(arguments.callee.toString()); }
function i0f () { ierr(arguments.callee.toString()); }

function i12 () { ierr(arguments.callee.toString()); }
function i13 () { ierr(arguments.callee.toString()); }
function i14 () { ierr(arguments.callee.toString()); }
function i17 () { ierr(arguments.callee.toString()); }
function i1a () { ierr(arguments.callee.toString()); }
function i1b () { ierr(arguments.callee.toString()); }
function i1c () { ierr(arguments.callee.toString()); }
function i1f () { ierr(arguments.callee.toString()); }

function i22 () { ierr(arguments.callee.toString()); }
function i23 () { ierr(arguments.callee.toString()); }
function i27 () { ierr(arguments.callee.toString()); }
function i2b () { ierr(arguments.callee.toString()); }
function i2f () { ierr(arguments.callee.toString()); }

function i32 () { ierr(arguments.callee.toString()); }
function i33 () { ierr(arguments.callee.toString()); }
function i34 () { ierr(arguments.callee.toString()); }
function i37 () { ierr(arguments.callee.toString()); }
function i3a () { ierr(arguments.callee.toString()); }
function i3b () { ierr(arguments.callee.toString()); }
function i3c () { ierr(arguments.callee.toString()); }
function i3f () { ierr(arguments.callee.toString()); }

function i42 () { ierr(arguments.callee.toString()); }
function i43 () { ierr(arguments.callee.toString()); }
function i44 () { ierr(arguments.callee.toString()); }
function i47 () { ierr(arguments.callee.toString()); }
function i4b () { ierr(arguments.callee.toString()); }
function i4f () { ierr(arguments.callee.toString()); }

function i52 () { ierr(arguments.callee.toString()); }
function i53 () { ierr(arguments.callee.toString()); }
function i54 () { ierr(arguments.callee.toString()); }
function i57 () { ierr(arguments.callee.toString()); }
function i5a () { ierr(arguments.callee.toString()); }
function i5b () { ierr(arguments.callee.toString()); }
function i5c () { ierr(arguments.callee.toString()); }
function i5f () { ierr(arguments.callee.toString()); }


function i62 () { ierr(arguments.callee.toString()); }
function i63 () { ierr(arguments.callee.toString()); }
function i64 () { ierr(arguments.callee.toString()); }
function i67 () { ierr(arguments.callee.toString()); }
function i6b () { ierr(arguments.callee.toString()); }
function i6f () { ierr(arguments.callee.toString()); }

function i72 () { ierr(arguments.callee.toString()); }
function i73 () { ierr(arguments.callee.toString()); }
function i74 () { ierr(arguments.callee.toString()); }
function i77 () { ierr(arguments.callee.toString()); }
function i7a () { ierr(arguments.callee.toString()); }
function i7b () { ierr(arguments.callee.toString()); }
function i7c () { ierr(arguments.callee.toString()); }
function i7f () { ierr(arguments.callee.toString()); }

function i80 () { ierr(arguments.callee.toString()); }
function i82 () { ierr(arguments.callee.toString()); }
function i83 () { ierr(arguments.callee.toString()); }
function i87 () { ierr(arguments.callee.toString()); }
function i89 () { ierr(arguments.callee.toString()); }
function i8b () { ierr(arguments.callee.toString()); }
function i8f () { ierr(arguments.callee.toString()); }

function i92 () { ierr(arguments.callee.toString()); }
function i93 () { ierr(arguments.callee.toString()); }
function i97 () { ierr(arguments.callee.toString()); }
function i9b () { ierr(arguments.callee.toString()); }
function i9c () { ierr(arguments.callee.toString()); }
function i9e () { ierr(arguments.callee.toString()); }
function i9f () { ierr(arguments.callee.toString()); }

function ia3 () { ierr(arguments.callee.toString()); }
function ia7 () { ierr(arguments.callee.toString()); }
function iab () { ierr(arguments.callee.toString()); }
function iaf () { ierr(arguments.callee.toString()); }

function ib2 () { ierr(arguments.callee.toString()); }
function ib3 () { ierr(arguments.callee.toString()); }
function ib7 () { ierr(arguments.callee.toString()); }
function ibb () { ierr(arguments.callee.toString()); }
function ibf () { ierr(arguments.callee.toString()); }

function ic2 () { ierr(arguments.callee.toString()); }
function ic3 () { ierr(arguments.callee.toString()); }
function ic7 () { ierr(arguments.callee.toString()); }
function icb () { ierr(arguments.callee.toString()); }
function icf () { ierr(arguments.callee.toString()); }

function id2 () { ierr(arguments.callee.toString()); }
function id3 () { ierr(arguments.callee.toString()); }
function id4 () { ierr(arguments.callee.toString()); }
function id7 () { ierr(arguments.callee.toString()); }
function ida () { ierr(arguments.callee.toString()); }
function idb () { ierr(arguments.callee.toString()); }
function idc () { ierr(arguments.callee.toString()); }
function idf () { ierr(arguments.callee.toString()); }

function ie2 () { ierr(arguments.callee.toString()); }
function ie3 () { ierr(arguments.callee.toString()); }
function ie7 () { ierr(arguments.callee.toString()); }
function ieb () { ierr(arguments.callee.toString()); }
function ief () { ierr(arguments.callee.toString()); }

function if2 () { ierr(arguments.callee.toString()); }
function if3 () { ierr(arguments.callee.toString()); }
function if4 () { ierr(arguments.callee.toString()); }
function if7 () { ierr(arguments.callee.toString()); }
function ifa () { ierr(arguments.callee.toString()); }
function ifb () { ierr(arguments.callee.toString()); }
function ifc () { ierr(arguments.callee.toString()); }
function iff () { ierr(arguments.callee.toString()); }
/*
 *  updatePixelDisplay() - Updates the display at one pixel position
 */

function updateDisplayPixel( addr ) {
  display[addr-0x200].background = palette[memoryStack.getElement(addr) & 0x0f];
}

/*
 *  updateDisplayFull() - Simply redraws the entire display according to memoryStack
 *  The colors are supposed to be identical with the C64's palette.
 */

function updateDisplayFull() {
  for( y=0; y<32; y++ ) {
    for( x=0; x<32; x++ ) {
      updateDisplayPixel( ((y<<5)+x) + 0x200 );
    }
  }
}
