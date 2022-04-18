import { readFileSync, existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

type StateType = "vars" | "procs";

export const loadState = async () => {
  // read index files
  // await loadStateDir("vars");
  // await loadStateDir("procs");

  const vars = await loadStateJson("vars");
  const procs = await loadStateJson("procs");
  return { vars, procs } as const;
};

const loadStateJson = async (dir: StateType) => {
  const file = `state/${dir}.json`;
  const contents = await readFile(file, "utf8");
  const mapping = JSON.parse(contents) as Record<string, string>;
  return mapping;
};

const loadStateDir = async (dir: StateType) => {
  const index = await loadIndex(dir);
  const mapping = Object.fromEntries(
    Object.entries(index).map(([name, hash]) => {
      const file = `state/${dir}/${hash}`;
      if (!existsSync(file)) {
        console.warn("missing", name, "file", file);
        return [];
      }
      const contents = readFileSync(file, "utf8");
      return [name, contents];
    })
  );
  // console.log(mapping);
  await writeFile(`state/${dir}.json`, JSON.stringify(mapping));
};

const loadIndex = async (dir: StateType) => {
  // read index file
  const indexFile = await readFile(`state/${dir}/_index`, "utf8");
  const lines = indexFile
    .split("\n")
    .map((line) => line.match(/\{([^}]+)\}\s+([a-f0-9]{40})/))
    .filter((m) => m && m[1] && m[2])
    .map((g) => [g?.[1], g?.[2]]);

  const mapping = Object.fromEntries(lines);
  return mapping;
};
