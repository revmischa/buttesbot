import { Code, LayerVersion, LayerVersionProps } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class TclLayer extends LayerVersion {
  constructor(
    scope: Construct,
    id: string,
    props: Partial<LayerVersionProps> = {}
  ) {
    // const code = Code.fromDockerBuild("layer");
    const code = Code.fromAsset("layer/tcl.zip");

    super(scope, id, {
      ...props,
      code,
    });
  }
}
