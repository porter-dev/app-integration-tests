package business

import (
	"context"
	"errors"
	"fmt"
	"github.com/joho/godotenv"
	"github.com/sethvargo/go-envconfig"
	"os"
)

// Config wraps all environment configurations for using the CCP CLI
type Config struct {
	GithubToken    string `env:"GITHUB_TOKEN,required"`
	Owner          string `env:"OWNER,required""`
	RepositoryName string `env:"REPOSITORY_NAME,required"`
}

func LoadFromEnvAndCreateConfig(ctx context.Context) (Config, error) {
	var conf Config

	err := godotenv.Load()
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return conf, fmt.Errorf("")
		}
	}

	if err = envconfig.Process(ctx, &conf); err != nil {
		return conf, fmt.Errorf("error processing config: %w", err)
	}

	return conf, nil
}
