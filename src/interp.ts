import { loadState } from "./state";
import { Tcl } from "tcl";
import got from "got";

export class Interp {
  tcl;
  urlMap: Record<string, string>;

  constructor() {
    this.tcl = new Tcl();
    this.urlMap = {};
  }

  async loadState() {
    const { procs, vars } = await loadState();
    Object.entries(procs).forEach(([name, body]) => {
      if (!name || name === "{}") return;
      this.tcl.cmdSync(`proc {${name}} ${body}`);
    });
    Object.entries(vars).forEach(([name, body]) => {
      if (!name || name === "{}" || name === "procs") return;
      const splitIdx = body.indexOf(" ");
      if (splitIdx === -1) throw new Error("invalid var:" + body);

      const type = body.substring(0, splitIdx);
      let val = body.substring(splitIdx + 1).trim();
      val = val.replace(/\n/g, "\\n");

      let cmd = "";
      if (type === "scalar") cmd = `variable {${name}} ${val}`;
      else if (type === "array") cmd = `variable {${name}} ${val}`;
      else throw new Error("unknown var type: " + type);

      try {
        this.tcl.evalSync(cmd);
      } catch (ex) {
        console.warn("Failed to set var", name, ex);
      }
    });
    await this.loadUrls();
  }

  private async loadUrls() {
    return Promise.all(
      ["http://llolo.lol/tcl/fatgoon.tcl"].map(async (url) => {
        const { body } = await got(url);
        this.urlMap[url] = body;
      })
    );
  }

  cmd(cmd: string): string {
    // set exec context
    this.tcl.cmdSync(`namespace eval context {
      variable nick "you"
      set nick "you"
    }`);

    // fake curl
    this.tcl.proc("core::curl", async (url: string) => {
      if (!this.urlMap[url]) {
        console.warn("No mapped URL", url);
        this.tcl.$.set("result", `{404 "not mapped"}`);
        return;
      }
      const response = this.urlMap[url];
      const val = response.replace(/"/g, '\\"');
      this.tcl.$.set("result", `{200 "${val}"}`);
    });

    const res = this.tcl.cmdSync(cmd);
    return res.data();
  }

  setVar(name: string, value: string) {
    this.tcl.$.set(name, value);
  }
}
