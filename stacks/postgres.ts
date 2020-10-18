import { App, Stack, StackProps, Duration } from '@aws-cdk/core'
import { Vpc, SecurityGroup, InstanceClass, InstanceType, InstanceSize, Port } from '@aws-cdk/aws-ec2'
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseProxy, PostgresEngineVersion } from '@aws-cdk/aws-rds'
import { Secret } from '@aws-cdk/aws-secretsmanager'

export interface PostgresStackProps extends StackProps {
  vpc: Vpc
}

export class PostgresStack extends Stack {
  public secret: Secret
  public proxy: DatabaseProxy
  public instance: DatabaseInstance
  public securityGroup: SecurityGroup

  constructor(scope: App, id: string, props?: PostgresStackProps) {
    super(scope, id, props)

    this.secret = new Secret(this, 'Secret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'master',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
      },
    })

    this.securityGroup = new SecurityGroup(this, 'PostgresSecurityGroup', {
      vpc: props.vpc,
    })
    this.securityGroup.addIngressRule(this.securityGroup, Port.tcp(5432))

    this.instance = new DatabaseInstance(this, 'PostgresInstance', {
      engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_11_5 }),
      credentials: Credentials.fromSecret(this.secret),
      vpc: props.vpc,
      vpcSubnets: {
        subnetGroupName: 'Postgres',
      },
      securityGroups: [this.securityGroup],
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      allowMajorVersionUpgrade: false,
    })
    //this.instance.connections.allowDefaultPortFromAnyIpv4()

    this.proxy = this.instance.addProxy('PostgresProxy-test', {
      secrets: [this.secret],
      vpc: props.vpc,
      debugLogging: true,
      borrowTimeout: Duration.seconds(30),
      securityGroups: [this.securityGroup],
    })
  }
}