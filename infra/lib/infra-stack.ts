import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin, VpcOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { domain, domainName, subDomain } from "./constants";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import path from "path";

interface InfraStackProps extends cdk.StackProps {
  certificateArn: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromLookup(this, "zone", {
      domainName: domainName,
    });

    const natProvider = ec2.NatProvider.instanceV2({
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.NANO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        edition: ec2.AmazonLinuxEdition.STANDARD,
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      creditSpecification: ec2.CpuCredits.STANDARD,
      defaultAllowedTraffic: ec2.NatTrafficDirection.OUTBOUND_ONLY,
    });

    // fixme
    // pull docker image from ecr
    const repository = new ecr.Repository(this, "AqiRssRepository", {
      emptyOnDelete: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const vpc = new ec2.Vpc(this, "AqiRssVpc", {
      vpcName: "aqi-rss-vpc",
      ipAddresses: ec2.IpAddresses.cidr("10.20.0.0/16"),
      maxAzs: 1,
      natGatewayProvider: natProvider,
      natGateways: 1,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: "aqi-rss-public-subnet",
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: "aqi-rss-private-subnet-egress",
        },
      ],
    });

    const bucket = new s3.Bucket(this, "AqiRssBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const deploymentBucket = new s3.Bucket(this, "AqiRssDeploymentBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    natProvider.connections.allowFrom(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.allTraffic(),
    );

    new ec2.GatewayVpcEndpoint(this, "S3GatewayEndpoint", {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    const role = new Role(this, "SSMInstanceRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
      ],
    });

    const { region, account } = cdk.Stack.of(this);

    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "ssm:GetParametersByPath",
          "ssm:GetParameter",
          "ssm:GetParameters",
        ],
        resources: [
          `arn:aws:ssm:${region}:${account}:parameter/aqi`,
          `arn:aws:ssm:${region}:${account}:parameter/aqi/*`,
        ],
      }),
    );

    repository.grantPull(role);
    deploymentBucket.grantRead(role);

    const userData = ec2.UserData.forLinux();

    userData.addCommands(
      "yum update -y",
      "dnf install -y docker",
      "systemctl start docker",
      `curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose`,
      "chmod +x /usr/local/bin/docker-compose",
    );

    const ec2Instance = new ec2.Instance(this, "AqiRssEc2Instance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.NANO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        edition: ec2.AmazonLinuxEdition.STANDARD,
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
        cachedInContext: true,
      }),
      creditSpecification: ec2.CpuCredits.STANDARD,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      userData,
      role,
      ssmSessionPermissions: true,
    });

    ec2Instance.connections.allowFrom(
      ec2.PrefixList.fromLookup(this, "PrefixListFromName", {
        prefixListName: "com.amazonaws.global.cloudfront.origin-facing",
      }),
      ec2.Port.tcp(8080),
    );

    const certificate = Certificate.fromCertificateArn(
      this,
      "AqiRssCertificate",
      props.certificateArn,
    );

    const requestFunction = new cf.Function(
      this,
      "AqiRssViewerRequestFunction",
      {
        code: cf.FunctionCode.fromFile({
          filePath: path.join(__dirname, "cloudfront-gatekeeper.js"),
        }),
        functionName: "aqi_rss_request_filter",
        runtime: cf.FunctionRuntime.JS_2_0,
      },
    );

    const cachePolicy = new cf.CachePolicy(
      this,
      "AqiRssDistributionCachePolicy",
      {
        queryStringBehavior: cf.CacheQueryStringBehavior.allowList("location"),
      },
    );

    const distribution = new cf.Distribution(this, "AqiRssDistribution", {
      defaultBehavior: {
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: VpcOrigin.withEc2Instance(ec2Instance, {
          httpPort: 8080,
          protocolPolicy: cf.OriginProtocolPolicy.HTTP_ONLY,
        }),
        cachePolicy: cachePolicy,
        functionAssociations: [
          {
            eventType: cf.FunctionEventType.VIEWER_REQUEST,
            function: requestFunction,
          },
        ],
      },
      additionalBehaviors: {
        "static/*": {
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          origin: S3BucketOrigin.withOriginAccessControl(bucket),
        },
      },
      domainNames: [domain],
      certificate,
    });

    new ARecord(this, "AqiRssArecord", {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      recordName: subDomain,
    });
  }
}
