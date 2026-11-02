---
title: "Transfer Protocol"
description: "How Echo talks to its server: transport, authentication, and every endpoint it calls."
weight: 20
aliases:
  - /docs/http_protocol.html
---

How Echo talks to its server: transport, authentication, and every endpoint it calls.

## Transport and envelope

- Base URL: `https://echovault.gg`
- All requests use `System.Net.Http.HttpClient` over HTTPS.
- Headers `User-Agent` or  `Accept-Encoding` are never sent in requests.
- Request/response bodies are JSON, serialized using `System.Text.Json`
  with camelCase property names.
- Any property whose value is `null` is **omitted entirely** from the JSON.
- All 64-bit unsigned integers are serialized as JSON **strings**, not numbers.
- Timestamps are ISO-8601 UTC using full 7-digit fractional seconds and an explicit
  numeric UTC offset, e.g. `2026-08-09T12:00:00.1234567+00:00`.

## Endpoint index

Method | Path | Auth | Purpose
--- | --- | --- | ---
GET | `/v1/config` | none | Fetch server-controlled settings.
POST | `/v1/auth/register` | none | Mint a new installation identity.
POST | `/v1/auth/session` | signed | Get a short-lived session token.
POST | `/v1/ingest` | signed + session | Upload a batch of player sightings.
POST | `/v1/scan-targets` | signed | Get which zones are least-covered.
POST | `/v1/scanner/stats` | signed | The contributing user's own stats.
POST | `/v1/claims/link/start` | signed | Claim a character's profile page.
POST | `/v1/auth/verify/start` | signed | Begin the contributor verification.
POST | `/v1/auth/verify/complete` | signed | Complete the contributor verification.
POST | `/v1/appeals` | signed + session | Submit an appeal to EchoVault.

## Request signing (HMAC)

Every authenticated request is signed.

1. The JSON body is serialized and UTF-8 encoded.

2. A canonical string is built (`HmacSigner.Canonical`)

```text
{METHOD}\n{path}\n{sha256_hex(body)}\n{unix_timestamp}\n{nonce}
```

3. The client computes HMAC-SHA256 of that string using the base64-decoded
   `hmacSecret` (issued at registration and stored locally) and hex-encoded.
   The server would redo the same computation and compare.

4. The following headers are attached to the request (`EchoHeaders`):

Header | Contents
--- | ---
`X-Echo-KeyId` | The installation's `uploaderId`, issued at registration.
`X-Echo-Timestamp` | Unix timestamp (seconds) at send time.
`X-Echo-Nonce` | 16 random bytes, hex-encoded (`HmacSigner.NewNonce`).
`X-Echo-Signature` | HMAC-SHA256 of the canonical string above, hex-encoded.
`X-Echo-Session` | The current session token, **when one is required for the endpoint**.

### Example (python)

```Python
import base64
import hashlib
import hmac
import time
import uuid

method = "POST"
path = "/v1/auth/verify/start"
body = payload
timestamp = str(int(time.time()))
nonce = uuid.uuid4().hex

payload_hash = hashlib.sha256(body.encode()).hexdigest()
canonical_string = "\n".join([method, path, payload_hash, timestamp, nonce])

secret = base64.b64decode(hmac_secret)
signature = hmac.new(secret, canonical_string.encode(), hashlib.sha256).hexdigest()
```

## Endpoint `/v1/config`

No authentication. Polled once at startup and then every 15 minutes.

```json
{
  "minPluginVersion": string,
  "captureCadenceSeconds": int,
  "ingestEnabled": bool,
  "minEmitIntervalSeconds": int = 10,
  "socialCadenceSeconds": int = 900
}
```

### Example

```http
GET /v1/config HTTP/1.1
Host: echovault.gg

HTTP/1.1 200 OK
Content-Type: application/json

{
   "minPluginVersion": "0.1.0",
   "captureCadenceSeconds": 30,
   "ingestEnabled": true,
   "minEmitIntervalSeconds": 10,
   "socialCadenceSeconds": 900
}
```

### HTTP status codes

| Status | Behavior |
|---|---|
| **200 OK** | Success. |
| **Any other** | Failure. |

## Endpoint `/v1/auth/register`

No authentication (issues the credentials used for everything after it).
Called once per character the first time **Echo** activates for it.

```json
{
  "protocolVersion": 2,
  "pluginVersion": "0.10.0"
}

{
  "uploaderId": string,
  "apiKey": string,
  "hmacSecret": string
}
```

### HTTP status codes

| Status | Behavior |
|---|---|
| **200 OK** | Success. |
| **Any other** | Failure. |

## Endpoint `/v1/auth/session`

**Signed**. Not session-bearing as it *produces* the session itself.
Called when no valid session is active (none or expired).

