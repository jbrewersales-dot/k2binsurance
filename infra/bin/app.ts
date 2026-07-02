#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { K2bStack } from '../lib/k2b-stack';

const app = new cdk.App();

// Account/region are resolved from the standard CDK env vars set by the AWS CLI
// credentials in use (CDK_DEFAULT_ACCOUNT / CDK_DEFAULT_REGION). Region defaults
// to us-east-1 if nothing is provided by the environment or -c region=... context.
const account =
  app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;
const region =
  app.node.tryGetContext('region') ||
  process.env.CDK_DEFAULT_REGION ||
  'us-east-1';

new K2bStack(app, 'K2bInsuranceStack', {
  env: { account, region },
  description:
    'K2B Insurance: containerized Next.js app on AWS App Runner backed by RDS Postgres',

  // Optional context overrides (pass via `-c key=value` on the CLI):
  //   -c existingEcrRepoName=my-repo   -> reuse an existing ECR repo instead of creating one
  //   -c imageTag=v1.2.3               -> App Runner image tag (default "latest")
  //   -c deletionProtection=true       -> turn on RDS deletion protection
  existingEcrRepoName: app.node.tryGetContext('existingEcrRepoName'),
  imageTag: app.node.tryGetContext('imageTag') || 'latest',
  dbDeletionProtection:
    app.node.tryGetContext('deletionProtection') === 'true',
});

app.synth();
