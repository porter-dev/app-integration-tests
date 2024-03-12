# app-integration-tests

Permissions needed for Github API:

- Workflows (Read & Write)
- Contents (Read & Write)
- Actions (Read & Write)

# Tests Summary:

## Provisioning

Runs the following tests on internal-tools project, application (integration-test-provisioning), against project 468, in AWS account 081277119371. Uses the Porter CLI and CCP CLI to ensure that clusters can be created and deleted. Triggers in honeycomb should alert on all failures

- Create a cluster every morning
- Delete a cluster every night
- Every 2 hours, perform an instance type change
- Update permissions every hour
