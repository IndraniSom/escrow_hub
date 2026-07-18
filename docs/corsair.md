
# Corsair

# Quick Start

## A working integration in five steps, powered by Hub.

The quickest path to a working integration is Hub. It hosts the OAuth connect, approval, and webhook surfaces, so there are no connect pages, callback routes, or per-environment redirect URIs to build. Credentials are still encrypted and stored in your own database — Hub stores none.

## Want to host those surfaces yourself instead? Every step below is the same; you just swap the hub block for manual. See [Manual or Hub](https://docs.corsair.dev/hub/manual-vs-hub).

1

**[](https://docs.corsair.dev/getting-started/quick-start#install)**

## Install

npm

yarnpnpmbun

```
npm install corsair @corsair-dev/github

```

2

**[](https://docs.corsair.dev/getting-started/quick-start#set-your-environment)**

## Set your environment

Create a project in the [Hub dashboard](https://hub.corsair.dev/dashboard) and copy the development API key and signing secret. Then generate a KEK — Corsair encrypts every stored credential with it:

```
bash

```

Copy

```
openssl rand -base64 32
.env
RegenerateCopy
CORSAIR_KEK="+NxozCRwGik3S6Th0HoU03+t0eUOfIKf1dxwIn/tkJA="

```

.env

```
CORSAIR_KEK=your-generated-kek
CORSAIR_API_KEY=ck_dev_...
CORSAIR_SIGNING_SECRET=...
APP_URL=http://localhost:3000

```

**Keep your KEK safe. Lose it and you lose access to every stored credential. Treat it like a root password.**

3

**[](https://docs.corsair.dev/getting-started/quick-start#create-the-database)**

## Create the database

Corsair stores data in four tables. SQLite is the fastest way to start:
npm

yarnpnpmbun

```
npm install better-sqlite3

```

View migration SQL

```


```

* macOS / Linux
* Windows (PowerShell)

```
sqlite3 corsair.db < migration.sql

```

Using Postgres, Drizzle, or Prisma instead? See [Database](https://docs.corsair.dev/concepts/database) for each option.

4

**[](https://docs.corsair.dev/getting-started/quick-start#configure-corsair)**

## Configure Corsair

Wire your database, KEK, and Hub keys together in src/server/corsair.ts:
src/server/corsair.ts

```
import 'dotenv/config';
import Database from 'better-sqlite3';
import { createCorsair } from 'corsair';
import { github } from '@corsair-dev/github';

const db = new Database('corsair.db');

export const corsair = createCorsair({
    plugins: [github({ authType: 'managed' })],
    database: db,
    kek: process.env.CORSAIR_KEK!,
    hub: {
        projectApiKey: process.env.CORSAIR_API_KEY!,
        signingSecret: process.env.CORSAIR_SIGNING_SECRET!,
    },
});

```

Mount the handler once — it serves Hub delivery and the management API. In development, Hub auto-detects your localhost delivery URL:
app/api/corsair/[[...path]]/route.ts

```
import { toNextJsHandler } from 'corsair';
import { corsair } from '@/server/corsair';

export const { GET, POST, OPTIONS } = toNextJsHandler(corsair, {
    basePath: '/api/corsair',
});

```

Add more plugins later — slack(), linear(), gmail() — by appending to the array.

5

**[](https://docs.corsair.dev/getting-started/quick-start#connect-and-call)**

## Connect and call

Mint a connect link and send the user to it. Hub hosts the connect page and delivers the result back to your app — no connect page or OAuth callback to build:
connect.ts

```
const { connectUrl } = await corsair.manage.connect.createLink({
    plugin: 'github',
    tenantId: 'acme',
});
// redirect the user's browser to connectUrl

```

Once connected, call any endpoint. Responses are also cached in your database for instant reads:
usage.ts

```
const repos = await corsair.github.api.repositories.list({});

```

Want an agent to call endpoints on its own? See [MCP Adapters](https://docs.corsair.dev/mcp-adapters/mcp-adapters).

# Setup

## Initialize Corsair with the CLI or setupCorsair — integrations, accounts, and tenants.

Initialize database rows, DEKs, and credentials. Same logic in the CLI and setupCorsair.

**[](https://docs.corsair.dev/getting-started/setup#prerequisites)**

## Prerequisites

Install, migrate, and set CORSAIR_KEK — [Quick start](https://docs.corsair.dev/getting-started/quick-start).
corsair.ts

```
import 'dotenv/config';
import { createCorsair } from 'corsair';
import { slack, linear, gmail } from 'corsair';
import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

export const corsair = createCorsair({
    plugins: [slack(), linear(), gmail()],
    database: db,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: false, // true for per-user credentials
});

```

**[](https://docs.corsair.dev/getting-started/setup#data-model)**

## Data model

```
corsair_integrations   ← one row per plugin in createCorsair({ plugins })
corsair_accounts       ← one row per (tenant, plugin with authType)

```

|  |
| - |

| Layer       | Table                | Scope          | Fields                                           |
| ----------- | -------------------- | -------------- | ------------------------------------------------ |
| Integration | corsair_integrations | Shared         | OAuth: client_id, client_secret, redirect_url |
| Account     | corsair_accounts     | Per tenant     | API keys, tokens, refresh tokens                 |
| Tenant      | (no table)           | Your ID string | Materializes when account rows exist             |

Account rows are only created for plugins with authType (api_key, oauth_2, bot_token).

**[](https://docs.corsair.dev/getting-started/setup#setupcorsair)**

## setupCorsair

```
import { setupCorsair } from 'corsair';
import { corsair } from './corsair';

// Single-tenant → provisions "default"
await setupCorsair(corsair);

// Multi-tenant → provision a tenant
await setupCorsair(corsair, { tenantId: 'workspace_123' });

// Credentials + backfill
await setupCorsair(corsair, {
    tenantId: 'workspace_123',
    credentials: { linear: { api_key: process.env.LINEAR_KEY! } },
    backfill: true,
});

```

Returns a log string. Idempotent — skips existing rows.

**[](https://docs.corsair.dev/getting-started/setup#cli)**

## CLI

```
# Single-tenant
pnpm corsair setup
pnpm corsair setup --slack api_key=xoxb-... --linear api_key=lin_api_...

# Multi-tenant
pnpm corsair setup --tenant=workspace_123
pnpm corsair setup --tenant=workspace_123 --linear api_key=lin_api_...

# OAuth app creds (integration-level) — no --tenant on multi-tenant
pnpm corsair setup --gmail client_id=... client_secret=...
pnpm corsair auth --plugin=gmail
pnpm corsair auth --plugin=gmail --tenant=workspace_123

```

|  |
| - |

| Flag                            |                                                                        |
| ------------------------------- | ---------------------------------------------------------------------- |
| --tenant<id></id>               | Account rows + account credentials                                     |
| --<plugin></plugin> field=value | Inline credentials                                                     |
| --backfill                      | Seed data (setup/backfill.config.ts); needs --tenant on multi-tenant |

**[](https://docs.corsair.dev/getting-started/setup#credentials)**

## Credentials

Integration-level (shared, OAuth only):

```
pnpm corsair setup --gmail client_id=... client_secret=...

```

```
await corsair.keys.gmail.set_client_id('...');
await corsair.keys.gmail.set_client_secret('...');

```

Account-level (per tenant — all api_key / bot_token fields, OAuth tokens):

```
# single-tenant
pnpm corsair setup --linear api_key=lin_api_...

# multi-tenant
pnpm corsair setup --tenant=user_abc --linear api_key=lin_api_...

```

```
// multi-tenant
await corsair.withTenant('user_abc').linear.keys.set_api_key('lin_api_...');

// single-tenant
await corsair.linear.keys.set_api_key('lin_api_...');

```

Multi-tenant: integration fields + tenantId in setupCorsair({ credentials }) throws. Run integration setup without tenantId.

**[](https://docs.corsair.dev/getting-started/setup#multi-tenant)**

## Multi-tenant

corsair.ts

```
export const corsair = createCorsair({
    multiTenancy: true,
    plugins: [github(), linear()],
    database: db,
    kek: process.env.CORSAIR_KEK!,
});

```

|  |
| - |

|                                       | --tenant / tenantId |
| ------------------------------------- | --------------------- |
| Integration rows + OAuth app creds    | Omit                  |
| Account rows, account creds, backfill | Required              |

# integration only

```
pnpm corsair setup --gmail client_id=... client_secret=...

# tenant provisioning
pnpm corsair setup --tenant=workspace_123

```

All runtime calls: corsair.withTenant(id). See [Multi-tenancy](https://docs.corsair.dev/concepts/multi-tenancy).

**[](https://docs.corsair.dev/getting-started/setup#oauth)**

## OAuth

Setup does not run OAuth. After integration creds are set:

```
pnpm corsair auth --plugin=gmail
pnpm corsair auth --plugin=gmail --tenant=workspace_123

```

Or in app code: [OAuth process](https://docs.corsair.dev/production/oauth-process).
processOAuthCallback creates the account row lazily if missing. keys.set_*() does not — run setup first for API keys.

**[](https://docs.corsair.dev/getting-started/setup#management-api)**

## Management API

```
// Does NOT create account rows
await corsair.manage.tenants.create({ id: 'workspace_123' });

```

Use setupCorsair or the CLI to provision. Production flow: [Tenant provisioning](https://docs.corsair.dev/production/tenant-provisioning).

# Integrations

## Add as many as you want — same syntax, same patterns.

Corsair supports hundreds of integrations through its SDK. Add as many as you need and interact with them all using the same consistent syntax.
corsair.ts

```
import { createCorsair } from "corsair";
import { slack, linear } from "corsair/plugins";

export const corsair = createCorsair({
    plugins: [
        slack({
            authType: "api_key",
            credentials: { botToken: "xoxb-..." },
        }),
        linear({
            authType: "api_key",
            credentials: { apiKey: "lin_..." },
        }),
    ],
});

```

**[](https://docs.corsair.dev/concepts/integrations#consistent-syntax)**

## Consistent Syntax

Every integration uses the exact same patterns. No need to learn each SDK’s unique quirks.
example.ts

```
// Slack
await corsair.slack.api.messages.post({
    channel: "C01234567",
    text: "Hello from Slack!",
});

// Linear
await corsair.linear.api.issues.create({
    title: "New feature request",
    teamId: "TEAM_123",
});

// Same structure: corsair.[integration].api.[resource].[action]()

```

**[](https://docs.corsair.dev/concepts/integrations#strong-typing-everywhere)**

## Strong Typing Everywhere

Every integration is fully typed. Your editor shows available methods, required parameters, and response shapes.
example.ts

```
// TypeScript knows all available endpoints
corsair.slack.api.channels.create({ name: "engineering" });
corsair.slack.api.channels.archive({ channel: "C01234567" });
corsair.slack.api.messages.post({ channel: "C01", text: "Hi" });

// And all response types
const channel = await corsair.slack.api.channels.get({ channel: "C01" });
console.log(channel.name, channel.is_member, channel.num_members);

```

**[](https://docs.corsair.dev/concepts/integrations#no-database-bloat)**

## No Database Bloat

Adding more integrations doesn’t add more tables. Corsair always uses the same four tables, no matter how many integrations you have.

```
plugins: [
    slack({ ... }),
    linear({ ... }),
    github({ ... }),
    gmail({ ... }),
    // 100 more integrations — still just 4 tables
]

```

**[](https://docs.corsair.dev/concepts/integrations#adding-integrations)**

## Adding Integrations

Just add plugins to the array. Each integration is configured independently.
corsair.ts

```
export const corsair = createCorsair({
    plugins: [
        slack({
            authType: "api_key",
            credentials: { botToken: process.env.SLACK_BOT_TOKEN },
        }),
        linear({
            authType: "api_key",
            credentials: { apiKey: process.env.LINEAR_API_KEY },
        }),
    ],
});

```

**[](https://docs.corsair.dev/concepts/integrations#custom-integrations)**

## Custom Integrations

Need an integration that doesn’t exist? Creating a custom one takes less than 10 minutes.
See the [Creating Custom Integrations](https://docs.corsair.dev/guides/create-your-own-plugin) guide for a step-by-step walkthrough.
**[](https://docs.corsair.dev/concepts/integrations#missing-an-endpoint)**

## Missing an Endpoint?

If an existing integration is missing an endpoint you need, [create an issue](https://github.com/corsair/corsair/issues) and we’ll add it ASAP.
**[](https://docs.corsair.dev/concepts/integrations#available-integrations)**

## Available Integrations

Corsair supports integrations including:

* Slack — channels, messages, users, reactions, files
* Linear — issues, projects, comments, teams
* GitHub — repositories, issues, pull requests, actions
* Gmail — messages, threads, labels, drafts

https://github.com/corsairdev/corsair/tree/main/packages

# Webhooks

## One endpoint for all webhooks, automatically routed and verified.

Corsair consolidates all incoming webhooks to a single URL. It identifies which integration and service each webhook belongs to, then processes and updates your data automatically.
webhook-handler.ts

```
import { processWebhook } from "corsair";
import { corsair } from "./corsair";

export async function handleWebhook(req: Request) {
	const url = new URL(req.url);

    const result = await processWebhook(
        corsair, // corsair instance
        Object.fromEntries(req.headers), // headers
        await req.json(), // body
        {
            tenantId: url.searchParams.get('tenantId') // tenant id
        }
    );

    if (result.plugin) {
        console.log(`Handled by ${result.plugin}.${result.action}`);
    }

    return result.response;
}

```

Note that webhooks are not guaranteed by most senders. If your project requires completely fresh data, add polling for that integration using an [api call](https://docs.corsair.dev/concepts/api).
**[](https://docs.corsair.dev/concepts/webhooks#automatic-routing)**

## Automatic Routing

Point all your webhooks to a single endpoint. Corsair inspects the headers and payload to determine:

1. Which integration the webhook is from (Slack, Linear, etc.)
2. Which event type it represents (message, issue created, etc.)
3. Which tenant it belongs to (in multi-tenant setups)
   **[](https://docs.corsair.dev/concepts/webhooks#handling-out-of-order-webhooks)**

## Handling Out-of-Order Webhooks

Webhooks don’t guarantee delivery order. You might receive an “updated” event before you’ve processed the “created” event.
Most applications fail here — they don’t know about a record, so they can’t process its update.
Corsair solves this automatically:

1. Detects when an update arrives for an unknown record
2. Fetches the latest data from the API
3. Creates the record in your database
4. Processes both the create and update
   Your data stays fresh, and no webhooks are lost.
   **[](https://docs.corsair.dev/concepts/webhooks#multi-tenancy-with-webhooks)**

## Multi-Tenancy with Webhooks

If you have multi-tenancy enabled, we recommend adding a hashed tenant ID as a query parameter to your webhook URL.

It is recommended you hash the tenant id in the query param so your internal IDs are not publicly known.

```
https://api.yourapp.com/webhooks?tenant=hashed_tenant_id

```

This lets Corsair identify which tenant incoming webhook data belongs to, ensuring proper isolation.
**[](https://docs.corsair.dev/concepts/webhooks#signature-verification)**

## Signature Verification

Corsair automatically verifies webhook signatures using your stored webhook credentials. If a signature doesn’t match, the webhook is rejected — protecting you from spoofed requests.
**[](https://docs.corsair.dev/concepts/webhooks#webhook-hooks)**

## Webhook Hooks

Hooks let you add custom logic that runs every time a webhook is processed. This guarantees your code executes — even when Corsair handles the database update automatically.
corsair.ts

```
slack({
    authType: "api_key",
    credentials: { botToken: "xoxb-..." },
    webhookHooks: {
        messages: {
            message: {
                before: async (ctx, payload) => {
                    console.log("Incoming message from:", payload.user);
                    return { ctx, payload };
                },
                after: async (ctx, result) => {
                    // This always runs after the webhook is processed
                    await analytics.track("message_received", {
                        channel: result.channel,
                    });
                },
            },
        },
    },
})

```

**[](https://docs.corsair.dev/concepts/webhooks#before-hooks)**

## Before Hooks

Before hooks run before the webhook is processed. Use them to:

* Validate the payload
* Log incoming webhooks
* Modify the payload before processing
* Skip processing by throwing an error
  Return { ctx, args }, where args is what the handler receives (usually the same request body, optionally changed).
  corsair.ts

```
webhookHooks: {
    messages: {
        message: {
            before: async (ctx, request) => {
                if (yourAppShouldSkipThis(request)) {
                    return { ctx, args: request, continue: false };
                }
                return { ctx, args: request };
            },
        },
    },
}

```

Optional continue (defaults to true)
Set continue: false to stop without running the handler. That is a silent skip, which will not throw.
**[](https://docs.corsair.dev/concepts/webhooks#after-hooks)**

## After Hooks

After hooks run after the webhook is processed and the database is updated. Use them to:

* Trigger side effects (notifications, syncs)
* Update related records in your application
* Send data to external services
* Log processed webhooks
  corsair.ts

```
webhookHooks: {
    channels: {
        created: {
            after: async (ctx, result) => {
                // Notify your team when a new channel is created
                await sendNotification({
                    title: "New Slack channel",
                    body: `#${result.name} was created`,
                });
            },
        },
    },
    reactions: {
        added: {
            after: async (ctx, result) => {
                // Track reactions for analytics
                await analytics.track("reaction_added", {
                    reaction: result.reaction,
                    channel: result.channel,
                });
            },
        },
    },
}

```

**[](https://docs.corsair.dev/concepts/webhooks#the-passtoafter-argument)**

## The passToAfter Argument

You can set passToAfter on the object returned from before. Corsair passes that value through as the third argument to after, unchanged.
This is useful when you need to carry a value you only know at before-time — such as an ID you generate or a record you create — into the after hook, where you finalize or clean it up once processing is complete.

The after hook only runs when the webhook handler succeeds. If processing fails, after is skipped and passToAfter is never used.
corsair.ts

```
googleCalendar({
    webhookHooks: {
        onEventChanged: {
            before: async (ctx, request) => {
                const event = await db.events.create({
                    name: "Google Calendar Event",
                    status: "processing",
                })
                return { ctx, args: request, passToAfter: event.id };
            },
            after: async (ctx, result, passToAfter) => {
                const event = await db.events.update(passToAfter, {
                    name: "Google Calendar Event",
                    status: "successful",
                })
            },
        },
    },
})

```

**[](https://docs.corsair.dev/concepts/webhooks#guaranteed-execution)**

## Guaranteed Execution

The key benefit of webhook hooks is they always run when that webhook type is processed. Unlike manually handling webhooks where you might forget to add logging or notifications, hooks ensure your logic is centralized and guaranteed to execute.
corsair.ts

```
webhookHooks: {
    issues: {
        update: {
            after: async (ctx, result) => {
                // This ALWAYS runs when a Linear issue is updated
                // No matter where the webhook comes from
                await syncToYourDatabase(result);
                await notifyAssignee(result);
                await updateProjectMetrics(result);
            },
        },
    },
}

```

See [Hooks](https://docs.corsair.dev/concepts/hooks) for the full hooks documentation.

# API

## Corsair API.

When you create a Corsair instance, every plugin exposes its API endpoints through a nested, intuitive structure. Each plugin’s API is accessible directly on the Corsair instance.
corsair.ts

```
import { createCorsair } from "corsair";
import
```

```
 { slack, linear } from "corsair/plugins";

```

```

export const
```

```
 corsair = createCorsair({

```

```
    plugins: [
        slack({ authType: "api_key", credentials: { botToken: "xoxb-..." } }),
        linear({ authType: "api_key", credentials: { apiKey: "lin_..." } }),
    ],
});

// Send a message to Slack
```

```


```

```
await
```

```
 corsair.slack.api.messages.post({

```

```
    channel: "C01234567",
    text:
```

```
 "Hello from Corsair!",

```

```
});

// Create a Linear issue
await corsair.linear.api.issues.create({
    title: "New feature request",
    teamId: "TEAM_123",
});

```

**[](https://docs.corsair.dev/concepts/api#api-structure)**

## API Structure

All plugins follow the same pattern: corsair.[plugin].api.[resource].[action]().
example.ts

```
// Slack examples
corsair.slack.api.channels.create({ name: "engineering" });
corsair.slack.api.channels.
```

```
list({ limit: 50 });

```

```
corsair.slack.api.messages.post({ channel: "C01", text: "Hello" });
corsair.slack.api.messages.delete({ channel: "C01", ts: "123.456" });
corsair.slack.api.users.
```

```
get({ user: "U01234567" });

```

```

// Linear examples
corsair.linear.api.issues.create({ title: "Bug", teamId: "T1" });
corsair.linear.api.issues.update({ id: "ISS-1", input: { title: "Fixed" } });
corsair.linear.api.projects.
```

```
list({ first: 10 });

```

```
corsair.linear.api.comments.
```

```
create({ issueId: "ISS-1", body: "Done!" });

```

**[](https://docs.corsair.dev/concepts/api#strongly-typed)**

## Strongly Typed

Every API call is fully typed — both request parameters and responses. Your editor shows exactly what’s required and what you’ll get back.
example.ts

```
// TypeScript knows exactly what parameters are available
const
```

```
 channel = await corsair.slack.api.channels.create({

```

```
    name: "engineering",
    is_private: true,  // optional — TypeScript tells you
});

// Response is also strongly typed
```

```


```

```
console.
```

```
log(channel.id, channel.name, channel.is_member);

```

**[](https://docs.corsair.dev/concepts/api#with-multi-tenancy)**

## With Multi-Tenancy

When multi-tenancy is enabled, use withTenant() to scope operations.
example.ts

```
const tenant = corsair.withTenant("tenant_abc123");

await tenant.slack.api.messages.post({
    channel:
```

```
 "C01234567",

```

```
    text:
```

```
 "Scoped to tenant_abc123",

```

```
});

```

See [Multi-Tenancy](https://docs.corsair.dev/concepts/multi-tenancy) for details.
**[](https://docs.corsair.dev/concepts/api#automatic-persistence)**

## Automatic Persistence

API responses are stored in your database automatically. Create foreign key relationships to Corsair resources — they stay in sync through API calls and webhooks.
example.ts

```
// Create a channel — Corsair stores it
const channel = await corsair.slack.api.channels.create({ name: "support" });

// Later, retrieve from the database
```

```


```

```
const
```

```
 stored = await corsair.slack.db.channels.findByResourceId(channel.id);

```

See [Database](https://docs.corsair.dev/concepts/database) for the full ORM API.
See [Database](https://docs.corsair.dev/concepts/database) for the full ORM API.
**[](https://docs.corsair.dev/concepts/api#hooks)**

## Hooks

Add before/after hooks to customize API behavior.
corsair.ts
corsair.ts

```
slack({
    authType:
```

```
 "api_key",

```

```
    credentials: { botToken:
```

```
 "xoxb-..." },

```

```
    hooks: {
        channels: {
            create: {
                before: (ctx, args) => {
                    console.
```

```
log("Creating channel:", args.name);

```

```
                    return
```

```
 { ctx, args };

```

```
                },
                after
```

```
: (ctx, result) => {

```

```
                    console.log("Created:", result.id);
                },
            },
        },
    },
})

```
