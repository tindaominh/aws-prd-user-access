#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {AwsPRDUserAccessStack} from '../src/prd-user-access-stack';

const app = new cdk.App();
if (process.env.ROLE == 'production') {
  new AwsPRDUserAccessStack(app, 'AwsPRDUserAccessStack', {
    accessAccountId: '200129445516',
    terminationProtection: true,
  });
}
