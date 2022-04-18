import * as sst from "@serverless-stack/resources";
import { TclLayer } from "./resources/layer";

export default class MainStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);

    const layer = new TclLayer(this, "TclLayer");
    this.setDefaultFunctionProps({
      layers: [layer],
      runtime: "nodejs14.x",
      bundle: { format: "esm" },
    });

    // Create a HTTP API
    const api = new sst.Api(this, "Api", {
      routes: {
        "GET /event": "src/http.eventHandler",
        "GET /eval": "src/http.evalHandler",
        "GET /auth": "src/http.authHandler",
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      ApiEndpoint: api.url,
    });
  }
}
