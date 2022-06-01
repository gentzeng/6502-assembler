import { consoleDebug } from "./message";
import { i69, i6d, i7d, i79, i65, i75, i61, i71} from "./instructions/arithm-add" // prettier-ignore
import { ie9, ied, ifd, if9, ie5, if5, ie1, if1, _eb} from "./instructions/arithm-sub" // prettier-ignore

import { ic9, icd, idd, id9, ic5, id5, ic1, id1 } from "./instructions/compare" // prettier-ignore
import { ie0, iec, ie4 } from "./instructions/compare" // prettier-ignore
import { ic0, icc, ic4} from "./instructions/compare" // prettier-ignore

import { ie8, ic8, iee, ife, ie6, if6 } from "./instructions/crement" // prettier-ignore
import { ica, i88, ice, ide, ic6, id6 } from "./instructions/crement" // prettier-ignore

import { ierr } from "./instructions/error" // prettier-ignore

import { i58, i78, i18, i38, id8, if8, ib8 } from "./instructions/flags" // prettier-ignore

import { i20, i4c, i6c, i40, i60 } from "./instructions/jump-and-branch" // prettier-ignore
import { i10, i10RelativeMinus } from "./instructions/jump-and-branch" // prettier-ignore
import { i30, i30RelativeMinus } from "./instructions/jump-and-branch" // prettier-ignore
import { i50, i50RelativeMinus } from "./instructions/jump-and-branch" // prettier-ignore
import { i70, i70RelativeMinus } from "./instructions/jump-and-branch" // prettier-ignore
import { i90, i90RelativeMinus } from "./instructions/jump-and-branch" // prettier-ignore
import { ib0, ib0RelativeMinus } from "./instructions/jump-and-branch" // prettier-ignore
import { id0, id0RelativeMinus } from "./instructions/jump-and-branch" // prettier-ignore
import { if0, if0RelativeMinus } from "./instructions/jump-and-branch" // prettier-ignore

import { _02, _12, _22, _32, _42, _52, _62, _72, _92, _b2, _d2, _f2, } from "./instructions/kill/"; //prettier-ignore

import { ia9, iad, ibd, ib9, ia5, ib5, ia1, ib1} from "./instructions/load" // prettier-ignore
import { ia2, iae, ibe, ia6, ib6 } from "./instructions/load" // prettier-ignore
import { ia0, iac, ibc, ia4, ib4 } from "./instructions/load" // prettier-ignore
import { _a7, _b7, _af, _bf, _a3, _b3 } from "./instructions/load-illegal";

import { i29, i2d, i3d, i39, i25, i35, i21, i31} from "./instructions/logic-and" // prettier-ignore
import { _0b, _2b, _8f, _87, _97, _83, _6b, _4b, _ab, _9f, _93, _cb, _bb} from "./instructions/logic-and-illegal" // prettier-ignore
import { i09, i0d, i1d, i19, i05, i15, i01, i11} from "./instructions/logic-or" // prettier-ignore
import { i49, i4d, i5d, i59, i45, i55, i41, i51} from "./instructions/logic-xor" // prettier-ignore

import { iea } from "./instructions/noop" // prettier-ignore
import { _1a, _3a, _5a, _7a, _da, _fa } from "./instructions/noop" // prettier-ignore
import { _04, _14, _34, _44, _54, _64, _74, _80, _82, _89, _c2, _d4, _e2, _f4} from "./instructions/noop" // prettier-ignore
import { _0c, _1c, _3c, _5c, _7c, _dc, _fc} from "./instructions/noop" // prettier-ignore

import { i2a, i2e, i3e, i26, i36, i6a, i6e, i7e, i66, i76} from "./instructions/rotate" // prettier-ignore
import { i0a, i0e, i1e, i06, i16, i4a, i4e, i5e, i46, i56} from "./instructions/shift" // prettier-ignore

import { i08, i28, i48, i68 } from "./instructions/stack" // prettier-ignore

import { i8d, i9d, i99, i85, i95, i81, i91}  from "./instructions/store" // prettier-ignore
import { i8e, i86, i96 } from "./instructions/store" // prettier-ignore
import { i8c, i84, i94 } from "./instructions/store" // prettier-ignore

import { i2c, i24 } from "./instructions/test-bits" // prettier-ignore

import { iaa, ia8, i8a, i98, iba, i9a } from "./instructions/transfer" // prettier-ignore

