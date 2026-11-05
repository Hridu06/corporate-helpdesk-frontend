<?php

// Run with --apply to add the approved demo dataset. Without it, only inspect.
// Uses the sibling Laravel app; no backend source or credentials are modified.
use App\Enums\TicketMessageType;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

$backend = realpath(__DIR__.'/../../corporate-helpdesk');
if (!$backend || !is_file($backend.'/vendor/autoload.php')) {
    fwrite(STDERR, "The sibling corporate-helpdesk Laravel checkout is required.\n");
    exit(1);
}
require $backend.'/vendor/autoload.php';
$app = require $backend.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    if (!$app->environment('local')) {
        throw new RuntimeException('This demo script is intended for the local development database.');
    }

    $credentials = file_get_contents(__DIR__.'/../docs/LOGIN_CREDENTIALS.md');
    preg_match_all('/^## ([^\r\n]+)\r?\n(.*?)(?=^## |\z)/ms', $credentials, $sections, PREG_SET_ORDER);
    $roleSlugs = ['Super Admin' => 'super-admin', 'Admin' => 'admin', 'Agent' => 'agent', 'Customer' => 'customer'];
    $people = [];
    foreach ($sections as $section) {
        $role = $roleSlugs[trim($section[1])] ?? null;
        if (!$role) continue;
        preg_match('/\*\*Email:\*\*\s*`([^`]+)`/', $section[2], $email);
        preg_match('/\*\*Password:\*\*\s*`([^`]+)`/', $section[2], $password);
        if (!isset($email[1], $password[1])) throw new RuntimeException("Credentials missing for {$role}.");
        $user = User::whereRaw('LOWER(email) = ?', [strtolower($email[1])])->first();
        if (!$user || !$user->isActive() || !$user->hasRole($role)) {
            throw new RuntimeException("The documented {$role} account must exist, be active and have the expected role.");
        }
        if (!Hash::check($password[1], $user->password)) {
            throw new RuntimeException("The documented password does not match the {$role} account. No passwords were changed.");
        }
        $people[$role] = $user;
    }
    if (count($people) !== 4) throw new RuntimeException('All four documented role accounts are required.');
    unset($credentials, $sections, $password);

    $marker = 'Demo reference: dashboard-v1:';
    $anchor = CarbonImmutable::parse('2026-11-03 09:00:00', 'Asia/Dhaka')->utc();
    $specs = [
        ['key' => 'software-installation', 'subject' => 'Software installation required', 'department' => 'IT', 'days' => 22, 'status' => 'closed', 'priority' => 'low', 'assigned' => true,
         'description' => 'Please install the approved PDF editor on the office laptop so I can prepare onboarding documents.',
         'reply' => 'The approved PDF editor is installed and the licence has been activated. Please confirm that it opens correctly.'],
        ['key' => 'leave-balance', 'subject' => 'Incorrect leave balance in HR portal', 'department' => 'HR', 'days' => 15, 'status' => 'resolved', 'priority' => 'medium', 'assigned' => true,
         'description' => 'The HR portal shows two fewer annual leave days than the approved attendance record. Please reconcile the balance.',
         'reply' => 'We reconciled the approved attendance entries and corrected the annual leave balance in the portal.'],
        ['key' => 'printer', 'subject' => 'Office printer is not printing', 'department' => 'IT', 'days' => 6, 'status' => 'resolved', 'priority' => 'medium', 'assigned' => true,
         'description' => 'Print jobs for the second-floor shared printer remain in the queue. Other colleagues are seeing the same issue.',
         'reply' => 'The print spooler was restarted and the shared printer driver was updated. A test page printed successfully.',
         'note' => 'Print-server queue cleared and driver package updated. Monitor the shared queue during the next business day.'],
        ['key' => 'laptop-overheating', 'subject' => 'Laptop overheating during normal use', 'department' => 'IT', 'days' => 4, 'status' => 'open', 'priority' => 'high', 'assigned' => true,
         'description' => 'The laptop becomes unusually hot and the fan runs continuously during meetings. Please arrange a hardware check.',
         'reply' => 'Your request has been assigned to me. Please keep the laptop available for the initial temperature and fan checks.'],
        ['key' => 'email-sync', 'subject' => 'Work email is not syncing', 'department' => 'IT', 'days' => 3, 'status' => 'in_progress', 'priority' => 'high', 'assigned' => true,
         'description' => 'New work emails appear in webmail but do not sync to the desktop mail application. Restarting the application did not help.',
         'reply' => 'We are checking the desktop mail profile and authentication settings. Webmail can be used while the sync issue is investigated.',
         'note' => 'Webmail delivery is healthy. Investigate the local account profile before considering server-side changes.'],
        ['key' => 'payroll-access', 'subject' => 'Unable to access payroll portal', 'department' => 'HR', 'days' => 2, 'status' => 'in_progress', 'priority' => 'urgent', 'assigned' => true,
         'description' => 'The payroll portal rejects my employee login and I cannot download the salary statement needed for an urgent application.',
         'reply' => 'We have escalated the payroll access issue and are checking the employee account mapping with HR.',
         'note' => 'Employee record is active. HR must confirm the portal account mapping; never request or store the employee password.'],
        ['key' => 'id-card', 'subject' => 'New employee ID card required', 'department' => 'HR', 'days' => 1, 'status' => 'open', 'priority' => 'low', 'assigned' => false,
         'description' => 'My employee ID card is damaged. Please advise on the replacement process and collection time.'],
        ['key' => 'office-wifi', 'subject' => 'Office Wi-Fi connection issue', 'department' => 'IT', 'days' => 0, 'status' => 'open', 'priority' => 'urgent', 'assigned' => false,
         'description' => 'The meeting-room Wi-Fi disconnects repeatedly and is interrupting scheduled client calls. Please investigate the access point.'],
    ];

    $departmentAliases = ['IT' => ['it', 'it support', 'information technology'], 'HR' => ['hr', 'human resources']];
    $departments = [];
    foreach ($departmentAliases as $label => $aliases) {
        $department = Department::all()->first(fn ($item) => in_array(strtolower($item->name), $aliases, true));
        if ($department && !$department->is_active) throw new RuntimeException("The existing {$label} department is inactive; no department was modified.");
        $departments[$label] = $department;
    }
    $customer = $people['customer'];
    $agent = $people['agent'];
    $admin = $people['admin'];
    $super = $people['super-admin'];
    $existingCount = Ticket::where('customer_id', $customer->id)->where('description', 'like', '%'.$marker.'%')->count();
    $report = [
        'mode' => in_array('--apply', $argv, true) ? 'apply' : 'inspect',
        'database' => DB::connection()->getDatabaseName(),
        'accounts' => collect($people)->map(fn ($user) => ['id' => $user->id, 'name' => $user->name, 'roles' => $user->getRoleNames()]),
        'departments' => collect($departments)->map(fn ($department) => $department ? ['id' => $department->id, 'name' => $department->name] : ['will_create' => true]),
        'existing_ticket_count' => Ticket::count(),
        'existing_demo_count' => $existingCount,
        'planned_statuses' => ['open' => 3, 'in_progress' => 2, 'resolved' => 2, 'closed' => 1],
        'planned_priorities' => ['low' => 2, 'medium' => 2, 'high' => 2, 'urgent' => 2],
        'assigned_to_agent' => 6,
        'unassigned' => 2,
    ];

    if (in_array('--apply', $argv, true)) {
        // Database seeding should not send email or queue notifications.
        Notification::fake();
        config(['helpdesk.ticket_notifications' => false]);
        $report['tickets'] = DB::transaction(function () use ($departments, $specs, $marker, $anchor, $customer, $agent, $admin, $super) {
            User::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            foreach ($departments as $label => &$department) {
                $department ??= Department::firstOrCreate(['name' => $label], [
                    'description' => $label === 'IT' ? 'Workplace technology, devices and connectivity support.' : 'Employee services, payroll access and workplace requests.',
                    'is_active' => true,
                ]);
                $department->users()->syncWithoutDetaching([$agent->id]);
            }
            unset($department);
            $rows = [];
            foreach ($specs as $spec) {
                $reference = $marker.$spec['key'];
                $matches = Ticket::where('customer_id', $customer->id)->where('description', 'like', '%'.$reference.'%')->get();
                if ($matches->count() > 1) throw new RuntimeException('Duplicate demo references already exist; aborting without changes.');
                $ticket = $matches->first();
                $created = false;
                if (!$ticket) {
                    $at = $anchor->subDays($spec['days']);
                    $resolved = in_array($spec['status'], ['resolved', 'closed'], true) ? $at->addDays(1) : null;
                    $closed = $spec['status'] === 'closed' ? $resolved->addDay() : null;
                    $updated = $closed ?? $resolved ?? ($spec['assigned'] ? $at->addMinutes(90) : $at);
                    $ticket = new Ticket();
                    $ticket->forceFill([
                        'subject' => $spec['subject'], 'description' => $spec['description']."\n\n".$reference,
                        'department_id' => $departments[$spec['department']]->id, 'customer_id' => $customer->id,
                        'assigned_to' => $spec['assigned'] ? $agent->id : null,
                        'status' => TicketStatus::from($spec['status']), 'priority' => TicketPriority::from($spec['priority']),
                        'created_at' => $at, 'updated_at' => $updated, 'resolved_at' => $resolved, 'closed_at' => $closed,
                    ])->save();
                    $created = true;
                    $event = function ($actor, $type, $data, $time) use ($ticket) {
                        $ticket->events()->create(['actor_id' => $actor->id, 'type' => $type, 'data' => $data, 'created_at' => $time]);
                    };
                    if ($spec['priority'] !== 'medium') $event($admin, 'priority_changed', ['from' => 'medium', 'to' => $spec['priority']], $at->addMinutes(10));
                    if ($spec['assigned']) {
                        $event($admin, 'assigned', ['assignee_name' => $agent->name], $at->addMinutes(20));
                        if ($spec['status'] !== 'open') $event($agent, 'status_changed', ['from' => 'open', 'to' => 'in_progress'], $at->addMinutes(40));
                        $ticket->messages()->create(['user_id' => $agent->id, 'type' => TicketMessageType::PublicReply, 'body' => $spec['reply'], 'created_at' => $at->addMinutes(50), 'updated_at' => $at->addMinutes(50)]);
                        if (isset($spec['note'])) $ticket->messages()->create(['user_id' => $agent->id, 'type' => TicketMessageType::InternalNote, 'body' => $spec['note'], 'created_at' => $at->addMinutes(60), 'updated_at' => $at->addMinutes(60)]);
                        if ($resolved) {
                            $ticket->messages()->create(['user_id' => $customer->id, 'type' => TicketMessageType::PublicReply, 'body' => 'Thank you for the update. I have checked the result and the issue is fixed.', 'created_at' => $resolved->subMinutes(5), 'updated_at' => $resolved->subMinutes(5)]);
                            $event($agent, 'status_changed', ['from' => 'in_progress', 'to' => 'resolved'], $resolved);
                        }
                        if ($closed) $event($customer, 'status_changed', ['from' => 'resolved', 'to' => 'closed'], $closed);
                    }
                    AuditLog::record($super, 'demo.ticket_seeded', $ticket, ['dataset' => 'dashboard-v1', 'number' => $ticket->number, 'historical_created_at' => $at->toIso8601String()]);
                }
                $rows[] = ['id' => $ticket->id, 'number' => $ticket->number, 'subject' => $ticket->subject, 'status' => $ticket->status->value, 'priority' => $ticket->priority->value, 'assigned_to' => $ticket->assigned_to, 'created' => $created, 'created_at' => $ticket->created_at->toIso8601String()];
            }
            return $rows;
        });
        $demo = Ticket::where('customer_id', $customer->id)->where('description', 'like', '%'.$marker.'%');
        $report['actual_statuses'] = (clone $demo)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $report['actual_priorities'] = (clone $demo)->selectRaw('priority, count(*) as total')->groupBy('priority')->pluck('total', 'priority');
        $report['actual_assigned'] = (clone $demo)->where('assigned_to', $agent->id)->count();
        $report['actual_unassigned'] = (clone $demo)->whereNull('assigned_to')->count();
        $report['final_ticket_count'] = Ticket::count();
    }
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage().PHP_EOL);
    exit(1);
}
