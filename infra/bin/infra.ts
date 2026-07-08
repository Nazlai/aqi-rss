#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { InfraStack } from "../lib/infra-stack";
import { CertificateStack } from "../lib/certificate-stack";
import { accountId } from "../lib/constants";

const app = new cdk.App();
const certificateStack = new CertificateStack(app, "CertificateStack", {
  env: {
    region: "us-east-1",
    account: accountId,
  },
  crossRegionReferences: true,
});

const infraStack = new InfraStack(app, "InfraStack", {
  env: {
    region: process.env.REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  crossRegionReferences: true,
  certificateArn: certificateStack.certificateArn,
});

infraStack.addDependency(certificateStack);
