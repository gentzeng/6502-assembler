import { consoleDebug } from "../message";
import { ierr } from "./error";

export function _02(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _12(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _22(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _32(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _42(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _52(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _62(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _72(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _92(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _b2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _d2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  _f2(name);
}
export function _f2(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  consoleDebug({ msg: name + ": KIL, processor locked" });
  exports.processorLocked = true;
}
