import * as sst from "@serverless-stack/resources";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { APP_SECRETS } from "../src/secret";
import { TclLayer } from "./resources/layer";

export default class MainStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);

    const secret = new Secret(this, "Secret", {
      description: "Buttes",
      generateSecretString: {
        generateStringKey: "random",
        secretStringTemplate: JSON.stringify({
          [APP_SECRETS.SLACK_KEY]: "change me",
        }),
      },
    });

    const layer = new TclLayer(this, "TclLayer");
    this.setDefaultFunctionProps({
      layers: [layer],
      runtime: "nodejs14.x",
      environment: {
        SECRET_ARN: secret.secretArn,
        TCL_LIBRARY: "/opt/lib/tcl8.5",
        SMEGGDROP_ROOT: process.env.SMEGGDROP_ROOT || "/opt/lib/smeggdrop",
      },
      bundle: {
        // format: "esm",
        externalModules: [
          "tcl",
          "node-addon-api",
          "bindings",
          "sync-rpc",
          "retus",
          "worker",
          "find-port",
        ],
        copyFiles: [{ from: "state" }],
      },
      timeout: 30,
      permissions: [[secret, "grantRead"]],
    });

    // Create a HTTP API
    const api = new sst.Api(this, "Api", {
      routes: {
        "POST /event": "src/api.eventHandler",
        // "POST /eval": "src/api.evalHandler",
        "GET /auth": "src/api.authHandler",
        "GET /oauth/complete": "src/api.authCompleteHandler",
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      ApiEndpoint: api.url,
    });
  }
}
