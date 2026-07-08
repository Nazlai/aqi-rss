import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
// import * as ecr from "aws-cdk-lib/aws-ecr";
import { AutoScalingGroup, HealthChecks } from "aws-cdk-lib/aws-autoscaling";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { VpcOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  InstanceProfile,
  ManagedPolicy,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { domain, domainName, subDomain } from "./constants";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

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
    // const repository = new ecr.Repository(this, "AqiRssRepository");

    const vpc = new ec2.Vpc(this, "AqiRssVpc", {
      vpcName: "aqi-rss-vpc",
      ipAddresses: ec2.IpAddresses.cidr("10.20.0.0/16"),
      maxAzs: 2,
      natGatewayProvider: natProvider,
      natGateways: 1,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: "aqi-rss-public-subnet",
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          name: "aqi-rss-private-subnet",
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: "aqi-rss-private-subnet-egress",
        },
      ],
    });

    natProvider.connections.allowFrom(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.allTraffic(),
    );

    new ec2.InterfaceVpcEndpoint(this, "EcrVpcEndpoint", {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    new ec2.InterfaceVpcEndpoint(this, "EcrDockerVpcEndpoint", {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    new ec2.GatewayVpcEndpoint(this, "S3GatewayEndpoint", {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    const cluster = new ecs.Cluster(this, "AqiRssCluster", {
      vpc,
    });

    const role = new Role(this, "LaunchTemplateRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });

    role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonEC2ContainerServiceforEC2Role",
      ),
    );

    const instanceProfile = new InstanceProfile(
      this,
      "LaunchTemplateInstanceProfile",
      {
        role,
      },
    );

    const ec2InstanceLaunchTemplate = new ec2.LaunchTemplate(
      this,
      "LaunchTemplate",
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.NANO,
        ),
        machineImage: ecs.EcsOptimizedImage.amazonLinux2023(
          ecs.AmiHardwareType.ARM,
        ),
        cpuCredits: ec2.CpuCredits.STANDARD,
        instanceProfile,
        securityGroup: new ec2.SecurityGroup(
          this,
          "LaunchTemplateSecurityGroup",
          {
            vpc,
          },
        ),
      },
    );

    const autoScalingGroup = new AutoScalingGroup(this, "Asg", {
      vpc,
      launchTemplate: ec2InstanceLaunchTemplate,
      desiredCapacity: 1,
      minCapacity: 1,
      maxCapacity: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      healthChecks: HealthChecks.ec2({
        gracePeriod: cdk.Duration.seconds(100),
      }),
    });

    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      "AsgCapacityProvider",
      { autoScalingGroup },
    );

    cluster.addAsgCapacityProvider(capacityProvider);

    const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDef");

    taskDefinition.addContainer("DefaultContainer", {
      // image: ecs.ContainerImage.fromEcrRepository(repository),
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/nginx/nginx:mainline",
      ),
      memoryLimitMiB: 256,
      portMappings: [{ containerPort: 80 }],
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "aqi-rss-logs",
      }),
    });

    const ec2Service = new ecs.Ec2Service(this, "AqiRssService", {
      cluster,
      taskDefinition,
      desiredCount: 1,
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      circuitBreaker: { enable: true },
    });

    const lb = new ApplicationLoadBalancer(this, "Alb", {
      vpc,
      internetFacing: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    autoScalingGroup.connections.allowFrom(lb, ec2.Port.tcpRange(32768, 65535));

    const listener = lb.addListener("Listener", {
      port: 80,
      open: false,
    });

    listener.addTargets("Target", {
      port: 80,
      targets: [ec2Service],
    });

    listener.connections.allowFrom(
      ec2.PrefixList.fromLookup(this, "PrefixListFromName", {
        prefixListName: "com.amazonaws.global.cloudfront.origin-facing",
      }),
      ec2.Port.tcp(80),
    );

    const certificate = Certificate.fromCertificateArn(
      this,
      "AqiRssCertificate",
      props.certificateArn,
    );

    const distribution = new Distribution(this, "AqiRssDistribution", {
      defaultBehavior: {
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: VpcOrigin.withApplicationLoadBalancer(lb),
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
