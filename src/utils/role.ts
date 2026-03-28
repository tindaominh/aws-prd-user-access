import {Duration} from 'aws-cdk-lib';
import {
  AccountPrincipal,
  ManagedPolicy,
  Policy,
  Role,
  PolicyStatement,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import {Construct} from 'constructs';

export function createReadOnlyPolicy(construct: Construct) {
  const readOnlyAccountPolicy = new Policy(
    construct,
    'read-only-account-role',
    {
      statements: [
        // allow to read on multiple resource
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'account:GetAlternateContact',
            'apigateway:GET',
            'application-autoscaling:Describe*',
            'applicationinsights:Describe*',
            'applicationinsights:List*',
            'appmesh:Describe*',
            'appmesh:List*',
            'appstream:Describe*',
            'appstream:List*',
            'cloudwatch:Describe*',
            'cloudwatch:Get*',
            'cloudwatch:List*',
            'ecr-public:BatchCheckLayerAvailability',
            'ecr-public:Describe*',
            'ecr-public:Get*',
            'ecr-public:ListTagsForResource',
            'ecr:BatchCheck*',
            'ecr:BatchGet*',
            'ecr:Describe*',
            'ecr:Get*',
            'ecr:List*',
            'ecs:Describe*',
            'ecs:List*',
            'eks:Describe*',
            'eks:List*',
            'elasticache:Describe*',
            'elasticache:List*',
            'es:Describe*',
            'es:ESHttpGet',
            'es:ESHttpHead',
            'es:Get*',
            'es:List*',
            'events:Describe*',
            'events:List*',
            'events:Test*',
            'health:Describe*',
            'iam:Generate*',
            'iam:Get*',
            'iam:List*',
            'iam:Simulate*',
            'kms:Describe*',
            'kms:Get*',
            'kms:List*',
            'lambda:Get*',
            'lambda:List*',
            'logs:Describe*',
            'logs:FilterLogEvents',
            'logs:Get*',
            'logs:ListTagsLogGroup',
            'logs:StartQuery',
            'logs:StopQuery',
            'networkmanager:ListTagsForResource',
            'ram:Get*',
            'ram:List*',
            'rds:Describe*',
            'rds:Download*',
            'rds:List*',
            'secretsmanager:Describe*',
            'secretsmanager:GetResourcePolicy',
            'secretsmanager:List*',
            'securityhub:BatchGetStandardsControlAssociations',
            'securityhub:Describe*',
            'securityhub:Get*',
            'securityhub:List*',
            'serverlessrepo:Get*',
            'serverlessrepo:List*',
            'serverlessrepo:SearchApplications',
            'servicequotas:Get*',
            'servicequotas:List*',
            'ses:BatchGetMetricData',
            'ses:Describe*',
            'ses:Get*',
            'ses:List*',
            'sns:Check*',
            'sns:Get*',
            'sns:List*',
            'sqs:Get*',
            'sqs:List*',
            'sqs:Receive*',
            'ssm:Describe*',
            'ssm:Get*',
            'ssm:List*',
            'sts:GetAccessKeyInfo',
            'sts:GetCallerIdentity',
            'sts:GetSessionToken',
          ],
          resources: ['*'],
        }),
      ],
    }
  );
  return readOnlyAccountPolicy;
}

export function createReadOnlyRole(
  construct: Construct,
  id: string,
  roleName: string,
  account: string,
  readOnlyPolicy: Policy
) {
  const readOnlyRole = new Role(construct, id, {
    roleName: roleName,
    description: 'readonly user with all readonly access',
    assumedBy: new AccountPrincipal(account), // only allow assume from the account
    maxSessionDuration: Duration.hours(2),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonEc2ReadOnlyAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSReadOnlyAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBReadOnlyAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('CloudFrontReadOnlyAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationReadOnlyAccess'),
      ManagedPolicy.fromAwsManagedPolicyName(
        'CloudWatchApplicationInsightsReadOnlyAccess'
      ),
      ManagedPolicy.fromAwsManagedPolicyName('AWSBillingReadOnlyAccess'),
    ],
    //  permissionsBoundary
  });

  readOnlyPolicy.attachToRole(readOnlyRole);

  return readOnlyRole;
}

export function createPowerUserRole(
  construct: Construct,
  id: string,
  roleName: string,
  account: string
) {
  const role = new Role(construct, id, {
    roleName: roleName,
    assumedBy: new AccountPrincipal(account), // only allow assume from the account
    maxSessionDuration: Duration.hours(2),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'),
    ],
  });
  role.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: [
        'iam:Get*',
        'iam:List*',
        'iam:PassRole',
        'iam:CreateRole',
        'iam:CreatePolicy',
        'iam:AttachRolePolicy',
        'iam:PutRolePolicy',
        'iam:DetachRolePolicy',
        'iam:DeleteRolePolicy',
        'iam:DeleteRole',
      ],
    })
  );
  return role;
}

export function createAdminUserRole(
  construct: Construct,
  id: string,
  roleName: string,
  account: string
) {
  return new Role(construct, id, {
    roleName: roleName,
    assumedBy: new AccountPrincipal(account), // only allow assume from the account
    maxSessionDuration: Duration.hours(2),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
    ],
  });
}
