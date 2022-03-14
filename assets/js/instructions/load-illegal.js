import { ierr } from "./error";
import { load } from "./load";

export function _a7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  load({ name: name, addrMode: "zeroPage" });
  exports.reg.X = exports.reg.A;
}
export function _b7(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  load({ name: name, addrMode: "zeroPageY" });
  exports.reg.X = exports.reg.A;
}
export function _af(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  load({ name: name, addrMode: "absolute" });
  exports.reg.X = exports.reg.A;
}
export function _bf(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  load({ name: name, addrMode: "absoluteY" });
  exports.reg.X = exports.reg.A;
}
export function _a3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  load({ name: name, addrMode: "(zeroPage, X)" });
  exports.reg.X = exports.reg.A;
}
export function _b3(name) {
  if (!exports.allowIllegalOpcode) {
    ierr(name);
  }
  load({ name: name, addrMode: "(zeroPage), Y" });
  exports.reg.X = exports.reg.A;
}
