import { App } from '@aws-cdk/core'
import { NetworkStack } from './stacks/network'
import { PostgresStack } from './stacks/postgres'

const app = new App()

const networkStack = new NetworkStack(app, 'NetworkStack')

new PostgresStack(app, 'PostgresStack', {
  vpc: networkStack.vpc,
})

app.synth()