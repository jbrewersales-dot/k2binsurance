import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
// We use the L1 CfnService/CfnVpcConnector from the *stable* aws-cdk-lib module
// rather than the @aws-cdk/aws-apprunner-alpha construct. The alpha module is
// versioned independently and frequently introduces breaking changes / must be
// kept in lockstep with the exact aws-cdk-lib version, which is a common source
// of "peer dependency" drift. The L1 constructs are generated from the stable
// CloudFormation resource spec and are fully deployable, so we prefer them here.
import * as apprunner from 'aws-cdk-lib/aws-apprunner';

export interface K2bStackProps extends cdk.StackProps {
  /** Reuse an existing ECR repository by name instead of creating one. */
  readonly existingEcrRepoName?: string;
  /** Image tag App Runner should deploy. Defaults to "latest". */
  readonly imageTag?: string;
  /** Turn on RDS deletion protection (default false for easy teardown). */
  readonly dbDeletionProtection?: boolean;
}

export class K2bStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: K2bStackProps = {}) {
    super(scope, id, props);

    const imageTag = props.imageTag ?? 'latest';
    const dbDeletionProtection = props.dbDeletionProtection ?? false;

    // Known-at-synth values that also match the RDS generated secret.
    const DB_USERNAME = 'k2badmin';
    const DB_NAME = 'k2b';
    const ECR_REPO_NAME = 'k2b-insurance';

    // ---------------------------------------------------------------------
    // Networking
    // ---------------------------------------------------------------------
    // 2 AZs keeps NAT/data-transfer cost low. We provision a single NAT
    // gateway (shared across AZs) as a deliberate cost/availability tradeoff:
    // the App Runner VPC connector routes ALL of the service's outbound
    // traffic through the private-with-egress subnets, so we need NAT for any
    // outbound internet access from the app. One NAT gateway is a single point
    // of failure; bump `natGateways` to 2 for production HA.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          // App Runner VPC connector ENIs live here so the service has
          // outbound internet egress via NAT while still reaching the DB.
          name: 'private-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          // RDS lives in isolated subnets (no NAT/route to the internet).
          // In-VPC traffic (App Runner connector -> RDS) uses the local route.
          name: 'isolated-db',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ---------------------------------------------------------------------
    // Security groups + ingress wiring
    // ---------------------------------------------------------------------
    // SG attached to the App Runner VPC connector (source of DB traffic).
    const appRunnerSg = new ec2.SecurityGroup(this, 'AppRunnerSg', {
      vpc,
      description: 'App Runner VPC connector security group',
      allowAllOutbound: true,
    });

