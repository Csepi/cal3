# PrimeCalendar Documentation Audit Report

Generated: 2026-03-10

## Executive Summary

- Markdown files audited under `docs/`: **143**
- Files in active numbered structure (`01-` to `10-`): **77**
- Files in specialist/scattered folders (excluding archives): **44**
- Files already under archive: **22**
- Exact duplicate groups: **7**
- Near-duplicate groups: **7**

## Duplicate Analysis

### Exact Duplicates

1. `01-GETTING-STARTED/README.md` | `02-ARCHITECTURE/README.md` | `03-FEATURES/README.md` | `04-API-REFERENCE/README.md` | `05-USER-GUIDES/README.md` | `06-DEVELOPER-GUIDES/README.md` | `08-MIGRATION/README.md` | `09-TROUBLESHOOTING/README.md`
2. `03-FEATURES/agents.md` | `04-API-REFERENCE/agents.md`
3. `03-FEATURES/automation.md` | `04-API-REFERENCE/automation.md`
4. `03-FEATURES/public-booking.md` | `04-API-REFERENCE/public-booking.md`
5. `03-FEATURES/reservations.md` | `04-API-REFERENCE/reservations.md`
6. `03-FEATURES/resources.md` | `04-API-REFERENCE/resources.md`
7. `06-DEVELOPER-GUIDES/deployment.md` | `10-FAQ/deployment.md`

### Near Duplicates (normalized content)

1. `01-GETTING-STARTED/README.md` | `02-ARCHITECTURE/README.md` | `03-FEATURES/README.md` | `04-API-REFERENCE/README.md` | `05-USER-GUIDES/README.md` | `06-DEVELOPER-GUIDES/README.md` | `07-DEPLOYMENT/README.md` | `08-MIGRATION/README.md` | `09-TROUBLESHOOTING/README.md`
2. `03-FEATURES/agents.md` | `04-API-REFERENCE/agents.md`
3. `03-FEATURES/automation.md` | `04-API-REFERENCE/automation.md`
4. `03-FEATURES/public-booking.md` | `04-API-REFERENCE/public-booking.md`
5. `03-FEATURES/reservations.md` | `04-API-REFERENCE/reservations.md`
6. `03-FEATURES/resources.md` | `04-API-REFERENCE/resources.md`
7. `06-DEVELOPER-GUIDES/deployment.md` | `10-FAQ/deployment.md`

## Outdated / Stale Content Signals

- `archives/legacy/API_DOCUMENTATION_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/API_SPEC_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/ARCHITECTURE_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/ARCHITECTURE_root_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/BACKEND_GUIDE_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/COMPONENT_LIBRARY_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/CONTEXT_GUIDE_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/DATABASE_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/DATABASE_SCHEMA_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/DEPLOYMENT_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/FRONTEND_GUIDE_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/GETTING_STARTED_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/RESPONSE_SPEC_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/SERVICES_GUIDE_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/setup-guide_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/legacy/TYPES_DOCUMENTATION_legacy.md`: explicit-legacy/deprecated marker; already archived content
- `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md`: already archived content
- `archives/reports/DEAD_CODE_ANALYSIS.md`: already archived content
- `archives/reports/MOBILE_BUILD_SCRIPTS.md`: already archived content
- `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md`: already archived content
- `archives/reports/SCHEMA_VERIFICATION_REPORT.md`: already archived content
- `docker/PORTAINER_DEBUG.md`: tool-specific legacy workflow may not be primary path
- `DOCUMENTATION_CHECKLIST.md`: explicit-legacy/deprecated marker

## Audience Distribution

- Mixed: 70
- Developer: 25
- DevOps: 19
- Administrator: 16
- End User: 13

## Category Distribution

- Deployment Guide: 22
- Archive: 22
- Developer Guide: 21
- User Guide: 19
- Uncategorized: 17
- Reference: 12
- Admin Guide: 12
- Getting Started: 8
- Troubleshooting: 6
- FAQ: 4

## Gap Analysis (Current Docs vs Product Surface)

- No controller-topic gaps detected by heuristic threshold.

### Strategic Gaps To Fill In New Structure

