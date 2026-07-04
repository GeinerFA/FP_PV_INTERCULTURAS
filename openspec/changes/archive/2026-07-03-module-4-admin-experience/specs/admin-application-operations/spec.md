# Delta for admin-application-operations

## MODIFIED Requirements

### Requirement: Return from any admin page to the public home page

The system MUST expose one shared admin workspace shell on every admin page. The shell MUST keep one top-left home control that uses a house icon and returns the user to the active locale public home page. The same shell MUST also present the shared admin navigation so application routes remain operational inside the refined workspace.

(Previously: The shared contract only required one top-left house-icon control that returned admin users to `/es`.)

#### Scenario: Navigate back to the public home page from an admin page
- GIVEN a user is on any admin page
- WHEN they activate the shared top-left house-icon home control
- THEN the system MUST navigate them to the active locale public home page

#### Scenario: Keep one consistent home control across admin routes
- GIVEN a user navigates between admin pages
- WHEN each page renders inside the shared admin shell
- THEN the system MUST show the same shared home control on every admin page

#### Scenario: Keep shared admin navigation around the applications flow
- GIVEN a user opens the applications list or an application detail route
- WHEN the shared admin shell renders
- THEN the system MUST show the same admin navigation model used by the dashboard and programs routes
- AND the application content MUST remain available inside that shared workspace
