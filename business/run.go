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

			for _, step := range job.Steps {
				if step != nil && step.Name != nil && *step.Name == uniqueID {
					workflowID = run.GetID()
				}
			}
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
		statusEmoji = ":party-parrot:"
		notifySupportHero = false
	case "failure":
		statusEmoji = ":scream_cat:"
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
