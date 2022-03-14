import { consoleDebug } from "../message";

// Set and Clear [implied addressing mode]=====================================================
// TODO: i58 and i78 are not implemented?
export function i58(name) {
  exports.flags.clear();
  console.warn(name + ": clearing interrupt disable status");
}
export function i78(name) {
  exports.flags._set();
  console.warn(name + ": setting interrupt disable status");
}
export function i18(name) {
  clearFlag(name, "carry");
}
export function i38(name) {
  setFlag(name, "carry");
}
export function id8(name) {
  clearFlag(name, "decimal");
}
export function if8(name) {
  setFlag(name, "decimal");
}
export function ib8(name) {
  clearFlag(name, "overflow");
}
// clearValue + SetValue = 0xff = 255
function clearFlag(name, flagName) {
  consoleDebug({ msg: name + ": clearing " + flagName + " flag" });
  exports.flags[flagName].clear();
}
function setFlag(name, flagName) {
  consoleDebug({ msg: name + ": setting " + flagName + " flag" });
  exports.flags[flagName]._set();
}
