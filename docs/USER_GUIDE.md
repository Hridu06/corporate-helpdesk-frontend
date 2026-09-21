# Corporate Helpdesk: User Guide

How to use the web app, from signing in to every feature, and what each role can do.

**Contents**

1. [The big picture](#1-the-big-picture)
2. [Getting in](#2-getting-in)
3. [Finding your way around](#3-finding-your-way-around)
4. [Tickets](#4-tickets)
5. [Guide for customers](#5-guide-for-customers)
6. [Guide for agents](#6-guide-for-agents)
7. [Guide for admins](#7-guide-for-admins)
8. [Guide for super admins](#8-guide-for-super-admins)
9. [Emails you will receive](#9-emails-you-will-receive)
10. [What each role can do (summary table)](#10-what-each-role-can-do-summary-table)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. The big picture

The helpdesk is where people ask for help and where the support team answers.

- A **customer** opens a **ticket** describing a problem.
- An **admin** looks at incoming tickets and **assigns** each one to an **agent**.
- The **agent** works on it, **replies** to the customer and moves it through its **status**.
- The customer sees the answers, replies back and finally **closes** the ticket (or reopens it if the problem returns).

There are four roles. What you see in the menu depends on your role.

| Role | Who it is for |
|---|---|
| **Customer** | Someone asking for help. Sees only their own tickets. |
| **Agent** | Support staff. Sees only the tickets assigned to them. |
| **Admin** | Support lead. Sees every ticket, assigns them, manages users and departments, reads reports. |
| **Super Admin** | Owner of the system. Everything an admin can do, plus roles and permissions. |

The menu only shows what you are allowed to use. The server checks every action too, so hiding or showing a menu item is never the only protection.

---

## 2. Getting in

### Sign in

1. Open the helpdesk address given to you and go to **Sign in**.
2. Enter your **email** and **password**.
3. Tick **Remember me** only on your own computer. It keeps you signed in after you close the browser. Without it you are signed out when the browser is closed.
4. Press **Sign in**. You land on your **Dashboard**.

A deactivated account cannot sign in. Too many wrong attempts in a short time are temporarily blocked; wait a little and try again.

### Create an account (customers)

On the sign-in page choose **Register** and fill in **Full name**, **Email**, **Password** and **Confirm password**. Accounts created this way are always **Customer** accounts.

Passwords must have at least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol.

After registering you receive an email with a **verification link**. Open it to confirm your address; then you can sign in. If the link is old or invalid, the page lets you enter your email to get a new one.

### Accounts created for you

Staff (agents, admins) are normally added by an admin. You receive an email so you can set your own password. Then sign in as usual.

### Forgot your password

1. On the sign-in page choose **Forgot password**.
2. Enter your email. If the address has an account, a reset link is emailed.
3. Open the link, choose a new password (same rules as above) and sign in.

### Sign out

Use **Sign out** in the top bar, especially on shared computers.

---

## 3. Finding your way around

- **Sidebar:** the list of pages you may use. On a phone it opens from a menu button.
- **Dashboard:** the first page after sign-in. It shows shortcut cards for the pages your role uses, and a line "Your access" with your role and how many permissions you hold.
- **Page not shown?** If a page is not in your sidebar, your role does not include it. Typing its address directly shows an "access denied" page.

---

## 4. Tickets

### Statuses

| Status | Meaning |
|---|---|
| **Open** | Received, not started yet. |
| **In progress** | Someone is working on it. |
| **Resolved** | The team believes it is solved. The customer can confirm by closing it, or reopen it. |
| **Closed** | Finished. Can be reopened by the customer or by staff if needed. |

A customer reply on a **Resolved** ticket reopens it automatically.

### Priority

**Low**, **Medium**, **High**, **Urgent**. Staff with the right permission can change it.

### The ticket list

Open **Tickets** in the sidebar. You can:

- **Search** by subject or by the ticket number (for example `TCK-000123`).
- **Filter** by status and priority; staff also get an **Assignment** filter (for example unassigned tickets).
- Move through pages of results.

### The ticket page

Open a ticket to see:

- Its details: subject, description, status, priority, department, who opened it, who it is assigned to.
- The **conversation**: public replies, and (for staff only) internal notes.
- **Attachments**.
- The **history**: a timeline of every status, priority and assignment change with who did it.
- **Action buttons**, shown only when you are allowed to use them.

### Replies and internal notes

- A **reply** is visible to the customer.
- An **internal note** is visible to staff only. Customers never see internal notes, in the page or anywhere else. Use notes for hand-over information between staff.

### Attachments

You can attach files when opening a ticket and when replying.

- Up to **5 files** at once, each up to **5 MB**, **15 MB** in total.
- Allowed types: jpg, jpeg, png, webp, gif, pdf, txt, csv, docx, xlsx.
- The server inspects each file's real content, so renaming a file does not get around the rules. A file that is refused is reported with the reason.
- Click a file name on a ticket to download it. Files are private: only people who may see that ticket can download them.

---

## 5. Guide for customers

**What you can do:** open tickets, follow your own tickets, reply, attach files, close or reopen your own resolved tickets.

**What you cannot do:** see other people's tickets, see internal notes, change priority or assignment, see any admin pages.

### Ask for help

1. Sidebar → **New Ticket**.
2. Fill in:
   - **Subject** (up to 150 characters), short and specific.
   - **Description** (up to 5000 characters): what happened, what you expected, any error text.
   - **Department**.
   - Optional **attachments** (screenshots help a lot).
3. Press submit. You are taken to the ticket and receive a confirmation email.

### Follow and answer

1. Sidebar → **Tickets** lists your tickets. Click one.
2. Read the replies. Write your answer in the reply box, add files if needed, and send.
3. You get an email when the team replies, and when the ticket is resolved or closed (see [Emails](#9-emails-you-will-receive)).

### Finish

- When the problem is solved, use **Close ticket**.
- If the ticket was marked **Resolved** but you still have the problem, **reply** (it reopens automatically) or use **Reopen**.

---

## 6. Guide for agents

**What you can do:** see the tickets **assigned to you**, reply to customers, write internal notes, change the status, view departments. If an admin has granted it, you can also see Reports.

**What you cannot do:** see tickets that are not assigned to you, assign tickets to others, manage users, roles or departments.

### Daily flow

1. **Dashboard** → **Tickets** shows your assigned tickets. Use the filters to look at Open or In progress first.
2. Open a ticket and read the description and any attachments.
3. Press **Start progress** so the customer and colleagues know it is being handled.
4. Reply to the customer. Use an **internal note** for anything the customer should not see.
5. When you believe it is solved, press **Mark resolved** and tell the customer in a reply.
6. If the customer replies with a new problem the ticket reopens; continue from step 3.

You receive an email when a ticket is assigned to you, when the customer replies and when a note is added.

Which buttons you see depends on the ticket's current status, your role and your permissions. If a button you expect is missing, the ticket may be in a state where that action does not apply.

---

## 7. Guide for admins

**What you can do (by default):** see **all** tickets; assign tickets to agents; change priority and status; reply and write internal notes; manage users (view, add, edit, change role, activate, deactivate); manage departments; see **Reports**.

**What you cannot do:** change roles and permissions, see login activity, touch Super Admin accounts. (An admin may hold extra abilities if a Super Admin granted them.)

### Triage tickets

1. **Tickets** shows every ticket. Filter by **Open** or by unassigned to see new work.
2. Open a ticket. In the actions panel choose the **Assignee** (only suitable agents are offered) and set the **Priority**.
3. Follow the ticket until it is resolved. You can reply and add notes like an agent.

### Users

Sidebar → **Users**.

- **Search** by name or email; filter by status and role.
- **Add user:** enter full name, email and role. The person gets an email to set their password. If that email could not be sent, you are warned so you can try again or tell the person.
- **Edit:** correct name or email.
- **Change role:** for example promote a customer to agent.
- **Deactivate:** blocks the person from signing in (their history stays). **Activate** reverses it.
- You cannot deactivate or change the role of **yourself**, and only a Super Admin can act on a Super Admin.

### Departments

Sidebar → **Departments**: create, rename and delete the teams that tickets belong to. Deleting is asked to be confirmed.

### Reports

Sidebar → **Reports** (needs the report permission, which admins have by default). See [Reports](#reports-1) below.

---

## 8. Guide for super admins

A Super Admin can do everything an admin can, plus:

### Roles & Permissions

Sidebar → **Roles & Permissions**. Decide what Admin, Agent and Customer may do.

1. Pick a role on the left.
2. Tick or untick permissions in the groups (tickets, users, departments, reports…). Each has a short explanation.
3. Some boxes are **locked**. The reason is shown next to each:
   - **Required:** the role cannot work without it (for example every role must be able to view tickets).
   - **Can never be given** to that role (for example a Customer can never see all tickets or internal notes).
   - **Reserved:** not used by any feature yet.
   - **Sensitive:** allowed, but you get an extra warning on the confirmation (reports, user access).
4. The counter shows how many permissions will be added and removed. Press **Save changes**.
5. A **confirmation** lists exactly what will be added and removed and how many people are affected. Confirm to save. Nothing is saved before you confirm.
6. Changes apply **immediately** to the people in that role, without them signing in again.
7. **Reset to defaults** returns a role to what it shipped with.
8. **History** shows who changed what and when.

Good to know:

- **Super Admin** always has every permission and cannot be edited.
- Only these four built-in roles exist; roles cannot be created or deleted.
- If someone else saved changes to the same role while you were editing, your save is refused with "Someone else changed this role". Reload, look at their change and redo yours.
- The screen can be shared with another person (for example a trusted admin) by giving them the role-viewing and permission-assigning permissions. Such a person can still only edit roles below their own and can only grant permissions they hold themselves.

### Login Activity

Sidebar → **Login Activity**: who signed in, when, and failed attempts. Search, filter by result and date range.

### System Settings

Listed in the menu as "coming soon". It is not available yet.

---

## Reports

For anyone with the report permission (Admin and Super Admin by default; an agent only if a Super Admin grants it).

- Choose a **period** (up to 366 days) and optionally one **department**.
- Figures: tickets **created** and **resolved**, tickets **open** and **unassigned** now, **average resolution time**, **average first-response time**, **reopened** tickets.
- A **chart** of tickets over time (per day, or per week on long periods).
- **Breakdowns** by status, priority, department and how long open tickets have been waiting.
- A **table per agent**.
- Reports show numbers only, never ticket subjects or messages. The page explains how each figure is counted. Days follow the time zone set by the administrator of the server.

---

## 9. Emails you will receive

Emails are short notices with a sign-in link. They never contain the text of a message, so log in to read it.

| Who | When |
|---|---|
| Customer | Ticket received; the team replied; ticket resolved; ticket closed; ticket reopened. |
| Assigned agent | A ticket was assigned to you; the customer replied; a note was added. |
| Everyone | Verification link after registering; password reset; account invitation. |

You cannot answer a ticket by replying to the email; use the link.

---

## 10. What each role can do (summary table)

Defaults. A Super Admin can change these on the **Roles & Permissions** page.

| Feature | Customer | Agent | Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|
| Register, sign in, reset password | ✔ | ✔ | ✔ | ✔ |
| Open a ticket | ✔ | | | |
| See own tickets | ✔ | | | |
| See tickets assigned to them | | ✔ | ✔ | ✔ |
| See **all** tickets | | | ✔ | ✔ |
| Reply to a ticket | ✔ | ✔ | ✔ | ✔ |
| Internal notes (write and read) | | ✔ | ✔ | ✔ |
| Attach files | ✔ | ✔ | ✔ | ✔ |
| Change status | Close / reopen own | ✔ | ✔ | ✔ |
| Change priority | | | ✔ | ✔ |
| Assign to an agent | | | ✔ | ✔ |
| View departments | | ✔ | ✔ | ✔ |
| Create / rename / delete departments | | | ✔ | ✔ |
| View, add, edit users | | | ✔ | ✔ |
| Change user role, activate / deactivate | | | ✔ | ✔ |
| Reports | | optional | ✔ | ✔ |
| Login activity | | | | ✔ |
| Roles & Permissions | | | | ✔ |
| System Settings | not available yet | | | |

Note: "Open a ticket" is a customer ability. Staff work on tickets that customers open.

---

## 11. Troubleshooting

| Problem | What to do |
|---|---|
| I cannot sign in | Check the email and password. Use **Forgot password** if unsure. If it still fails, your account may be deactivated: ask an admin. |
| I did not get the verification or reset email | Check the spam folder. Request a new one from the page. Ask an admin if it still does not arrive. |
| A menu item is missing | Your role does not include that page. Ask an admin or Super Admin if you need it. |
| "Access denied" page | You opened a page your role cannot use. |
| I cannot see a ticket | Customers see only their own tickets; agents only those assigned to them. |
| A file was refused | Check the type and size limits in [Attachments](#attachments). The message names the file and the reason. |
| I can no longer do something I could yesterday | A Super Admin may have changed your role's permissions. It applies immediately. |
| The page shows old information | Reload the page. Updates are not pushed live. |
