package main

import (
	"context"
	"fmt"
	"github.com/porter-dev/app-integration-tests/business"
)

func main() {
	ctx := context.Background()

	conf, err := business.LoadFromEnvAndCreateConfig(ctx)

	err = business.RunWorkflow(ctx, conf)
	if err != nil {
		fmt.Println("error pushing: %w", err)
		return
	}
}
