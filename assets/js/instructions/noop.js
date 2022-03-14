import { consoleDebug } from "../message";
import { ierr } from "./error";

export function iea(name) {
  // implied
  consoleDebug({ msg: name + ": NOOP" });
}

export function _1a(name) {
  _fa(name);
  consoleDebug({ msg: name + ": NOOP" });
} // NOP implied
export function _3a(name) {
  _fa(name);
} // NOP implied
export function _5a(name) {
  _fa(name);
} // NOP implied
export function _7a(name) {
  _fa(name);
} // NOP implied
export function _da(name) {
  _fa(name);
} // NOP implied
export function _fa(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  consoleDebug({ msg: name + ": NOOP implied" });
} // NOP implied

// DOP -------------------
// DOP immediate
export function _80(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _e2(name);
}
export function _82(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _e2(name);
}
export function _89(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _e2(name);
}
export function _c2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _e2(name);
}
export function _e2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  consoleDebug({ msg: name + ": Double NOOP" });
}

// DOP zeroPage
export function _04(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _64(name);
}
export function _44(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _64(name);
}
export function _64(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  consoleDebug({ msg: name + ": Double NOOP" });
}

// DOP zeroPageX
export function _14(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f4(name);
}
export function _34(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f4(name);
}
export function _54(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f4(name);
}
export function _74(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f4(name);
}
export function _d4(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f4(name);
}
export function _f4(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  consoleDebug({ msg: name + ": Double NOOP" });
}

// TOP -------------------------
// TOP absolute
export function _0c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  consoleDebug({ msg: name + ": Triple NOOP" });
}
// TOP absoluteX
export function _1c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _fc(name);
}
export function _3c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _fc(name);
}
export function _5c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _fc(name);
}
export function _7c(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _fc(name);
}
export function _dc(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _fc(name);
}
export function _fc(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  consoleDebug({ msg: name + ": Triple NOOP" });
}
