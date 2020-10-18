package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/jackc/pgx/v4"
)

var (
	postgresSecretARN = os.Getenv("POSTGRES_SECRET_ARN")
	postgresEndpoint  = os.Getenv("POSTGRES_ENDPOINT")
)

func main() {
	fmt.Println("started")
	secret, err := retrievePostgresSecret()
	if err != nil {
		panic(err)
	}
	fmt.Printf("retrieved secret: %+v\n", secret)

	conf, _ := pgx.ParseConfig("")
	conf.Host = postgresEndpoint
	conf.User = secret.Username
	conf.Password = secret.Password
	fmt.Printf("configured config: %+v\n", conf)

	conn, err := pgx.ConnectConfig(context.Background(), conf)
	if err != nil {
		panic(err)
	}
	fmt.Printf("connected to database\n")
	defer conn.Close(context.Background())

	h := &handler{conn}

	lambda.Start(h.handle)
	fmt.Printf("started handler\n")
}

type handler struct {
	conn *pgx.Conn
}

func (h *handler) handle(ctx context.Context) (interface{}, error) {
	var version string

	err := h.conn.QueryRow(ctx, "SELECT version()").Scan(&version)
	if err != nil {
		return nil, err
	}

	return version, nil
}

type secret struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func retrievePostgresSecret() (*secret, error) {
	secret := &secret{}

	cfg, err := config.LoadDefaultConfig()
	if err != nil {
		return secret, err
	}

	sm := secretsmanager.NewFromConfig(cfg)

	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(postgresSecretARN),
	}
	output, err := sm.GetSecretValue(context.Background(), input)
	if err != nil {
		return secret, err
	}
	fmt.Printf("binary: %s\n", output.SecretBinary)
	fmt.Printf("string: %s\n", *output.SecretString)

	err = json.Unmarshal([]byte(*output.SecretString), secret)

	return secret, err
}