```json
{
  "protocolVersion": 2,
  "uploaderId": string,
  "apiKey": string
}

{
  "token": string,
  "expiresAt": ISO-8601 timestamp,
  "tier": string = "unverified"
}
```

### HTTP status codes

| Status | Behavior |
|---|---|
| **200 OK** | Success. |
| **401 Unauthorized** | Banned uploader. Deletes `keys.bin` as of `0.8.2`. |
| **429 Too Many Requests** | Failure. |
| **Any other** | Failure. |

## Endpoint `/v1/ingest`

**Signed**. This is the endpoint that uploads captured player "sightings".

```json
{
  "protocolVersion": 2,
  "pluginVersion": "0.10.0",
  "reporter": ReporterSelf,
  "sightings": [ Sighting, ... up to 200 ],
  "autoSearchEnabled": bool
}
```

`reporter` is the **uploading player's own** current zone and exact coordinates
attached to every single batch and every individual `sweep` sighting within it.
this is possibly a geometric check against each sighting's own position.

```json
{ "territoryId": ushort, "x": float, "y": float, "z": float }
```
### Example singtings from a `sweep` source

The sighting array can have between 1 to 200 entries from different sources.
Simplified example from the usual "nearby" scoping:

```http
POST /v1/ingest HTTP/1.1
Host: echovault.gg
Content-Type: application/json; charset=utf-8
X-Echo-KeyId: <uploaderId>
X-Echo-Timestamp: <unix-timestamp>
X-Echo-Nonce: <random-32-hex-nonce>
X-Echo-Signature: <hmac-sha256-hex-signature>
X-Echo-Session: <sessionToken>

{
    "protocolVersion": 2,
    "pluginVersion": "0.10.0",
    "reporter": { "territoryId": 401, "x": 12.4, "y": 8.0, "z": -33.7 },
    "sightings": [
        {
            "contentId": "18014398519480000",
            "name": "Y'shtola Rhul",
            "homeWorldId": 63,
            "currentWorldId": 63,
            "territoryId": 401,
            "x": 11.8,
            "y": 8.0,
            "z": -34.9,
            "jobId": 26,
            "level": 100,
            "fcTag": "SCION",
            "customizeBase64": "EBESExQVFhcYGRobHB0eHw==",
            "seenAtUtc": "2026-08-06T13:43:04.5884505+00:00",
            "source": "sweep",
            "accountId": "6603847221955",
            "titleId": 12,
            "grandCompany": 0,
            "equipment": [
                { "id": 31150, "variant": 2, "stain0": 30, "stain1": 0 },
                { "id": 31151, "variant": 2, "stain0": 30, "stain1": 0 },
                { "id": 31152, "variant": 2, "stain0": 30, "stain1": 0 },
                { "id": 31153, "variant": 2, "stain0": 30, "stain1": 0 },
                { "id": 31154, "variant": 2, "stain0": 30, "stain1": 0 },
                { "id": 9012, "variant": 0, "stain0": 0, "stain1": 0 },
                { "id": 9013, "variant": 0, "stain0": 0, "stain1": 0 },
                { "id": 9014, "variant": 0, "stain0": 0, "stain1": 0 },
                { "id": 9015, "variant": 0, "stain0": 0, "stain1": 0 },
                { "id": 9016, "variant": 0, "stain0": 0, "stain1": 0 }
            ],
            "mainhandModel": 3300201,
            "offhandModel": 3300202,
            "homeWorldName": "Balmung",
            "reporter": { "territoryId": 401, "x": 12.1, "y": 8.0, "z": -34.1 },
            "mountId": 0,
            "onlineStatusId": 47,
            "dutyId": 0,
            "isOnline": true,
            "minionId": 0,
            "facewearId": 0,
            "fashionAccessoryId": 24
        }
    ],
    "autoSearchEnabled": false
}

HTTP/1.1 200 OK
Content-Type: application/json

{ "accepted": 1 }
```

### HTTP status codes

| Status | Behavior |
|---|---|
| **200 OK** | Success. Batch size goes back up toward the 200 cap. |
| **400 Bad Request** | `invalid_batch` is a failure. Others halve the batch. |
| **401 Unauthorized** | Session token expired, use `/v1/auth/session` again. |
| **413 Payload Too Large** | Halve the batch and retry. |
| **429 Too Many Requests** | 2-minute delay "Server busy, uploads queued". |
| **Any other** | Exponential backoff (1 / 5 / 15 / 60 minutes). |

### Batch-halving and sighting drops

`0.9.0` made the outbox drain adaptive trying to slow down poisoning attempts.
A *sighting-level refusal* of `HTTP 413`, or `HTTP 400` with any `error` code
other than `invalid_batch` makes the client **halve** the batch and retry the
front of the queue. A success will **double** it back up toward the cap limit.

