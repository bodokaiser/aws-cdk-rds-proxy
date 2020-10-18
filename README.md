# aws-cdk RDS Proxy

The present repository shows how to configure a (postgres) AWS RDS Proxy for AWS Lambda using aws-cdk.

## Usage

Install the dependencies with `yarn install`, then deploy the stacks:

```shell
npx cdk deploy NetworkStack PostgresStack ServerStack
```

Deployment of the `ServerStack` launches an AWS EC2 instance from which we want to connect to the RDS Proxy.
Using an EC2 instance makes it easier to debug connection problems.

Connect to the EC2 instance via ssh and install postgres:

```shell
sudo amazon-linux-extras install postgresql11
```

Now connect to the database proxy:

```shell
export PGPASSWORD=<password from secret manager>

psql -U master -h <proxy endpoint>
```

If you find yourself in the postgres shell, everything has worked out.