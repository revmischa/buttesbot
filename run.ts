import { Interp } from "./src/interp";

const interp = new Interp();
await interp.loadState();

const cmd = process.argv.slice(2).join(" ");
if (!cmd) throw new Error("Missing cmd");

const res = interp.eval(cmd, { channel: "C0123", nick: "U123" });
console.log("Command", cmd, "\n---\n");
console.log(res);
