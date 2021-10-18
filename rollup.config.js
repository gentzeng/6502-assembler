import {nodeResolve} from "@rollup/plugin-node-resolve"
export default {
  input: "./assets/js/initialize.js",
	
  output: {
    file: "./assets/js/assembler.bundle.js",
    name: "AssemblerSixFiveOTwo",
    format: "iife"
  },
  plugins: [nodeResolve()]
}