```python
import time
MAX_BATCH = 200

batch = queue[:batch_size]
status, error_code = send(batch)

if 200 <= status < 300:
    # accepted: drop the sent batch, grow
    queue = queue[len(batch):]
    batch_size, refusals = min(MAX_BATCH, batch_size * 2), 0
elif status == 429:
    # RecordBusy: fixed 2-minute pause
    refusals = 0
    time.sleep(120)
elif status == 413 or (status == 400 and error_code != "invalid_batch"):
    if len(batch) > 1:
        # split the batch, retry the front
        batch_size, refusals = max(1, len(batch) // 2), 0
    elif refusals + 1 >= 2:
        # single sighting refused twice, drop it
        queue, refusals = queue[1:], 0
    else:
        # refused once: keep it, try again
        refusals += 1
    # RecordRefused: fixed 1-minute pause
    time.sleep(60)
else:
    # invalid_batch: persistent failure clogs until eviction
    # other: same batch retried
    refusals = 0
    time.sleep(60)
```

Looping that until `queue` is empty produces the following:

```text
sent              resp   outcome                            queue after
[s0,s1,s2,s3,s4]  400    halve to 2, wait 1 min             [s0,s1,s2,s3,s4]
[s0,s1]           200    commit, grow to 4                  [s2,s3,s4]
[s2,s3,s4]        400    halve to 1, wait 1 min             [s2,s3,s4]
[s2]              400    refusal #1, wait 1 min             [s2,s3,s4]
[s2]              400    refusal #2 -> drop s2, wait 1 min  [s3,s4]
[s3]              200    commit, grow to 2                  [s4]
[s4]              200    commit, grow to 4                  []
```

## Endpoint `/v1/scan-targets`

**Signed**. Part of the gamification system so users know what locations need to be
scoped for a coverage score bonus.

```json
{
  "protocolVersion": 2,
  "worldId": uint,
  "targetsRevision": 1
}

{
  "generatedAt": ISO-8601 timestamp,
  "worldId": int,
  "targetsRevision": int,
  "targets": [
    {
      "territoryId": int,
      "newPlayers7d": int,
      "lastSweptHoursAgo": int|null,
      "sightings7d": int
    },
    ...
  ],
  "dcWorlds": [
    {
      "worldId": int, "indexed": int,
      "estimatedPopulation": int|null,
      "completenessPct": double|null,
      "noveltyPct": double|null
    },
    ...
  ]
}
```

## Endpoint `/v1/claims/link/start`

**Signed**. Triggered by the `/echovault link` command or the "Settings" tab.

```json
{
  "protocolVersion": 2,
  "contentId": string(ulong),
  "characterName": string,
  "homeWorldId": uint
}

{
  "code": string,
  "expiresAt": ISO-8601 timestamp
}
```

The code is meant to be entered at `echovault.gg/me` to claim ownership of that
character's public profile page and manage its privacy settings on the site.

## Endpoint `/v1/auth/verify/start`

**Signed**. Mints a Lodestone code to begin the verification process to become a
verified contributor (stalker).

```json
{
  "protocolVersion": 2,
  "lodestoneId": string,
  "characterName": string,
  "homeWorldName": string,
  "contentId": string(ulong)
}

{ "code": string }
```

### Example verification with the `HTTP 409` exploit

```http
POST /v1/auth/verify/start HTTP/1.1
Host: echovault.gg
X-Echo-KeyId: f3506e73-b651-4843-9866-3a32b67a6d1c
X-Echo-Timestamp: 1789754558
X-Echo-Nonce: 843450b149a44fc2ab11c5507b513e86
X-Echo-Signature: 3941c6c4840e5b662a3ce9063ba8355a48df173780e4265344ab116e7cdc7b4a
Content-Type: application/json; charset=utf-8
Content-Length: 131

{
    "protocolVersion": 2,
    "lodestoneId": "10431569",
    "characterName": "Muwu Achuu",
    "homeWorldName": "Siren",
    "contentId": "18014498548329694"
}

HTTP/1.1 409 Conflict
Date: Fri, 18 Sep 2026 18:02:38 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Server: cloudflare

{
    "error": "already_claimed"
}
```

### HTTP status codes

| Status | Behavior |
|---|---|
| **200 OK** | Success. Lodestone code in the response. |
| **429 Too Many Requests** | Rate-limited. |
| **Any other** | Failure. Error codes in the reponse will hint why. |

## Endpoint `/v1/auth/verify/complete`

**Signed**. EchoVault will parse the public Lodestone profile to complete the
verification process started above.

```json
{ "protocolVersion": 2 }

{ "verified": bool, "reason": string | null }
```

### HTTP status codes

| Status | Behavior |
|---|---|
| **200 OK** | The "verified" response will confirm if it's a success or failure. |
| **429 Too Many Requests** | Rate-limited. |
| **Any other** | Failure. Error codes in the reponse will hint why. |
