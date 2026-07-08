import { App, Stack, StackProps } from "aws-cdk-lib";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { domain, domainName } from "./constants";
import { HostedZone } from "aws-cdk-lib/aws-route53";

export class CertificateStack extends Stack {
  public readonly certificateArn: string;

  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: domainName,
    });

    const certificate = new Certificate(this, "AqiRssCertificate", {
      domainName: domain,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    this.certificateArn = certificate.certificateArn;
  }
}
