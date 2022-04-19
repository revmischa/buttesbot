import memoizee from "memoizee";
import path from "path";
import retus from "retus";
import { Tcl } from "tcl";
import { loadState } from "./state";
import { sha1 } from "./util";

export const getInterp = memoizee(async () => {
  const interp = new Interp();
  await interp.loadState();
  return interp;
});

export interface EvalContext {
  channel: string;
  nick: string;
}

export class Interp {
  tcl;
  urlMap: Record<string, string>;

  constructor() {
    this.tcl = new Tcl();
    this.urlMap = {};

    this.loadSmeggdropTcl();
    this.setBuiltins();
  }

  protected loadSmeggdropTcl() {
    const smeggdropRoot = process.env.SMEGGDROP_ROOT || "./smeggdrop";
    this.tcl.$.set("SMEGGDROP_ROOT", smeggdropRoot);
    this.tcl.source(path.join(smeggdropRoot, "commands.tcl"));
  }

  protected setBuiltins() {
    this.tcl.proc("core::curl", (url: string) => {
      const res = retus(url); // synchronous
      const body = res.body as string;
      const val = body.replace(/"/g, '\\"');
      this.tcl.$.set("result", `{${res.statusCode} "${val}"}`);
    });

    // note that we can't return values from these functions, so we need
    // to set a result var and wrap it in a proc
    this.tcl.proc("__sha1", (val: string) => {
      this.tcl.$.set("_result", sha1(val));
    });
    this.tcl.proc("__names", () => {
      // should return list of names in the channel
      this.tcl.$.set("_result", [
        "mvs",
        "ollipekka",
        "mdl",
        "dantifa",
        "t12",
        "snb",
        "mwnd",
      ]);
    });

    this.tcl.evalSync(`
      proc core::sha1 {val} { __sha1 $val; return $_result }
      proc names {} { __names; return [split $_result ","] }
    `);
  }

  async loadState() {
    const { procs, vars } = await loadState();

    // let procsScript = `namespace eval buttes {`;
    let procsScript = ``;
    // const procNames: string[] = [];
    Object.entries(procs).forEach(([name, body]) => {
      if (!name || name === "{}") return;
      const cmd = `proc {${name}} ${body}\n`;
      if (name == "megalump") console.log(cmd);

      procsScript += cmd;
      // procNames.push(`{${name}}`);

      try {
        // this.tcl.evalSync(`proc {${name}} ${body}`);
      } catch (ex) {
        console.error("Failed to create proc", name, ":", ex, "\nBody:", body);
      }
    });
    // procsScript += `}\n namespace eval commands { meta_proc buttes ${procNames.join(
    //   " "
    // )} }`;
    // console.log(procsScript);
    try {
      this.tcl.evalSync(procsScript);
    } catch (ex) {
      console.error("Failed to create namespaced procs:", ex);
    }

    let varsScript = ``;
    Object.entries(vars).forEach(([name, body]) => {
      if (!name || name === "{}" || name === "procs") return;
      const splitIdx = body.indexOf(" ");
      if (splitIdx === -1) throw new Error("invalid var:" + body);

      const type = body.substring(0, splitIdx);
      let val = body.substring(splitIdx + 1).trim();
      val = val.replace(/\n/g, "\\n");

      let cmd = "";
      if (type === "scalar") cmd = `set {${name}} ${val}`;
      else if (type === "array") cmd = `set {${name}} [list ${val}]`;
      else throw new Error("unknown var type: " + type);

      // this.tcl.evalSync(cmd);

      varsScript += `${cmd};\n`;
    });

    // console.log(varsScript);

    this.tcl.evalSync(varsScript);
    // try {
    //   // this.tcl.evalSync(`namespace eval buttes { ${cmd} }`);
    // } catch (ex) {
    //   console.warn("Failed to set var", name, ex);
    // }
  }

  eval(cmd: string, ctx?: EvalContext): string {
    // set exec context
    this.tcl.evalSync(`
    namespace eval context {
      set nick ${ctx?.nick ? `<@${ctx.nick}>` : "you"}
      set channel ${ctx?.channel ? `<#${ctx.channel}>` : "#tcl"}
    }
    `);

    // const toEval = "namespace eval commands {" + cmd + "};";
    const toEval = cmd;
    // console.log("toEval:", `'${toEval}'`);
    const res = this.tcl.evalSync(toEval);
    return res.data();
  }

  setVar(name: string, value: string) {
    this.tcl.$.set(name, value);
  }
}