// prettier-ignore
export var instructions = new Array( //instruction starting with _ is illegal
  i00, i01, _02, _03, _04, i05, i06, _07, i08, i09, i0a, _0b, _0c, i0d, i0e, _0f,
  i10, i11, _12, _13, _14, i15, i16, _17, i18, i19, _1a, _1b, _1c, i1d, i1e, _1f,
  i20, i21, _22, _23, i24, i25, i26, _27, i28, i29, i2a, _2b, i2c, i2d, i2e, _2f,
  i30, i31, _32, _33, _34, i35, i36, _37, i38, i39, _3a, _3b, _3c, i3d, i3e, _3f,
  i40, i41, _42, _43, _44, i45, i46, _47, i48, i49, i4a, _4b, i4c, i4d, i4e, _4f,
  i50, i51, _52, _53, _54, i55, i56, _57, i58, i59, _5a, _5b, _5c, i5d, i5e, _5f,
  i60, i61, _62, _63, _64, i65, i66, _67, i68, i69, i6a, _6b, i6c, i6d, i6e, _6f,
  i70, i71, _72, _73, _74, i75, i76, _77, i78, i79, _7a, _7b, _7c, i7d, i7e, _7f,
  _80, i81, _82, _83, i84, i85, i86, _87, i88, _89, i8a, _8b, i8c, i8d, i8e, _8f,
  i90, i91, _92, _93, i94, i95, i96, _97, i98, i99, i9a, _9b, _9c, i9d, _9e, _9f,
  ia0, ia1, ia2, _a3, ia4, ia5, ia6, _a7, ia8, ia9, iaa, _ab, iac, iad, iae, _af,
  ib0, ib1, _b2, _b3, ib4, ib5, ib6, _b7, ib8, ib9, iba, _bb, ibc, ibd, ibe, _bf,
  ic0, ic1, _c2, _c3, ic4, ic5, ic6, _c7, ic8, ic9, ica, _cb, icc, icd, ice, _cf,
  id0, id1, _d2, _d3, _d4, id5, id6, _d7, id8, id9, _da, _db, _dc, idd, ide, _df,
  ie0, ie1, _e2, _e3, ie4, ie5, ie6, _e7, ie8, ie9, iea, _eb, iec, ied, iee, _ef,
  if0, if1, _f2, _f3, _f4, if5, if6, _f7, if8, if9, _fa, _fb, _fc, ife, ifd, _ff,
  i10RelativeMinus,
  i30RelativeMinus,
  i50RelativeMinus,
  i70RelativeMinus,
  i90RelativeMinus,
  ib0RelativeMinus,
  id0RelativeMinus,
  if0RelativeMinus,
);

// Miscellaneous ==============================================================================
// Break
export function i00(name) {
  // implied
  exports.codeRunning = false;
  exports.flags.break._set();
  exports.flags.interruptDisable._set();
  consoleDebug({ msg: name + "BRK : Forcing interrupt" });
}
// undefined opcodes ==========================================================================

// --------------------------------------------------------------------------------------------

export function _c7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP zp
export function _d7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP zp, X
export function _cf(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP abs
export function _df(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP abs, X
export function _db(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP abs, Y
export function _c3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP (ind, X)
export function _d3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // DCP (ind), Y

export function _e7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC zp
export function _f7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC zp, X
export function _ef(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC abs
export function _ff(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC abs,X
export function _fb(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC abs,Y
export function _e3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC (ind,X)
export function _f3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // ISC (ind), Y

export function _27(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA zp
export function _37(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA zp,X
export function _2f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA abs
export function _3f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA abs,X
export function _3b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA abs,Y
export function _23(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA (ind,X)
export function _33(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RLA (ind), Y

export function _67(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA zp
export function _77(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA zp,X
export function _6f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA abs
export function _7f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA abs,X
export function _7b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA abs,Y
export function _63(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA (ind, X)
export function _73(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // RRA (ind), Y

export function _07(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO zp
export function _17(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO zp,X
export function _0f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO abs
export function _1f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO abs,X
export function _1b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO abs,Y
export function _03(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO (ind, X)
export function _13(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SLO (ind), Y

export function _47(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE zp
export function _57(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE zp,X
export function _4f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE abs
export function _5f(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE abs,X
export function _5b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE abs,Y
export function _43(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE (ind, X)
export function _53(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SRE (ind), Y

export function _9e(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SXA abs, Y

export function _9c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // SYA abs, X

export function _8b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // XAA exact operation unknown

export function _9b(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
} // XAS abs,Y