- User Guide: time-zone-handling, working-hours-configuration, availability-checker
- User Guide: recurring-events and attendee-status workflows
- Admin Guide: billing/subscriptions and usage tracking
- Developer Guide: mobile architecture and native plugin lifecycle
- Reference: webhook payload schemas and rate limits central page
- Best Practices: security, performance, and accessibility playbooks

## Full Inventory

| Path | Title | Words | Current Category | Audience | Topics | Proposed Target | Notes |
|---|---|---:|---|---|---|---|---|
| `01-GETTING-STARTED/database-setup.md` | Database Setup: Get Fast Daily Wins Without Guesswork | 169 | Getting Started | Mixed | general | `GETTING-STARTED/installation/local-development.md` |  |
| `01-GETTING-STARTED/docker-setup.md` | Docker Setup: Get Fast Daily Wins Without Guesswork | 169 | Getting Started | Mixed | deployment | `GETTING-STARTED/installation/self-hosted-docker.md` |  |
| `01-GETTING-STARTED/environment-variables.md` | Environment Variables: Get Fast Daily Wins Without Guesswork | 169 | Getting Started | Mixed | general | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` |  |
| `01-GETTING-STARTED/first-run.md` | First Run: Get Fast Daily Wins Without Guesswork | 169 | Getting Started | Mixed | general | `GETTING-STARTED/first-steps/initial-setup.md` |  |
| `01-GETTING-STARTED/installation.md` | Installation: Get Fast Daily Wins Without Guesswork | 168 | Getting Started | Mixed | general | `GETTING-STARTED/installation/local-development.md` |  |
| `01-GETTING-STARTED/prerequisites.md` | Prerequisites: Get Fast Daily Wins Without Guesswork | 168 | Getting Started | Mixed | general | `GETTING-STARTED/system-requirements.md` |  |
| `01-GETTING-STARTED/README.md` | README: Get Fast Daily Wins Without Guesswork | 168 | Getting Started | Mixed | general | `index.md` |  |
| `02-ARCHITECTURE/api-architecture.md` | Api Architecture: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Mixed | general | `DEVELOPER-GUIDE/api-reference/api-overview.md` |  |
| `02-ARCHITECTURE/backend-structure.md` | Backend Structure: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Mixed | general | `DEVELOPER-GUIDE/architecture/backend-architecture.md` |  |
| `02-ARCHITECTURE/database-schema.md` | Database Schema: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Mixed | general | `DEVELOPER-GUIDE/architecture/database-schema.md` |  |
| `02-ARCHITECTURE/frontend-structure.md` | Frontend Structure: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Mixed | general | `DEVELOPER-GUIDE/architecture/frontend-architecture.md` |  |
| `02-ARCHITECTURE/integrations.md` | Integrations: Get Fast Daily Wins Without Guesswork | 168 | Developer Guide | Mixed | general | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` |  |
| `02-ARCHITECTURE/README.md` | README: Get Fast Daily Wins Without Guesswork | 168 | Developer Guide | Mixed | general | `index.md` |  |
| `02-ARCHITECTURE/system-overview.md` | System Overview: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Mixed | general | `DEVELOPER-GUIDE/architecture/system-overview.md` |  |
| `03-FEATURES/agents.md` | Agents: Get Fast Daily Wins Without Guesswork | 168 | User Guide | Mixed | agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `03-FEATURES/automation.md` | Automation: Get Fast Daily Wins Without Guesswork | 168 | User Guide | Mixed | automation | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `03-FEATURES/calendar-management.md` | Calendar Management: Get Fast Daily Wins Without Guesswork | 169 | User Guide | Mixed | calendar | `USER-GUIDE/calendars/managing-multiple-calendars.md` |  |
| `03-FEATURES/multi-tenancy.md` | Multi Tenancy: Get Fast Daily Wins Without Guesswork | 169 | User Guide | Mixed | organization | `ADMIN-GUIDE/organization-management/multi-organization-management.md` |  |
| `03-FEATURES/notifications.md` | Notifications: Get Fast Daily Wins Without Guesswork | 168 | User Guide | Mixed | notification | `USER-GUIDE/notifications/notification-settings.md` |  |
| `03-FEATURES/public-booking.md` | Public Booking: Get Fast Daily Wins Without Guesswork | 169 | User Guide | Mixed | booking | `USER-GUIDE/public-booking/managing-bookings.md` |  |
| `03-FEATURES/README.md` | README: Get Fast Daily Wins Without Guesswork | 168 | User Guide | Mixed | general | `index.md` |  |
| `03-FEATURES/reservations.md` | Reservations: Get Fast Daily Wins Without Guesswork | 168 | User Guide | Mixed | reservation | `USER-GUIDE/resources/booking-resources.md` |  |
| `03-FEATURES/resources.md` | Resources: Get Fast Daily Wins Without Guesswork | 168 | User Guide | Mixed | resource | `USER-GUIDE/resources/resource-management.md` |  |
| `03-FEATURES/smart-home.md` | Smart Home: Get Fast Daily Wins Without Guesswork | 169 | User Guide | Mixed | general | `USER-GUIDE/advanced-features/delegation-and-proxies.md` |  |
| `03-FEATURES/sync-integrations.md` | Sync Integrations: Get Fast Daily Wins Without Guesswork | 169 | User Guide | Mixed | general | `USER-GUIDE/integrations/custom-integrations.md` |  |
| `04-API-REFERENCE/agents.md` | Agents: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | agent | `DEVELOPER-GUIDE/api-reference/webhook-api.md` |  |
| `04-API-REFERENCE/authentication.md` | Authentication: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | general | `DEVELOPER-GUIDE/api-reference/authentication-api.md` |  |
| `04-API-REFERENCE/automation.md` | Automation: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | automation | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `04-API-REFERENCE/calendars.md` | Calendars: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | calendar | `DEVELOPER-GUIDE/api-reference/calendar-api.md` |  |
| `04-API-REFERENCE/error-codes.md` | Error Codes: Get Fast Daily Wins Without Guesswork | 169 | Reference | Developer | general | `REFERENCE/api/rest-api-reference.md` |  |
| `04-API-REFERENCE/events.md` | Events: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | event | `DEVELOPER-GUIDE/api-reference/event-api.md` |  |
| `04-API-REFERENCE/organizations.md` | Organizations: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | organization | `DEVELOPER-GUIDE/api-reference/organization-api.md` |  |
| `04-API-REFERENCE/public-booking.md` | Public Booking: Get Fast Daily Wins Without Guesswork | 169 | Reference | Developer | booking | `DEVELOPER-GUIDE/api-reference/booking-api.md` |  |
| `04-API-REFERENCE/README.md` | README: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | general | `index.md` |  |
| `04-API-REFERENCE/reservations.md` | Reservations: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | reservation | `DEVELOPER-GUIDE/api-reference/booking-api.md` |  |
| `04-API-REFERENCE/resources.md` | Resources: Get Fast Daily Wins Without Guesswork | 168 | Reference | Developer | resource | `DEVELOPER-GUIDE/api-reference/resource-api.md` |  |
| `05-USER-GUIDES/automation-guide.md` | Automation Guide: Get Fast Daily Wins Without Guesswork | 169 | User Guide | End User | automation | `USER-GUIDE/automation/creating-automation-rules.md` |  |
| `05-USER-GUIDES/basic-usage.md` | Basic Usage: Get Fast Daily Wins Without Guesswork | 169 | User Guide | End User | general | `USER-GUIDE/basics/navigating-the-calendar.md` |  |
| `05-USER-GUIDES/public-booking-guide.md` | Public Booking Guide: Get Fast Daily Wins Without Guesswork | 170 | User Guide | End User | booking | `USER-GUIDE/public-booking/setting-up-booking-links.md` |  |
| `05-USER-GUIDES/README.md` | README: Get Fast Daily Wins Without Guesswork | 168 | User Guide | End User | general | `index.md` |  |
| `05-USER-GUIDES/reservations-guide.md` | Reservations Guide: Get Fast Daily Wins Without Guesswork | 169 | User Guide | End User | reservation | `USER-GUIDE/resources/booking-resources.md` |  |
| `05-USER-GUIDES/sharing-permissions.md` | Sharing Permissions: Get Fast Daily Wins Without Guesswork | 169 | User Guide | End User | general | `USER-GUIDE/sharing-and-collaboration/permission-levels.md` |  |
| `05-USER-GUIDES/smart-home-guide.md` | Smart Home Guide: Get Fast Daily Wins Without Guesswork | 170 | User Guide | End User | general | `USER-GUIDE/advanced-features/delegation-and-proxies.md` |  |
| `05-USER-GUIDES/troubleshooting.md` | Troubleshooting: Get Fast Daily Wins Without Guesswork | 168 | User Guide | End User | general | `TROUBLESHOOTING/index.md` |  |
| `06-DEVELOPER-GUIDES/adding-endpoints.md` | Adding Endpoints: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Developer | general | `DEVELOPER-GUIDE/backend-development/nestjs-modules.md` |  |
| `06-DEVELOPER-GUIDES/code-organization.md` | Code Organization: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Developer | organization | `DEVELOPER-GUIDE/getting-started/project-structure.md` |  |
| `06-DEVELOPER-GUIDES/database-migrations.md` | Database Migrations: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Developer | general | `DEVELOPER-GUIDE/database/migrations.md` |  |
| `06-DEVELOPER-GUIDES/debugging.md` | Debugging: Get Fast Daily Wins Without Guesswork | 168 | Developer Guide | Developer | general | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` |  |
| `06-DEVELOPER-GUIDES/deployment.md` | Deployment: Get Fast Daily Wins Without Guesswork | 168 | Developer Guide | Developer | deployment | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `06-DEVELOPER-GUIDES/local-setup.md` | Local Setup: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Developer | general | `DEVELOPER-GUIDE/getting-started/development-environment-setup.md` |  |
| `06-DEVELOPER-GUIDES/mcp-development.md` | Mcp Development: Get Fast Daily Wins Without Guesswork | 169 | Developer Guide | Developer | agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `06-DEVELOPER-GUIDES/README.md` | README: Get Fast Daily Wins Without Guesswork | 168 | Developer Guide | Developer | general | `index.md` |  |
| `06-DEVELOPER-GUIDES/testing.md` | Testing: Get Fast Daily Wins Without Guesswork | 168 | Developer Guide | Developer | general | `DEVELOPER-GUIDE/testing/testing-strategy.md` |  |
| `07-DEPLOYMENT/azure-swa-containerapps.md` | Azure Deployment: SWA Frontend + Container Apps Backend | 422 | Deployment Guide | DevOps | deployment, resource, security | `DEPLOYMENT-GUIDE/deployment-options/cloud-hosting.md` |  |
| `07-DEPLOYMENT/database-backup.md` | Database Backup: Get Fast Daily Wins Without Guesswork | 169 | Deployment Guide | DevOps | deployment | `DEPLOYMENT-GUIDE/database-management/backup-and-restore.md` |  |
| `07-DEPLOYMENT/docker-compose.md` | Docker Compose: Get Fast Daily Wins Without Guesswork | 169 | Deployment Guide | DevOps | deployment | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` |  |
| `07-DEPLOYMENT/environment-config.md` | Environment Config: Get Fast Daily Wins Without Guesswork | 169 | Deployment Guide | DevOps | deployment | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` |  |
| `07-DEPLOYMENT/git-push-auto-upgrade.md` | Git Push Auto-Upgrade (Frontend + Backend) | 391 | Deployment Guide | DevOps | deployment, resource | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `07-DEPLOYMENT/kubernetes.md` | Kubernetes: Get Fast Daily Wins Without Guesswork | 168 | Deployment Guide | DevOps | deployment | `DEPLOYMENT-GUIDE/kubernetes/kubernetes-manifests.md` |  |
| `07-DEPLOYMENT/monitoring.md` | Monitoring: Get Fast Daily Wins Without Guesswork | 168 | Deployment Guide | DevOps | deployment | `DEPLOYMENT-GUIDE/monitoring-and-logging/application-monitoring.md` |  |
| `07-DEPLOYMENT/production-setup.md` | Production Setup: Get Fast Daily Wins Without Guesswork | 169 | Deployment Guide | DevOps | deployment | `DEPLOYMENT-GUIDE/deployment-options/self-hosted-overview.md` |  |
| `07-DEPLOYMENT/README.md` | README: Get Fast Daily Wins Without Guesswork | 177 | Deployment Guide | DevOps | deployment | `index.md` |  |
| `07-DEPLOYMENT/scaling.md` | Scaling: Get Fast Daily Wins Without Guesswork | 168 | Deployment Guide | DevOps | deployment | `DEPLOYMENT-GUIDE/kubernetes/scaling-strategies.md` |  |
| `07-DEPLOYMENT/security.md` | Security: Get Fast Daily Wins Without Guesswork | 168 | Deployment Guide | DevOps | deployment, security | `DEPLOYMENT-GUIDE/security/security-hardening.md` |  |
| `08-MIGRATION/data-import.md` | Data Import: Get Fast Daily Wins Without Guesswork | 169 | Deployment Guide | Mixed | general | `USER-GUIDE/advanced-features/icalendar-export-import.md` |  |
| `08-MIGRATION/from-datacenter.md` | From Datacenter: Get Fast Daily Wins Without Guesswork | 169 | Deployment Guide | Mixed | general | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `08-MIGRATION/README.md` | README: Get Fast Daily Wins Without Guesswork | 168 | Deployment Guide | Mixed | general | `index.md` |  |
| `09-TROUBLESHOOTING/api-issues.md` | Api Issues: Get Fast Daily Wins Without Guesswork | 169 | Troubleshooting | Mixed | general | `TROUBLESHOOTING/error-messages/network-errors.md` |  |
| `09-TROUBLESHOOTING/database-issues.md` | Database Issues: Get Fast Daily Wins Without Guesswork | 169 | Troubleshooting | Mixed | general | `TROUBLESHOOTING/error-messages/database-errors.md` |  |
| `09-TROUBLESHOOTING/logs-debugging.md` | Logs Debugging: Get Fast Daily Wins Without Guesswork | 169 | Troubleshooting | Mixed | general | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` |  |
| `09-TROUBLESHOOTING/performance-issues.md` | Performance Issues: Get Fast Daily Wins Without Guesswork | 169 | Troubleshooting | Mixed | general | `TROUBLESHOOTING/common-issues/performance-issues.md` |  |
| `09-TROUBLESHOOTING/README.md` | README: Get Fast Daily Wins Without Guesswork | 168 | Troubleshooting | Mixed | general | `index.md` |  |
| `09-TROUBLESHOOTING/smart-home-issues.md` | Smart Home Issues: Get Fast Daily Wins Without Guesswork | 170 | Troubleshooting | Mixed | general | `TROUBLESHOOTING/common-issues/mobile-app-issues.md` |  |
| `10-FAQ/deployment.md` | Deployment: Get Fast Daily Wins Without Guesswork | 168 | FAQ | End User | deployment | `FAQ/technical-faq.md` |  |
| `10-FAQ/general.md` | General: Get Fast Daily Wins Without Guesswork | 168 | FAQ | End User | general | `FAQ/general-faq.md` |  |
| `10-FAQ/README.md` | 10 - FAQ: Fast Answers for Real Work | 73 | FAQ | End User | deployment | `index.md` |  |
| `10-FAQ/technical.md` | Technical: Get Fast Daily Wins Without Guesswork | 168 | FAQ | End User | general | `FAQ/technical-faq.md` |  |
| `agents/setup.md` | MCP Agent Integration – Setup Guide | 195 | Developer Guide | Mixed | agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `agents/usage.md` | MCP Agent Integration – Usage Guide | 628 | Developer Guide | Mixed | agent, automation, calendar, event, resource | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `architecture/agent-integration-plan.md` | MCP Agent Integration – Architecture Plan | 992 | Developer Guide | Mixed | agent, automation, calendar, event, mobile, notification, reservation, resource, security | `DEVELOPER-GUIDE/architecture/system-overview.md` |  |
| `archives/legacy/API_DOCUMENTATION_legacy.md` | Cal3 Calendar Application - API Documentation | 6439 | Archive | Administrator | automation, booking, calendar, deployment, event, notification, organization, reservation, resource | `archives/api_documentation_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/API_SPEC_legacy.md` | API Spec | 152 | Archive | Mixed | calendar, event, reservation, resource | `archives/api_spec_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/ARCHITECTURE_legacy.md` | Architecture Overview | 174 | Archive | Mixed | booking, calendar, event, resource | `archives/architecture_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/ARCHITECTURE_root_legacy.md` | Architecture | 207 | Archive | Mixed | automation, calendar, event, notification, reservation, resource | `archives/architecture_root_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/BACKEND_GUIDE_legacy.md` | Backend Guide | 107 | Archive | Mixed | automation, calendar, event, notification, reservation, resource | `archives/backend_guide_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/COMPONENT_LIBRARY_legacy.md` | Component Library | 82 | Archive | Mixed | general | `archives/component_library_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/CONTEXT_GUIDE_legacy.md` | Context Guide | 112 | Archive | Mixed | notification, reservation, resource | `archives/context_guide_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/DATABASE_legacy.md` | Database | 126 | Archive | Mixed | automation, calendar, event, notification, reservation, resource | `archives/database_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/DATABASE_SCHEMA_legacy.md` | Cal3 Calendar Application - Complete Database Schema Documentation | 9323 | Archive | End User | automation, booking, calendar, deployment, event, notification, organization, reservation, resource, security | `archives/database_schema_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/DEPLOYMENT_legacy.md` | Deployment | 123 | Archive | Mixed | deployment | `archives/deployment_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/FRONTEND_GUIDE_legacy.md` | Frontend Guide | 132 | Archive | Mixed | notification | `archives/frontend_guide_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` | Frontend Refactoring Guide (Phase 5) | 157 | Archive | Mixed | calendar, event, notification, resource | `archives/frontend_refactoring_guide_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/GETTING_STARTED_legacy.md` | Getting Started | 132 | Archive | Mixed | general | `archives/getting_started_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/RESPONSE_SPEC_legacy.md` | API Response Specification | 241 | Archive | Mixed | calendar, resource | `archives/response_spec_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/SERVICES_GUIDE_legacy.md` | Services Guide | 132 | Archive | Mixed | calendar, event, notification, resource | `archives/services_guide_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/setup-guide_legacy.md` | Cal3 Complete Setup Guide | 1557 | Archive | Developer | calendar, deployment, event, mobile, notification, organization, resource | `archives/setup-guide_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/legacy/TYPES_DOCUMENTATION_legacy.md` | Type System Guide | 358 | Archive | Mixed | calendar, organization, reservation | `archives/types_documentation_legacy.md` | explicit-legacy/deprecated marker; already archived content |
| `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` | Azure SQL Database Deployment Report | 1019 | Archive | Administrator | automation, calendar, deployment, event, reservation, resource, security | `archives/azure_sql_deployment_report.md` | already archived content |
| `archives/reports/DEAD_CODE_ANALYSIS.md` | Dead Code Analysis | 6452 | Archive | Mixed | agent, automation, booking, calendar, event, mobile, notification, organization, reservation, resource, security | `archives/dead_code_analysis.md` | already archived content |
| `archives/reports/MOBILE_BUILD_SCRIPTS.md` | Cal3 Mobile Build Scripts | 631 | Archive | Mixed | calendar, mobile | `archives/mobile_build_scripts.md` | already archived content |
| `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` | PostgreSQL Database Deployment Report | 1193 | Archive | Administrator | automation, calendar, deployment, event, reservation, resource, security | `archives/postgres_deployment_report.md` | already archived content |
| `archives/reports/SCHEMA_VERIFICATION_REPORT.md` | Database Schema Verification Report | 1697 | Archive | Mixed | automation, booking, calendar, deployment, event, organization, reservation, resource | `archives/schema_verification_report.md` | already archived content |
| `automation-smart-values.md` | Automation Smart Values Documentation | 1114 | Uncategorized | Mixed | automation, calendar, event, notification, security | `USER-GUIDE/automation/smart-values.md` |  |
| `automation-webhooks.md` | Automation Webhooks Documentation | 1052 | Uncategorized | Mixed | automation, mobile, notification, security | `USER-GUIDE/automation/webhooks.md` |  |
| `automation.md` | Calendar Automation System - Complete Documentation | 5570 | Uncategorized | Mixed | automation, calendar, deployment, event, mobile, notification, security | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `compliance/CONTROLS_EVIDENCE.md` | Controls and Evidence Collection | 134 | Admin Guide | Administrator | event, security | `ADMIN-GUIDE/security-and-compliance/audit-logging.md` |  |
| `compliance/GDPR_MODULE.md` | GDPR Module | 246 | Admin Guide | Administrator | calendar, event, reservation, security | `ADMIN-GUIDE/security-and-compliance/gdpr-compliance.md` |  |
| `compliance/INCIDENT_RESPONSE.md` | Incident Response Procedures | 185 | Admin Guide | Administrator | automation, deployment, event, notification, security | `ADMIN-GUIDE/security-and-compliance/security-incident-response.md` |  |
| `compliance/README.md` | PrimeCal Compliance Program | 177 | Admin Guide | Administrator | notification, security | `index.md` |  |
| `CONFIGURATION_GUIDE.md` | 🎯 Cal3 Configuration Guide | 1423 | Uncategorized | Mixed | deployment, security | `DEPLOYMENT-GUIDE/configuration/configuration-files.md` |  |
| `database/SECURITY_OPTIMIZATION.md` | Database Security and Optimization (Enterprise Baseline) | 748 | Developer Guide | Mixed | agent, automation, calendar, event, notification, organization, reservation, resource, security | `DEVELOPER-GUIDE/database/database-setup.md` |  |
| `DOCKER_SECURITY.md` | Docker Security & Secrets Guide | 508 | Uncategorized | Mixed | automation, calendar, deployment, security | `DEPLOYMENT-GUIDE/docker/docker-security.md` |  |
| `docker/BUILD_AND_DEBUG.md` | Docker Build & Debug Checklist | 202 | Deployment Guide | DevOps | deployment | `DEPLOYMENT-GUIDE/docker/dockerfile-reference.md` |  |
| `docker/HOWTO.md` | Docker Setup Guide | 747 | Deployment Guide | DevOps | deployment, security | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` |  |
| `docker/PORTAINER_DEBUG.md` | Portainer Deployment Workflow & Debugging | 486 | Deployment Guide | DevOps | automation, deployment, event, security | `DEPLOYMENT-GUIDE/docker/docker-networking.md` | tool-specific legacy workflow may not be primary path |
| `docker/TROUBLESHOOTING.md` | Docker Troubleshooting Guide | 410 | Deployment Guide | DevOps | deployment, security | `TROUBLESHOOTING/index.md` |  |
| `DOCUMENTATION_CHECKLIST.md` | Documentation Checklist | 103 | Uncategorized | Mixed | deployment | `UNMAPPED` | explicit-legacy/deprecated marker |
| `ERROR_HANDLING_GUIDE.md` | Error Handling Guide | 254 | Uncategorized | Mixed | reservation | `TROUBLESHOOTING/error-messages/network-errors.md` |  |
| `external-database/INDEX.md` | External Database Documentation | 409 | Deployment Guide | DevOps | deployment, security | `DEPLOYMENT-GUIDE/database-management/external-database-connection.md` |  |
| `external-database/QUICK_REFERENCE.md` | External Database Quick Reference | 200 | Deployment Guide | DevOps | deployment | `REFERENCE/database/migration-reference.md` |  |
| `external-database/README.md` | External Database Setup Guide for Cal3 | 617 | Deployment Guide | DevOps | deployment, resource, security | `index.md` |  |
| `feature-flags.md` | Feature Flags System | 1584 | Uncategorized | Administrator | automation, calendar, deployment, event, reservation | `ADMIN-GUIDE/feature-flags/feature-flag-management.md` |  |
| `GLOSSARY.md` | Glossary: Terms You Will Actually Use | 194 | Uncategorized | Mixed | agent, automation, booking, calendar, organization, reservation, resource | `GETTING-STARTED/glossary.md` |  |
| `MOBILE_APP.md` | Cal3 Mobile App - Android Development Guide | 1604 | Uncategorized | Developer | calendar, mobile, notification, resource | `USER-GUIDE/mobile-app/mobile-app-overview.md` |  |
| `monitoring/ERROR_HANDLING.md` | CAL3 Error Handling and Monitoring | 592 | Deployment Guide | DevOps | event, mobile, resource, security | `DEPLOYMENT-GUIDE/monitoring-and-logging/error-tracking.md` |  |
| `ORGANIZATION_MANAGEMENT.md` | Organization Management System Documentation | 1431 | Uncategorized | Administrator | calendar, event, notification, organization, reservation, resource, security | `ADMIN-GUIDE/organization-management/organization-settings.md` |  |
| `PORT_CONFIGURATION.md` | 🔌 Port Configuration Guide for Cal3 | 943 | Uncategorized | Mixed | automation, deployment | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` |  |
| `QUICKSTART.md` | Quickstart: Get Your First Cal3 Win in Minutes | 216 | Getting Started | Mixed | automation, booking, event | `GETTING-STARTED/quick-start-guide.md` |  |
| `README.md` | Cal3 Documentation: From First Setup to Full Automation | 151 | Uncategorized | Developer | automation, deployment | `index.md` |  |
| `releases/tasks-mcp-rollout.md` | Tasks MCP Release Notes & Rollout Plan | 248 | Reference | Mixed | agent, calendar, deployment | `REFERENCE/release-notes/changelog.md` |  |
| `RESERVATION_CALENDARS_IMPLEMENTATION.md` | Reservation Calendars Implementation Plan | 1420 | Uncategorized | Mixed | calendar, event, mobile, notification, organization, reservation, resource | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` |  |
| `security/API_SECURITY.md` | API Security Hardening | 667 | Admin Guide | Administrator | automation, booking, event, reservation, security | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `security/asvs-matrix.md` | PrimeCal ASVS 5.0 Compliance Matrix | 289 | Admin Guide | Administrator | deployment, event, resource, security | `ADMIN-GUIDE/security-and-compliance/soc2-compliance.md` |  |
| `security/AUTH_AUTHORIZATION.md` | Authentication & Authorization Hardening | 492 | Admin Guide | Administrator | organization, reservation, resource, security | `ADMIN-GUIDE/security-and-compliance/access-control-policies.md` |  |
| `security/data-layer-hardening.md` | Data Layer Hardening & RLS Rollout | 375 | Admin Guide | Administrator | agent, booking, calendar, organization, reservation, resource, security | `DEPLOYMENT-GUIDE/security/security-hardening.md` |  |
| `security/http-hardening.md` | HTTP Security Hardening Checklist | 435 | Admin Guide | Administrator | event, mobile, organization, reservation, security | `DEPLOYMENT-GUIDE/security/firewall-configuration.md` |  |
| `security/INPUT_VALIDATION.md` | Input Validation & Injection Hardening | 513 | Admin Guide | Administrator | automation, reservation, security | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `security/repo-hygiene.md` | Repository Hygiene Remediation | 257 | Admin Guide | Developer | security | `DEVELOPER-GUIDE/contributing/development-workflow.md` |  |
| `security/WEBHOOK_SECURITY.md` | Webhook and Automation Security | 418 | Admin Guide | Administrator | agent, automation, calendar, event, security | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `SIMPLE_PORT_CONFIG.md` | 🎯 Simplified Port Configuration | 951 | Uncategorized | Mixed | deployment | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` |  |
| `testing/TESTING_STRATEGY.md` | CAL3 Testing Strategy | 474 | Developer Guide | Developer | automation, deployment, event, mobile, organization, security | `DEVELOPER-GUIDE/testing/testing-strategy.md` |  |
| `TROUBLESHOOTING.md` | Troubleshooting | 151 | Uncategorized | Mixed | general | `TROUBLESHOOTING/index.md` |  |
| `UI_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` | UI/UX Improvements Implementation Guide | 2804 | Uncategorized | Mixed | automation, calendar, deployment, event, mobile, organization, reservation, resource | `DEVELOPER-GUIDE/frontend-development/component-library.md` |  |
