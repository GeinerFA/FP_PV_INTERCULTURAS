# Delta for admin-application-operations

## ADDED Requirements

### Requirement: Keep application admin flows behind the shared admin boundary

The system MUST keep application list, detail, curriculum download, and status-update flows available only inside the authenticated `/[locale]/admin` workspace.

#### Scenario: Reach applications after shared admin sign-in
- GIVEN an allowed authenticated admin session exists
- WHEN the admin opens an application route
- THEN the application workflow MUST remain available inside the shared admin shell

#### Scenario: Block anonymous application access
- GIVEN no authenticated admin session exists
- WHEN a user requests an application admin route
- THEN the system MUST redirect to the shared admin login flow
