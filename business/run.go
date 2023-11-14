package business

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/go-github/v56/github"
	"github.com/google/uuid"
	"io"
	"net/http"
	"time"
)

func RunWorkflow(ctx context.Context, conf Config) error {
	client := github.NewClient(nil).WithAuthToken(conf.GithubToken)

	workflowID, err := runWorkflow(ctx, runWorkflowInput{
		GithubOwner:      conf.Owner,
		GithubRepository: conf.RepositoryName,
		GithubToken:      conf.GithubToken,
		GithubClient:     client,
	})
	if err != nil {
		return fmt.Errorf("error running workflow: %w", err)
	}

	var status string
	var isFinished bool
	for {
		status, isFinished, err = workflowStatus(ctx, checkWorkflowStatusInput{
			GithubOwner:      conf.Owner,
			GithubRepository: conf.RepositoryName,
			GithubToken:      conf.GithubToken,
			Timeout:          5 * time.Minute,
			GithubClient:     client,
			WorkflowID:       workflowID,
		})
		if err != nil {
			return fmt.Errorf("error checking workflow status: %w", err)
		}

		fmt.Printf("%s status: %s\n", conf.RepositoryName, status)

		if isFinished {
			break
		}

		time.Sleep(5 * time.Second)
	}

	err = sendSlackNotification(ctx, sendSlackNotificationInput{
		SlackWebhookURL:  conf.SlackWebhookURL,
		GithubRepository: conf.RepositoryName,
		Status:           status,
		PorterService:    conf.PorterService,
		CommitSHA:        conf.PorterCommit,
	})
	if err != nil {
		return fmt.Errorf("error sending slack notification: %w", err)
	}

	return nil
}

func strPtr(s string) *string {
	return &s
}

type runWorkflowInput struct {
	GithubOwner      string
	GithubRepository string
	GithubToken      string
	GithubClient     *github.Client

	AppName string
}

func runWorkflow(ctx context.Context, inp runWorkflowInput) (int64, error) {
	var workflowID int64
	repo, _, err := inp.GithubClient.Repositories.Get(ctx, inp.GithubOwner, inp.GithubRepository)
	if err != nil {
		return workflowID, fmt.Errorf("error getting repo: %w", err)
	}

	defaultBranch := repo.DefaultBranch

	uniqueID := uuid.New().String()

	_, err = inp.GithubClient.Actions.CreateWorkflowDispatchEventByFileName(ctx, inp.GithubOwner, inp.GithubRepository, "app_integration_test.yml", github.CreateWorkflowDispatchEventRequest{
		Ref: *defaultBranch,
		Inputs: map[string]interface{}{
			"id": uniqueID,
		},
	})
	if err != nil {
		return workflowID, fmt.Errorf("error creating workflow dispatch: %w", err)
	}

	for {
		fmt.Printf("%s: Waiting for workflow to start...\n", inp.GithubRepository)
		if workflowID != 0 {
			break
		}

		runs, _, err := inp.GithubClient.Actions.ListWorkflowRunsByFileName(ctx, inp.GithubOwner, inp.GithubRepository, "app_integration_test.yml", &github.ListWorkflowRunsOptions{})
		if err != nil {
			return workflowID, fmt.Errorf("error getting workflow by filename: %w", err)
		}
		if runs == nil {
			return workflowID, fmt.Errorf("error getting workflow runs: %w", err)
		}

		for _, run := range runs.WorkflowRuns {
			jobs, _, err := inp.GithubClient.Actions.ListWorkflowJobs(ctx, inp.GithubOwner, inp.GithubRepository, run.GetID(), &github.ListWorkflowJobsOptions{})
			if err != nil {
				return workflowID, fmt.Errorf("error getting workflow jobs: %w", err)
			}
			if jobs == nil || len(jobs.Jobs) == 0 {
				continue
			}

			job := jobs.Jobs[0]
			if job == nil || job.Name == nil || *job.Name != "id" || job.Steps == nil || len(job.Steps) < 2 {
				continue
			}

			idStep := job.Steps[1]
			if idStep == nil || idStep.Name == nil || *idStep.Name != uniqueID {
				continue
			}

			workflowID = run.GetID()
		}
		time.Sleep(5 * time.Second)
	}

	return workflowID, nil
}

type checkWorkflowStatusInput struct {
	GithubOwner      string
	GithubRepository string
	GithubToken      string
	GithubClient     *github.Client
	Timeout          time.Duration

	WorkflowID int64
}

