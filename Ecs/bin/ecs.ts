#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcsStack } from '../lib/ecs-stack';

const envAP  = { account: '185971468285', region: 'ap-southeast-2' };

const app = new cdk.App();
new EcsStack(app, 'EcsStack',{env:envAP});
