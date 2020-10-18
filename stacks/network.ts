import { Construct, Stack, StackProps } from '@aws-cdk/core'
import { Vpc, SubnetType } from '@aws-cdk/aws-ec2'

export class NetworkStack extends Stack {
  public vpc: Vpc

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    this.vpc = new Vpc(this, 'VPC', {
      //cidr: '10.0.60.0/16',
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          cidrMask: 24,
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: 'Postgres',
          cidrMask: 24,
          subnetType: SubnetType.ISOLATED,
        },
      ],
    })
  }
}