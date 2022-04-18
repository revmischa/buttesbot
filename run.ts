import { Interp } from "./src/interp";

const interp = new Interp();
await interp.loadState();

const cmd = process.argv[2];
if (!cmd) throw new Error("Missing cmd");

const res = interp.cmd(cmd);
console.log("Command", cmd, "\n---\n");
console.log(res);
