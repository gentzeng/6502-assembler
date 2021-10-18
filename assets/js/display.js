export class Display extends Array {
  constructor(size) {
    super(size);
    this.palette = new Array(
      "#000000", "#ffffff", "#880000", "#aaffee", "#cc44cc", "#00cc55", "#0000aa", "#eeee77",
      "#dd8855", "#664400", "#ff7777", "#333333", "#777777", "#aaff66", "#0088ff", "#bbbbbb"
    );

    this.#createScreen();
    this.#linkWithScreen();
  }

  #createScreen () {
    let html = '<table class="screen">';
    for(let y = 0; y < 32; y++) {
      html += "<tr>";
      for(let x = 0; x < 32; x++) {
        html += '<td class="screen" id="x' + x + 'y' + y + '"></td>';
      }
      html += "</tr>";
    }
    html += "</table>";
    $("#screen").html(html);
  }

  #linkWithScreen() {
    for(let y = 0; y < 32; y++) {
      for(let x = 0; x < 32; x++) {
        let pixelId = "x" + x + "y" + y;
        this[y * 32 + x] = $("#" + pixelId);
      }
    }
  }

  reset() {
    for(let y = 0; y < 32; y++) {
      for(let x = 0; x < 32; x++) {
        this[y * 32 + x].css("background", "#000000");
      }
    }
  }

  /*
  *  updateDisplayFull() - Simply redraws the entire display according to memory
  *  The colors are supposed to be identical with the C64's palette.
  */
  updateFull() {
    for( let y = 0; y < 32; y++ ) {
      for( let x = 0; x < 32; x++ ) {
        this.updatePixel( ((y << 5) + x) + 0x200 );
      }
    }
  }
  updatePixel( addr ) {
    let colorNibble = exports.memory.readByte(addr).lowestNibble;
    this[addr - 0x200].css("background", this.palette[colorNibble]);
  }
}