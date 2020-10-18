import * as path from 'path'

import { Construct, Duration, Stack, StackProps } from '@aws-cdk/core'
import { Vpc, SecurityGroup, Port } from '@aws-cdk/aws-ec2'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda' 

export interface LambdaStackProps extends StackProps {
  vpc: Vpc
  postgresEndpoint: string
  postgresSecret: Secret
  postgresSecurityGroup: SecurityGroup
}

export class LambdaStack extends Stack {
  public lambda: Function
  public securityGroup: SecurityGroup

  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props)

    this.securityGroup = new SecurityGroup(this, 'LambdaPostgresProxy', {
      vpc: props.vpc,
    })
    props.postgresSecurityGroup.addIngressRule(this.securityGroup, Port.tcp(5432), 'Allow access from Lambda.', true)

    this.lambda = new Function(this, 'Lambda', {
      runtime: Runtime.GO_1_X,
      memorySize: 128,
      handler: 'main',
      code: Code.fromAsset(path.join(__dirname, '../lambda/build.zip')),
      environment: {
        POSTGRES_SECRET_ARN: props.postgresSecret.secretArn,
        POSTGRES_ENDPOINT: props.postgresEndpoint,
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetGroupName: 'Postgres',
      },
      timeout: Duration.seconds(4),
      securityGroups: [this.securityGroup],
    })
    props.postgresSecret.grantRead(this.lambda)
  }
}