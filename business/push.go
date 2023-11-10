package business

import (
	"context"
	"errors"
	"fmt"
	"github.com/google/go-github/v56/github"
	"os"
	"strings"
)

func Push(ctx context.Context, conf Config) error {
	client := github.NewClient(nil).WithAuthToken(conf.GithubToken)

	repo, _, err := client.Repositories.Get(ctx, conf.Owner, conf.RepositoryName)
	if err != nil {
		return fmt.Errorf("error getting repo: %w", err)
	}

	defaultBranch := repo.DefaultBranch

	branch, _, err := client.Repositories.GetBranch(ctx, conf.Owner, conf.RepositoryName, *defaultBranch, 0)
	if err != nil {
		return fmt.Errorf("error getting latest commit sha: %w", err)

	}
	if branch == nil {
		return fmt.Errorf("branch is nil")

	}
	if branch.Commit == nil {
		return fmt.Errorf("branch commit is nil")
	}

	latestCommit := branch.Commit.Commit
	latestCommit.SHA = branch.Commit.SHA

	// Read the file into a string.
	content, err := os.ReadFile("texts/workflow.txt")
	if err != nil {
		return fmt.Errorf("error reading workflow: %w", err)
	}

	blob, _, err := client.Git.CreateBlob(ctx, conf.Owner, conf.RepositoryName, &github.Blob{
		Content:  strPtr(string(content)),
		Encoding: strPtr("utf-8"),
	})
	if err != nil {
		return fmt.Errorf("error creating blob: %w", err)

	}
	if blob == nil {
		return fmt.Errorf("blob is nil")

	}
	if blob.SHA == nil {
		return fmt.Errorf("blob sha is nil")

	}

	tree, _, err := client.Git.GetTree(ctx, conf.Owner, conf.RepositoryName, *defaultBranch, false)
	if err != nil {
		return fmt.Errorf("error getting tree: %w", err)

	}
	if tree == nil {
		return fmt.Errorf("tree is nil")

	}

	tree, _, err = client.Git.CreateTree(ctx, conf.Owner, conf.RepositoryName, *tree.SHA, []*github.TreeEntry{
		{
			SHA:  blob.SHA,
			Path: strPtr(".integration_test"),
			Mode: strPtr("100644"),
			Type: strPtr("blob"),
		},
	})
	if err != nil {
		return fmt.Errorf("error getting tree: %w", err)

	}
	if tree == nil {
		return fmt.Errorf("tree is nil")

	}

	commit, _, err := client.Git.CreateCommit(ctx, conf.Owner, conf.RepositoryName, &github.Commit{
		Message: strPtr("test"),
		Tree:    tree,
		Parents: []*github.Commit{latestCommit},
	}, &github.CreateCommitOptions{})
	if err != nil {
		return fmt.Errorf("error creating commit: %w", err)

	}
	if commit == nil {
		return fmt.Errorf("commit is nil")

	}

	tag, _, err := client.Git.CreateTag(ctx, conf.Owner, conf.RepositoryName, &github.Tag{
		Tag: strPtr("app-integration-tests"),
		Object: &github.GitObject{
			Type: strPtr("commit"),
			SHA:  commit.SHA,
		},
		Message: strPtr("tag used to trigger an app integration test"),
	})
	if err != nil {
		return fmt.Errorf("error creating tag: %w", err)
	}
	if tag == nil {
		return errors.New("tag is nil")
	}

	ref, _, err := client.Git.UpdateRef(ctx, conf.Owner, conf.RepositoryName, &github.Reference{
		Ref: strPtr(fmt.Sprintf("tags/%s", *tag.Tag)),
		Object: &github.GitObject{
			Type: strPtr("tag"),
			SHA:  tag.SHA,
		},
	}, false)
	if err != nil {
		if !strings.Contains(err.Error(), "Reference does not exist") {
			return fmt.Errorf("error updating ref: %w", err)
		}

		ref, _, err = client.Git.CreateRef(ctx, conf.Owner, conf.RepositoryName, &github.Reference{
			Ref: strPtr(fmt.Sprintf("refs/tags/%s", *tag.Tag)),
			Object: &github.GitObject{
				Type: strPtr("tag"),
				SHA:  tag.SHA,
			},
		})
		if err != nil {
			return fmt.Errorf("error creating ref: %w", err)
		}
	}
	if ref == nil {
		return fmt.Errorf("ref is nil")

	}

	return nil
}

func strPtr(s string) *string {
	return &s
}