    // SG attached to the RDS instance (destination).
    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSg', {
      vpc,
      description: 'RDS PostgreSQL security group',
      allowAllOutbound: true,
    });

    // Ingress direction: allow the App Runner connector SG to connect INTO the
    // RDS SG on the Postgres port. `addIngressRule` is added to `dbSg` (the
    // destination), with the peer being `appRunnerSg` (the source). This is the
    // correct direction: traffic flows App Runner -> RDS:5432.
    dbSg.addIngressRule(
      ec2.Peer.securityGroupId(appRunnerSg.securityGroupId),
      ec2.Port.tcp(5432),
      'Allow App Runner VPC connector to reach Postgres',
    );

    // ---------------------------------------------------------------------
    // ECR repository
    // ---------------------------------------------------------------------
    // Only create a repo if the operator did not pass an existing one.
    const repo: ecr.IRepository = props.existingEcrRepoName
      ? ecr.Repository.fromRepositoryName(
          this,
          'AppRepo',
          props.existingEcrRepoName,
        )
      : new ecr.Repository(this, 'AppRepo', {
          repositoryName: ECR_REPO_NAME,
          imageScanOnPush: true,
          // Keep only the most recent ~10 images to control storage cost.
          lifecycleRules: [{ maxImageCount: 10 }],
          // Easy teardown: allow `cdk destroy` to remove the repo and its images.
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          emptyOnDelete: true,
        });

    // ---------------------------------------------------------------------
    // RDS PostgreSQL
    // ---------------------------------------------------------------------
    const dbInstance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      // Credentials are generated into Secrets Manager as a JSON blob
      // { username, password, host, port, dbname, ... }.
      credentials: rds.Credentials.fromGeneratedSecret(DB_USERNAME, {
        secretName: 'k2b/db-credentials',
      }),
      databaseName: DB_NAME,
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // storage autoscaling ceiling
      storageEncrypted: true,
      publiclyAccessible: false,
      multiAz: false,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: dbDeletionProtection,
      // Match teardown behavior to deletion protection: if protection is off,
      // let `cdk destroy` remove the instance; otherwise retain it.
      removalPolicy: dbDeletionProtection
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const dbCredentialsSecret = dbInstance.secret!;

    // ---------------------------------------------------------------------
    // Secrets: AUTH_SECRET and the composed DATABASE_URL
    // ---------------------------------------------------------------------
    // Generate a random 48-char JWT signing secret. With no generateStringKey
    // the entire secret value IS the generated string, so App Runner can inject
    // the raw value directly via RuntimeEnvironmentSecrets (ARN reference).
    const authSecret = new secretsmanager.Secret(this, 'AuthSecret', {
      secretName: 'k2b/auth-secret',
      description: 'JWT signing secret (AUTH_SECRET) for the Next.js app',
      generateSecretString: {
        passwordLength: 48,
        excludePunctuation: true,
      },
    });

    // DATABASE_URL: App Runner's RuntimeEnvironmentSecrets can only inject a
    // whole secret value (or a single JSON key) per env var -- it cannot
    // *compose* a connection string from multiple discrete fields. So we build
    // the full Postgres URL here and store it in a dedicated secret.
    //
    // The password is not known at synth time, so we splice in a CloudFormation
    // *dynamic reference* to the RDS secret's `password` key. At deploy time
    // CloudFormation resolves it server-side; the literal password is never
    // written into the template. Username/db-name are known literals that match
    // the generated RDS secret, and host/port come from the instance tokens.
    //
    // Caveat: the RDS-generated password excludes URL-hostile characters by
    // default, so it is safe to embed unescaped in the URL userinfo section.
    const databaseUrl = [
      'postgresql://',
      DB_USERNAME,
      ':',
      dbCredentialsSecret.secretValueFromJson('password').unsafeUnwrap(),
      '@',
      dbInstance.dbInstanceEndpointAddress,
      ':',
      dbInstance.dbInstanceEndpointPort,
      '/',
      DB_NAME,
      '?schema=public&connection_limit=5',
    ].join('');

    const databaseUrlSecret = new secretsmanager.Secret(
      this,
      'DatabaseUrlSecret',
      {
        secretName: 'k2b/database-url',
        description: 'Full Postgres connection string (DATABASE_URL)',
        secretStringValue: cdk.SecretValue.unsafePlainText(databaseUrl),
      },
    );

    // ---------------------------------------------------------------------
    // IAM roles for App Runner
    // ---------------------------------------------------------------------
    // Access role: assumed by App Runner's build service to pull the image
    // from ECR. `grantPull` covers ecr:GetAuthorizationToken + layer/image reads.
    const accessRole = new iam.Role(this, 'AppRunnerEcrAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      description: 'Lets App Runner pull the app image from ECR',
    });
    repo.grantPull(accessRole);

    // Instance role: assumed by the running task. Needs to read the two secrets
    // injected as runtime env (DATABASE_URL + AUTH_SECRET).
    const instanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      description: 'Runtime role for the App Runner service',
    });
    databaseUrlSecret.grantRead(instanceRole);
    authSecret.grantRead(instanceRole);

    // ---------------------------------------------------------------------
    // App Runner VPC connector + service
    // ---------------------------------------------------------------------
    const vpcConnector = new apprunner.CfnVpcConnector(this, 'VpcConnector', {
      vpcConnectorName: 'k2b-vpc-connector',
      subnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
      securityGroups: [appRunnerSg.securityGroupId],
    });

    const service = new apprunner.CfnService(this, 'Service', {
      serviceName: 'k2b-insurance',
      sourceConfiguration: {
        // Deploy by pushing a new image and starting a deployment manually
        // (StartDeployment / re-deploy), not on every ECR push.
        autoDeploymentsEnabled: false,
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageRepositoryType: 'ECR',
          imageIdentifier: `${repo.repositoryUri}:${imageTag}`,
          imageConfiguration: {
            port: '3000',
            runtimeEnvironmentVariables: [
              { name: 'NODE_ENV', value: 'production' },
              { name: 'PORT', value: '3000' },
            ],
            // Secret ARNs are resolved by App Runner at runtime using the
            // instance role's secretsmanager:GetSecretValue permission.
            runtimeEnvironmentSecrets: [
              { name: 'DATABASE_URL', value: databaseUrlSecret.secretArn },
              { name: 'AUTH_SECRET', value: authSecret.secretArn },
            ],
          },
        },
      },
      instanceConfiguration: {
        instanceRoleArn: instanceRole.roleArn,
        cpu: '1024', // 1 vCPU
        memory: '2048', // 2 GB
      },
      networkConfiguration: {
        // egressType VPC routes the service's outbound traffic through the
        // connector so it can reach the private RDS instance.
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
      },
      healthCheckConfiguration: {
        // HTTP health check against `/`. If the app later exposes a dedicated
        // liveness endpoint, switch `path` to `/api/health`.
        protocol: 'HTTP',
        path: '/',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    // Ensure the IAM grants and the secrets exist before the service tries to
    // reference them, and that the DB (source of the composed URL) is created.
    service.node.addDependency(instanceRole);
    service.node.addDependency(databaseUrlSecret);
    service.node.addDependency(authSecret);
    service.node.addDependency(dbInstance);

    // ---------------------------------------------------------------------
    // Outputs
    // ---------------------------------------------------------------------
    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repo.repositoryUri,
      description: 'ECR repository URI to build/tag/push the app image into',
    });
    new cdk.CfnOutput(this, 'AppRunnerServiceUrl', {
      value: `https://${service.attrServiceUrl}`,
      description: 'Public URL of the App Runner service',
    });
    new cdk.CfnOutput(this, 'AppRunnerServiceArn', {
      value: service.attrServiceArn,
      description: 'App Runner service ARN (use to start deployments)',
    });
    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: `${dbInstance.dbInstanceEndpointAddress}:${dbInstance.dbInstanceEndpointPort}`,
      description: 'RDS PostgreSQL endpoint (host:port)',
    });
    new cdk.CfnOutput(this, 'DbCredentialsSecretArn', {
      value: dbCredentialsSecret.secretArn,
      description: 'Secrets Manager ARN of the RDS-generated credentials',
    });
    new cdk.CfnOutput(this, 'DatabaseUrlSecretArn', {
      value: databaseUrlSecret.secretArn,
      description: 'Secrets Manager ARN of the composed DATABASE_URL',
    });
    new cdk.CfnOutput(this, 'AuthSecretArn', {
      value: authSecret.secretArn,
      description: 'Secrets Manager ARN of the AUTH_SECRET',
    });
  }
}
