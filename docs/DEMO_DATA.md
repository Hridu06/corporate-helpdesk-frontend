# Dashboard demo data

Added to the local `corporate_helpdesk` database on 3 November 2026. Existing accounts and passwords were reused without changes.

## Ticket set

All eight tickets belong to Raiyan. The six assigned tickets belong to agent Sabbir Hossain, who is a member of both demo departments. Sayem and Hridoy can see all eight with their existing administrative permissions.

| Number | Subject | Department | Status | Priority | Assigned to |
| --- | --- | --- | --- | --- | --- |
| TCK-000045 | Software installation required | IT | Closed | Low | Sabbir Hossain |
| TCK-000046 | Incorrect leave balance in HR portal | HR | Resolved | Medium | Sabbir Hossain |
| TCK-000047 | Office printer is not printing | IT | Resolved | Medium | Sabbir Hossain |
| TCK-000048 | Laptop overheating during normal use | IT | Open | High | Sabbir Hossain |
| TCK-000049 | Work email is not syncing | IT | In progress | High | Sabbir Hossain |
| TCK-000050 | Unable to access payroll portal | HR | In progress | Urgent | Sabbir Hossain |
| TCK-000051 | New employee ID card required | HR | Open | Low | Unassigned |
| TCK-000052 | Office Wi-Fi connection issue | IT | Open | Urgent | Unassigned |

Creation dates span 12 October to 3 November 2026, so the default 30-day charts show activity across multiple days. Resolution and closure timestamps follow creation. The reports count three resolution events, including the ticket that was subsequently closed; the dashboard's current Resolved status count is two.

Nine public conversation messages and three staff-only internal notes accompany the tickets. Assignment, priority and status histories are included. Seeding does not send notifications.

## Expected dashboard totals

| Role / account | Total | Open | In progress | Resolved | Closed |
| --- | ---: | ---: | ---: | ---: | ---: |
| Super Admin / Hridoy | 8 | 3 | 2 | 2 | 1 |
| Admin / Sayem | 8 | 3 | 2 | 2 | 1 |
| Agent / Sabbir Hossain | 6 | 1 | 2 | 2 | 1 |
| Customer / Raiyan | 8 | 3 | 2 | 2 | 1 |

Admin and Super Admin priority charts show 25% for each priority. Department totals are IT: 5 and HR: 3. Agent and Customer priority charts describe their five most recent visible tickets, as labelled in the UI.

## Seed helper

From this frontend checkout, with the sibling Laravel checkout and its local MySQL database available:

```powershell
# Inspect accounts, existing demo records and the planned distribution without inserting.
php -d xdebug.mode=off scripts/seed-dashboard-demo.php

# Add missing demo records. Existing matching records are preserved.
php -d xdebug.mode=off scripts/seed-dashboard-demo.php --apply
```

The helper reads the ignored `docs/LOGIN_CREDENTIALS.md` at runtime. It creates no accounts, changes no passwords or permissions, and preserves existing department members. The database changes run in one transaction. Stable `dashboard-v1` references in ticket descriptions prevent duplicates. A second apply was verified to create zero additional tickets.

## Verification

Each documented account was signed in through the real frontend and local API. Dashboard totals matched the table above and there were no browser page errors. Admin and Super Admin reports returned eight created tickets across eight different dates, three resolved tickets including the closed one, and two currently unassigned tickets. Customers received public replies without internal notes; the agent could read notes on assigned tickets and received HTTP 403 for an unassigned ticket. Report endpoints returned HTTP 403 for Customer and Agent. Each verification session was signed out afterwards.

Screenshots are saved in `docs/previews/demo-dashboard-super-admin.png`, `demo-dashboard-admin.png`, `demo-dashboard-agent.png`, and `demo-dashboard-customer.png`.
