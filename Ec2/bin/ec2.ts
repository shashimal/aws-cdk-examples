#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Ec2Stack } from '../lib/ec2-stack';
const envAP  = { account: '00000000', region: 'ap-southeast-2' };
const app = new cdk.App();
new Ec2Stack(app, 'Ec2Stack', {env: envAP});
