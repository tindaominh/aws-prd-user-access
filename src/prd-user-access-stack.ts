import * as cdk from 'aws-cdk-lib';
import {StackProps} from 'aws-cdk-lib';
import {
  Effect,
  Group,
  Policy,
  PolicyStatement,
  User,
} from 'aws-cdk-lib/aws-iam';
import {Construct} from 'constructs';
import {
  createReadOnlyPolicy,
  createReadOnlyRole,
  createPowerUserRole,
  createAdminUserRole,
} from './utils/role';
import {roleName, users} from './users';

const readOnlyRoleName: roleName = 'read-only';
const powerUserRoleName: roleName = 'power-user';
const adminRoleName: roleName = 'admin';

interface AwsPRDUserAccessStackProps extends StackProps {
  accessAccountId: string; // AccountPrincipal account for accessing this
}

export class AwsPRDUserAccessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsPRDUserAccessStackProps) {
    super(scope, id, props);

    // required MFA on all actions
    const defaultUserPermission = new Policy(this, 'user-policy', {
      statements: [
        new PolicyStatement({
          sid: 'AllowListActions',
          effect: Effect.ALLOW,
          actions: ['iam:ListUsers', 'iam:ListVirtualMFADevices'],
          resources: ['*'],
        }),
        new PolicyStatement({
          sid: 'AllowGetPasswordPolicy',
          effect: Effect.ALLOW,
          actions: ['iam:GetAccountPasswordPolicy'],
          resources: ['*'],
        }),
        new PolicyStatement({
          sid: 'AllowChangePassword',
          effect: Effect.ALLOW,
          actions: [
            'iam:ChangePassword',
            'iam:GetLoginProfile',
            'iam:UpdateLoginProfile',
          ],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        }),
        new PolicyStatement({
          sid: 'AllowIndividualUserToManageTheirOwnMFA',
          effect: Effect.ALLOW,
          actions: [
            'iam:CreateVirtualMFADevice',
            'iam:DeleteVirtualMFADevice',
            'iam:ListMFADevices',
            'iam:EnableMFADevice',
            'iam:ResyncMFADevice',
          ],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        }),
        new PolicyStatement({
          sid: 'AllowIndividualUserToDeactivateOnlyTheirOwnMFAOnlyWhenUsingMFA',
          effect: Effect.ALLOW,
          actions: ['iam:DeactivateMFADevice'],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
          conditions: {
            Bool: {'aws:MultiFactorAuthPresent': true},
          },
        }),
        new PolicyStatement({
          sid: 'AllowToGenProgramingKey',
          effect: Effect.ALLOW,
          actions: [
            'iam:ListSSHPublicKeys',
            'iam:ListAccessKeys',
            'iam:CreateAccessKey',
            'iam:ChangePassword',
            'iam:DeleteAccessKey',
            'iam:DeleteSSHPublicKey',
          ],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
          conditions: {
            Bool: {'aws:MultiFactorAuthPresent': true},
          },
        }),
        new PolicyStatement({
          sid: 'BlockMostAccessUnlessSignedInWithMFA',
          effect: Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListUsers',
            'iam:ChangePassword',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {'aws:MultiFactorAuthPresent': false},
          },
        }),
      ],
    });

    // create roles
    const readOnlyAccountPolicy = createReadOnlyPolicy(this);
    createReadOnlyRole(
      this,
      `${this.stackName}-read-only`,
      readOnlyRoleName,
      props.accessAccountId,
      readOnlyAccountPolicy
    );
    createPowerUserRole(
      this,
      `${this.stackName}-power-user`,
      powerUserRoleName,
      props.accessAccountId
    );
    createAdminUserRole(
      this,
      `${this.stackName}-admin`,
      adminRoleName,
      props.accessAccountId
    );

    // default group (MFA policy for all users)
    const defaultGroup = new Group(this, `${this.stackName}-users`, {
      groupName: 'users',
    });
    defaultUserPermission.attachToGroup(defaultGroup);

    // role groups
    const readOnlyGroup = this.createGroup(
      `${this.stackName}-read-only-group`,
      'read-only-group',
      [`arn:aws:iam::${props.accessAccountId}:role/${readOnlyRoleName}`]
    );
    const powerUserGroup = this.createGroup(
      `${this.stackName}-power-user-group`,
      'power-user-group',
      [`arn:aws:iam::${props.accessAccountId}:role/${powerUserRoleName}`]
    );
    const adminGroup = this.createGroup(
      `${this.stackName}-admin-group`,
      'admin-group',
      [`arn:aws:iam::${props.accessAccountId}:role/${adminRoleName}`]
    );

    // create users
    users.forEach(userInfo => {
      const user = new User(this, `${this.stackName}-user-${userInfo.email}`, {
        userName: userInfo.email,
      });
      user.addToGroup(defaultGroup);

      userInfo.roles.production.forEach(role => {
        if (role === readOnlyRoleName) user.addToGroup(readOnlyGroup);
        if (role === powerUserRoleName) user.addToGroup(powerUserGroup);
        if (role === adminRoleName) user.addToGroup(adminGroup);
      });
    });
  }

  private createGroup(id: string, name: string, assumeRoles?: string[]) {
    const group = new Group(this, id, {groupName: name});
    if (assumeRoles != null) {
      group.addToPolicy(
        new PolicyStatement({
          actions: ['sts:AssumeRole'],
          effect: Effect.ALLOW,
          resources: assumeRoles,
          conditions: {BoolIfExists: {'aws:MultiFactorAuthPresent': true}},
        })
      );
    }
    return group;
  }
}
