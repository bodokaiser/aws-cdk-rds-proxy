import { LambdaStack } from './stacks/lambda';
import { ServerStack } from './stacks/server';
import { App } from '@aws-cdk/core'
import { NetworkStack } from './stacks/network'
import { PostgresStack } from './stacks/postgres'

const app = new App()

const networkStack = new NetworkStack(app, 'NetworkStack')

const postgresStack = new PostgresStack(app, 'PostgresStack', {
  vpc: networkStack.vpc,
})

new ServerStack(app, 'ServerStack', {
  vpc: networkStack.vpc,
  postgresEndpoint: postgresStack.proxy.endpoint,
  postgresSecurityGroup: postgresStack.securityGroup,
})

new LambdaStack(app, 'LambdaStack', {
  vpc: networkStack.vpc,
  postgresEndpoint: postgresStack.proxy.endpoint,
  postgresSecret: postgresStack.secret,
  postgresSecurityGroup: postgresStack.securityGroup,
})

app.synth()