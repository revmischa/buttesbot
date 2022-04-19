# ButtesBot

## Quickstart

### Start by installing the dependencies

```bash
sudo apt install tcl-dev
npm install
```

### Eval TCL

```bash
npx esmo run.ts fatgoon
```

```
Command fatgoon
---

I ordered about $30 worth of food from             __________
burger king in 2006, and all the kids working \   (--[ .]-[ .]
the grill asked if they could have their          (_______O__)
photo taken with me. That was kind of weird.
```

## AWS Commands

### `npm run start`

Starts the local Lambda development environment.

### `npm run build`

Build your app and synthesize your stacks.

Generates a `.build/` directory with the compiled files and a `.build/cdk.out/` directory with the synthesized CloudFormation stacks.

### `npm run deploy [stack]`

Deploy all your stacks to AWS. Or optionally deploy a specific stack.

### `npm run remove [stack]`

Remove all your stacks and all of their resources from AWS. Or optionally remove a specific stack.

### `npm run test`

Runs your tests using Jest. Takes all the [Jest CLI options](https://jestjs.io/docs/en/cli).

## Documentation

Learn more about the Serverless Stack.

- [Docs](https://docs.serverless-stack.com)
- [@serverless-stack/cli](https://docs.serverless-stack.com/packages/cli)
- [@serverless-stack/resources](https://docs.serverless-stack.com/packages/resources)