func workflowStatus(ctx context.Context, inp checkWorkflowStatusInput) (string, bool, error) {
	var status string
	var isFinished bool

	run, _, err := inp.GithubClient.Actions.GetWorkflowRunByID(ctx, inp.GithubOwner, inp.GithubRepository, inp.WorkflowID)
	if err != nil {
		return status, isFinished, fmt.Errorf("error getting workflow run by id: %w", err)
	}

	if run == nil || run.Status == nil {
		return status, isFinished, fmt.Errorf("error getting workflow run by id: %w", err)
	}

	status = *run.Status

	if time.Now().UTC().Sub(run.CreatedAt.UTC()) > inp.Timeout {
		status = "timed_out"
		isFinished = true
	}

	if *run.Status == "completed" {
		if run.Conclusion == nil {
			return status, isFinished, errors.New("run completed but conclusion is nil")
		}
		status = *run.Conclusion
		isFinished = true
	}

	return status, isFinished, nil
}

type sendSlackNotificationInput struct {
	SlackWebhookURL  string
	GithubRepository string
	Status           string
	PorterService    string
	CommitSHA        string
}

const slackTemplate = `
%s CLI run completed with status: *%s* %s

App: *%s*

Triggered by commit: github.com/porter-dev/%s/commit/%s
`

const supportHeroGroupID = "S05LXJ5DU9L"

type populateSlackMessageInput struct {
	Status           string
	GithubRepository string
	PorterService    string
	CommitSHA        string
}

func populateSlackMessage(inp populateSlackMessageInput) string {
	notifySupportHero := true

	var statusEmoji string
	switch inp.Status {
	case "success":
		statusEmoji = ":party_parrot:"
		notifySupportHero = false
	case "failure":
		statusEmoji = ":screaming_cat:"
	case "timed_out":
		statusEmoji = ":face_with_peeking_eye:"
	default:
		statusEmoji = ":thinking_face:"
	}

	message := fmt.Sprintf(
		slackTemplate,
		statusEmoji,
		inp.Status,
		statusEmoji,
		inp.GithubRepository,
		inp.PorterService,
		inp.PorterService,
		inp.CommitSHA,
	)

	if notifySupportHero {
		message = fmt.Sprintf("%s\n\n<!subteam^%s>", message, supportHeroGroupID)
	}

	return message
}

func sendSlackNotification(ctx context.Context, inp sendSlackNotificationInput) error {
	message := populateSlackMessage(populateSlackMessageInput{
		Status:           inp.Status,
		GithubRepository: inp.GithubRepository,
		PorterService:    inp.PorterService,
		CommitSHA:        inp.CommitSHA,
	})
	payload := map[string]string{
		"text": message,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", inp.SlackWebhookURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	by, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error reading response body: %w", err)
	}

	fmt.Println(string(by))

	return nil
}

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

	//// Read the file into a string.
	//content, err := os.ReadFile("/texts/workflow.txt")
	//if err != nil {
	//	return fmt.Errorf("error reading workflow: %w", err)
	//}

	blob, _, err := client.Git.CreateBlob(ctx, conf.Owner, conf.RepositoryName, &github.Blob{
		Content:  strPtr(""),
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

	//ref, _, err := client.Git.UpdateRef(ctx, conf.Owner, conf.RepositoryName, &github.Reference{
	//	Ref: strPtr(fmt.Sprintf("tags/%s", *tag.Tag)),
	//	Object: &github.GitObject{
	//		Type: strPtr("tag"),
	//		SHA:  tag.SHA,
	//	},
	//}, false)
	//if err != nil {
	//	if !strings.Contains(err.Error(), "Reference does not exist") {
	//		return fmt.Errorf("error updating ref: %w", err)
	//	}
	//
	//	ref, _, err = client.Git.CreateRef(ctx, conf.Owner, conf.RepositoryName, &github.Reference{
	//		Ref: strPtr(fmt.Sprintf("refs/tags/%s", *tag.Tag)),
	//		Object: &github.GitObject{
	//			Type: strPtr("tag"),
	//			SHA:  tag.SHA,
	//		},
	//	})
	//	if err != nil {
	//		return fmt.Errorf("error creating ref: %w", err)
	//	}
	//}
	//if ref == nil {
	//	return fmt.Errorf("ref is nil")
	//
	//}
	//
	//resp, err := client.Actions.CreateWorkflowDispatchEventByFileName(ctx, conf.Owner, conf.RepositoryName, "porter_stack_test.yml", github.CreateWorkflowDispatchEventRequest{
	//	Ref: *defaultBranch,
	//})
	//if err
	//
	//client.Actions.WorkflowRun

	return nil
}
