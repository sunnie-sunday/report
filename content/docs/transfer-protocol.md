---
title: "Transfer Protocol"
description: "How Echo talks to its server: transport, authentication, and every endpoint it calls."
weight: 20
aliases:
  - /docs/http_protocol.html
---

How Echo talks to its server: transport, authentication, and every endpoint it calls.

Transport and envelope
----------------------

- Base URL: `https://echovault.gg`
- All requests use `System.Net.Http.HttpClient` over HTTPS.
- Headers `User-Agent` or  `Accept-Encoding` are never sent in requests.
- Request/response bodies are JSON, serialized using `System.Text.Json`
  with camelCase property names.
- Any property whose value is `null` is **omitted entirely** from the JSON.
- All 64-bit unsigned integers are serialized as JSON **strings**, not numbers.
- Timestamps are ISO-8601 UTC using full 7-digit fractional seconds and an explicit
  numeric UTC offset, e.g. `2026-08-09T12:00:00.1234567+00:00`.

Endpoint index
--------------

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

Request signing (HMAC)
----------------------

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

C#
```C#
using System;
using System.Security.Cryptography;
using System.Text;

string method = "POST";
string path = "/auth/verify/start";
string body = payload;
string timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
string nonce = Guid.NewGuid().ToString("N");

byte[] bodyHash = SHA256.HashData(Encoding.UTF8.GetBytes(body));
string payloadHash = Convert.ToHexStringLower(bodyHash);

string canonicalString = string.Join("\n", method, path, payloadHash, timestamp, nonce);

byte[] secretBytes = Convert.FromBase64String(hmacSecret);
byte[] signatureBytes = HMACSHA256.HashData(secretBytes, Encoding.UTF8.GetBytes(canonicalString));
string signature = Convert.ToHexStringLower(signatureBytes);
```

JavaScript
```JavaScript
const method = "POST";
const path = "/auth/verify/start";
const body = payload;
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomUUID().replace(/-/g, "");

const bodyHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
const payloadHash = new Uint8Array(bodyHash).toHex();

const canonicalString = [method, path, payloadHash, timestamp, nonce].join("\n");

const secretBytes = Uint8Array.fromBase64(hmacSecret);
const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonicalString));
const signature = new Uint8Array(signatureBytes).toHex();
```

Python
```Python
import base64
import hashlib
import hmac
import time
import uuid

method = "POST"
path = "/auth/verify/start"
body = payload
timestamp = str(int(time.time()))
nonce = uuid.uuid4().hex

payload_hash = hashlib.sha256(body.encode()).hexdigest()
canonical_string = "\n".join([method, path, payload_hash, timestamp, nonce])

secret_bytes = base64.b64decode(hmac_secret)
signature = hmac.new(secret_bytes, canonical_string.encode(), hashlib.sha256).hexdigest()
```
