:og:description: This page covers how Echo talks to its server: transport, authentication, every endpoint it calls, and the memory-manipulation subsystem.

Transfer Protocol (HTTP)
========================

.. note::

   This page covers *how* Echo talks to its server: transport, authentication,
   every endpoint it calls, and the memory-manipulation subsystem that triggers
   *additional* network traffic on the game's own connection to Square Enix. For
   *what shape* the data itself takes, see :doc:`data_model`. No request on this
   page was ever actually sent to EchoVault.

.. _transport-and-envelope:

Transport and envelope
----------------------

- Base URL: ``https://echovault.gg``
- All requests use ``System.Net.Http.HttpClient`` over HTTPS.
- Headers ``User-Agent`` or  ``Accept-Encoding`` are never sent in requests.
- Request/response bodies are JSON, serialized using ``System.Text.Json``
  with camelCase property names.
- Any property whose value is ``null`` is **omitted entirely** from the JSON.
- All 64-bit unsigned integers are serialized as JSON **strings**, not numbers.
- Timestamps are ISO-8601 UTC using full 7-digit fractional seconds and an explicit
  numeric UTC offset, e.g. ``2026-08-09T12:00:00.1234567+00:00``.

Request signing (HMAC)
----------------------

Every authenticated request is signed.

1. The JSON body is serialized and UTF-8 encoded.

2. A canonical string is built (``HmacSigner.Canonical``)

   .. code-block:: text

      {METHOD}\n{path}\n{sha256_hex(body)}\n{unix_timestamp}\n{nonce}

3. The client computes HMAC-SHA256 of that string using the base64-decoded
   ``hmacSecret`` (issued at registration and stored locally) and hex-encoded.
   The server would redo the same computation and compare.

4. The following headers are attached to the request (``EchoHeaders``):

.. list-table::
   :widths: 25 75
   :header-rows: 1

   * - Header
     - Contents
   * - ``X-Echo-KeyId``
     - The installation's ``uploaderId``, issued at registration.
   * - ``X-Echo-Timestamp``
     - Unix timestamp (seconds) at send time.
   * - ``X-Echo-Nonce``
     - 16 random bytes, hex-encoded (``HmacSigner.NewNonce``).
   * - ``X-Echo-Signature``
     - HMAC-SHA256 of the canonical string above, hex-encoded.
   * - ``X-Echo-Session``
     - The current session token, **when one is required for the endpoint**.

Example
~~~~~~~

This example signs a ``POST /auth/verify/start`` request, assuming ``payload``
is already minified JSON text: it hashes the body, builds the canonical string,
and computes the HMAC-SHA256 signature.

.. code-block:: csharp
   :caption: C#

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

.. code-block:: javascript
   :caption: JavaScript

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

.. code-block:: python
   :caption: Python

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

Endpoint index
--------------

.. list-table::
   :widths: 10 25 15 50
   :header-rows: 1

   * - Method
     - Path
     - Auth
     - Purpose
   * - GET
     - ``/v1/config``
     - none
     - Fetch server-controlled capture cadence and a remote ingest kill-switch.
   * - POST
     - ``/v1/auth/register``
     - none
     - Mint a new installation identity (uploader ID, API key, HMAC secret).
   * - POST
     - ``/v1/auth/session``
     - signed
     - Exchange the stored API key for a short-lived session token and account tier.
   * - POST
     - ``/v1/ingest``
     - signed + session
     - Upload a batch of up to 200 captured player "sightings."
   * - POST
     - ``/v1/scan-targets``
     - signed
     - Ask the server which zones/worlds are least-covered, to steer the user there.
   * - POST
     - ``/v1/scanner/stats``
     - signed
     - Fetch the contributing user's own lifetime/weekly stats and percentile rank.
   * - POST
     - ``/v1/claims/link/start``
     - signed
     - Mint a short-lived code that claims a character's public profile page.
   * - POST
     - ``/v1/auth/verify/start``
     - signed
     - Begin linking the local character to a Lodestone (SE forum) profile.
   * - POST
     - ``/v1/auth/verify/complete``
     - signed
     - Complete Lodestone verification, unlocking unmoderated ("instant") uploads.
   * - POST
     - ``/v1/appeals``
     - signed + session
     - Submit an appeal against a server-side restriction on the uploader's account.

All endpoint paths are defined as literal strings inline in ``EchoApiClient``
Each endpoint's success response, and every failure status code or server-supplied
error string it can produce, is documented together below, endpoint by endpoint.

.. _endpoint-detail:

Endpoint detail
---------------

``GET /v1/config``
~~~~~~~~~~~~~~~~~~

No authentication. Polled once at startup and then every 15 minutes
(``DrainLoop.ConfigRefreshInterval``).

Response schema (``ConfigResponse``), see :doc:`data_model`:

.. code-block:: text

   {
     "minPluginVersion": string,
     "captureCadenceSeconds": int,
     "ingestEnabled": bool,
     "minEmitIntervalSeconds": int = 10,
     "socialCadenceSeconds": int = 900
   }

.. code-block:: http
   :caption: Request

   GET /v1/config HTTP/1.1
   Host: echovault.gg

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "minPluginVersion": "0.7.0",
       "captureCadenceSeconds": 30,
       "ingestEnabled": true,
       "minEmitIntervalSeconds": 10,
       "socialCadenceSeconds": 900
   }

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body parsed as ``ConfigResponse``.
   * - Any other
     - Failure; ``GetConfigAsync`` returns ``null``.

.. list-table:: Response codes
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - *(none)*
     - Failure body is never parsed; no error codes exist for this endpoint.

The server can remotely raise or lower how aggressively **every** installed copy of
Echo scans and re-reports the same character (``captureCadenceSeconds`` /
``minEmitIntervalSeconds``), and can disable all uploads globally by returning
``ingestEnabled: false``, or by requiring a ``minPluginVersion`` newer than the
client's own version — a remote kill-switch and throttle the operator controls,
entirely outside of anything a user or Square Enix can see or adjust.

``POST /v1/auth/register``
~~~~~~~~~~~~~~~~~~~~~~~~~~

No authentication (this endpoint issues the credentials used for everything after it).
Called once per character the first time Echo activates for it.

Request/response schema (``RegisterRequest`` / ``RegisterResponse``):

.. code-block:: text

   { "protocolVersion": 2, "pluginVersion": "0.8.3" }

   { "uploaderId": string, "apiKey": string, "hmacSecret": string }

.. code-block:: http
   :caption: Request

   POST /v1/auth/register HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8

   {
       "protocolVersion": 2,
       "pluginVersion": "0.8.3"
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "uploaderId": "<uploaderId>",
       "apiKey": "<apiKey>",
       "hmacSecret": "<hmacSecret-base64>"
   }

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body parsed as ``RegisterResponse``, credentials saved to
       ``keys.bin`` (see :ref:`local-storage` in :doc:`data_model`).
   * - Any other
     - Failure; ``EnsureRegisteredAsync`` returns ``false``; ``DrainLoop`` records
       ``"registration failed"``.

.. list-table:: Response codes
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - *(none)*
     - Failure body is never parsed; no error codes exist for this endpoint.

``POST /v1/auth/session``
~~~~~~~~~~~~~~~~~~~~~~~~~

Signed, not session-bearing (it *produces* the session). Called when no valid session
token is cached, or when the cached one expires within an hour.

Request/response schema (``SessionRequest`` / ``SessionResponse``):

.. code-block:: text

   { "protocolVersion": 2, "uploaderId": string, "apiKey": string }

   { "token": string, "expiresAt": ISO-8601 timestamp, "tier": string = "unverified" }

.. code-block:: http
   :caption: Request

   POST /v1/auth/session HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: <uploaderId>
   X-Echo-Timestamp: <unix-timestamp>
   X-Echo-Nonce: <random-32-hex-nonce>
   X-Echo-Signature: <hmac-sha256-hex-signature>

   {
       "protocolVersion": 2,
       "uploaderId": "<uploaderId>",
       "apiKey": "<apiKey>"
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "token": "<sessionToken>",
       "expiresAt": "2026-08-06T19:42:07.4193021+00:00",
       "tier": "unverified"
   }

``tier`` reflects server-side account standing (``"unverified"``, ``"standard"``,
``"trusted"``, ``"verified"``) and directly controls whether the client is treated as
``Registered`` or ``Verified`` in its own UI (``DrainLoop.RunAsync``).

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body parsed as ``SessionResponse``, session token cached.
   * - 401 Unauthorized
     - Body checked for the ``unknown_key`` code (see below); otherwise a generic
       failure.
   * - 429 Too Many Requests
     - **Not** specially handled here — treated as a generic failure. (Unlike
       ``/v1/auth/verify/start``/``/complete`` below, this endpoint only reads the
       body when the status is exactly 401, so 429 never reaches it.)
   * - Any other
     - Generic failure; ``EnsureSessionAsync`` returns ``false``; ``DrainLoop``
       records ``"session failed"``.

.. list-table:: Response codes (``ErrorResponse.error``, read only on a 401)
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - ``unknown_key``
     - Local ``keys.bin`` deleted (at most once per hour, ``KeyResetCooldown``);
       forces automatic re-registration on the next cycle. Added in plugin version
       ``0.8.1`` — earlier versions had no automatic recovery from this state.
   * - *(anything else, or none)*
     - Ordinary failure; no special handling.

``POST /v1/ingest``
~~~~~~~~~~~~~~~~~~~

Signed, requires ``X-Echo-Session``. This is the main data-exfiltration path, sent
whenever the local queue is non-empty and the server allows ingest — polled at least
every 10 seconds (``DrainLoop.IdleDelay``).

Request (``IngestBatch``):

.. code-block:: text

   {
     "protocolVersion": 2,
     "pluginVersion": "0.8.3",
     "reporter": ReporterSelf,
     "sightings": [ Sighting, ... up to 200 ],
     "autoSearchEnabled": bool
   }

``reporter`` (``ReporterSelf``) is the **uploading player's own** current zone and
exact coordinates, attached to every single batch:

.. code-block:: text

   { "territoryId": ushort, "x": float, "y": float, "z": float }

See :ref:`sighting-schema` in :doc:`data_model` for the ``Sighting`` schema, which is
the core payload of this endpoint, and the ``IngestBatch``/``Sighting`` C# code in
that page's type catalogue.

.. code-block:: http
   :caption: Request

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
       "pluginVersion": "0.8.3",
       "reporter": { "territoryId": 128, "x": 9.5, "y": 12.0, "z": -4.2 },
       "autoSearchEnabled": false,
       "sightings": [
           {
               "contentId": "<contentId>",
               "name": "<characterName>",
               "homeWorldId": 40,
               "currentWorldId": 40,
               "territoryId": 0,
               "x": 0,
               "y": 0,
               "z": 0,
               "jobId": 24,
               "level": 90,
               "homeWorldName": "<homeWorldName>",
               "seenAtUtc": "<seenAtUtc>",
               "source": "sweep",
               "titleId": 0,
               "grandCompany": 0,
               "mainhandModel": 0,
               "offhandModel": 0,
               "mountId": 0,
               "onlineStatusId": 0,
               "dutyId": 0,
               "isOnline": true
           }
       ]
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   { "accepted": 1 }

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; ``IngestResponse`` is never parsed.
   * - 401 Unauthorized
     - One silent retry: session token cleared, refreshed once via
       ``/v1/auth/session``, batch resent only once.
   * - 429 Too Many Requests
     - ``BackoffPolicy.RecordBusy``; fixed 2-minute delay;
   * - Any other
     - ``DrainLoop.Fail()``; exponential backoff (1 / 5 / 15 / 60 minutes).

.. list-table:: Response codes
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - *(none)*
     - Body is never parsed on success or failure; no error codes exist for this
       endpoint.

De-duplication and cadence control live in ``CaptureEngine``. a captured player
is only re-emitted if enough time has passed
(server-tunable ``cadence``/``floor``, from ``/v1/config``) *or* something changed
(a hash over name, world, job, level, FC tag, appearance bytes, title, gear, and duty).

``POST /v1/scan-targets``
~~~~~~~~~~~~~~~~~~~~~~~~~

Signed. Polled by the "Coverage" tab of the plugin's UI, cached client-side for 15
minutes.

Request/response schema (``ScanTargetsRequest`` / ``ScanTargetsResponse``):

.. code-block:: text

   { "protocolVersion": 2, "worldId": uint, "targetsRevision": 1 }

   {
     "generatedAt": ISO-8601 timestamp,
     "worldId": int,
     "targetsRevision": int,
     "targets": [
       { "territoryId": int, "newPlayers7d": int,
         "lastSweptHoursAgo": int|null, "sightings7d": int }, ...
     ],
     "dcWorlds": [
       { "worldId": int, "indexed": int, "estimatedPopulation": int|null,
         "completenessPct": double|null, "noveltyPct": double|null }, ...
     ]
   }

.. code-block:: http
   :caption: Request

   POST /v1/scan-targets HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: <uploaderId>
   X-Echo-Timestamp: <unix-timestamp>
   X-Echo-Nonce: <random-32-hex-nonce>
   X-Echo-Signature: <hmac-sha256-hex-signature>

   {
       "protocolVersion": 2,
       "worldId": 40,
       "targetsRevision": 1
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "generatedAt": "2026-08-06T12:00:00.0000000+00:00",
       "worldId": 40,
       "targetsRevision": 1,
       "targets": [
           { "territoryId": 128, "newPlayers7d": 340, "lastSweptHoursAgo": 2, "sightings7d": 5100 }
       ],
       "dcWorlds": [
           { "worldId": 40, "indexed": 15200, "estimatedPopulation": 42000, "completenessPct": 36.2, "noveltyPct": 4.1 }
       ]
   }

The server tells each installed copy of the plugin exactly which zones and which
worlds in the player's data center have the *least* surveillance coverage so far
(``noveltyPct`` / ``newPlayers7d``), and the plugin's Dashboard/Coverage UI actively
recommends the user travel there.

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body parsed as ``ScanTargetsResponse``.
   * - Any other
     - Failure; ``GetScanTargetsAsync`` returns ``null``; Coverage tab keeps
       showing "Checking..." or its last cached data.

.. list-table:: Response codes
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - *(none)*
     - Failure body is never parsed; no error codes exist for this endpoint.

``POST /v1/scanner/stats``
~~~~~~~~~~~~~~~~~~~~~~~~~~

Signed. Request/response schema (``ScannerStatsRequest`` / ``ScannerStatsResponse``);
drives the Dashboard/Progress tabs and the ``/echovault stats`` chat command:

.. code-block:: text

   { "protocolVersion": 2 }

   {
     "lifetimeSightings": long,
     "weekSightings": int,
     "weekStart": string,
     "bestWeek": { "weekStart": string, "count": int } | null,
     "charactersObserved": int,
     "charactersContributed": int,
     "territoriesCovered": int,
     "percentileBand": int | null,
     "computedAt": string
   }

.. code-block:: http
   :caption: Request

   POST /v1/scanner/stats HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: <uploaderId>
   X-Echo-Timestamp: <unix-timestamp>
   X-Echo-Nonce: <random-32-hex-nonce>
   X-Echo-Signature: <hmac-sha256-hex-signature>

   {
       "protocolVersion": 2
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "lifetimeSightings": 128744,
       "weekSightings": 3190,
       "weekStart": "2026-08-03",
       "bestWeek": { "weekStart": "2026-06-15", "count": 5210 },
       "charactersObserved": 4488,
       "charactersContributed": 812,
       "territoriesCovered": 47,
       "percentileBand": 12,
       "computedAt": "2026-08-06T12:00:00.0000000+00:00"
   }

This is purely about the *uploading* user's own contribution metrics.

.. note::

   The client does not call this endpoint on a fixed schedule. It's wrapped in a
   hardcoded 15-minute cache lifetime, and that cache is only checked when the
   Dashboard or Progress tab actually renders — so the effective behavior is "fetch
   immediately the first time the tab is opened, then re-fetch the next time the tab
   is drawn after 15 minutes have passed," not a background poll.

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body parsed as ``ScannerStatsResponse``.
   * - Any other
     - Failure; ``GetScannerStatsAsync`` returns ``null``; Dashboard/Progress tabs
       keep showing stale or empty data.

.. list-table:: Response codes
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - *(none)*
     - Failure body is never parsed; no error codes exist for this endpoint.

``POST /v1/claims/link/start``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Signed. Triggered by the in-game ``/echovault link`` command or the Settings tab's
"Get claim code" button.

Request/response schema (``LinkStartRequest`` / ``LinkStartResponse``):

.. code-block:: text

   { "protocolVersion": 2, "contentId": string(ulong), "characterName": string, "homeWorldId": uint }

   { "code": string, "expiresAt": ISO-8601 timestamp }

.. code-block:: http
   :caption: Request

   POST /v1/claims/link/start HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: <uploaderId>
   X-Echo-Timestamp: <unix-timestamp>
   X-Echo-Nonce: <random-32-hex-nonce>
   X-Echo-Signature: <hmac-sha256-hex-signature>

   {
       "protocolVersion": 2,
       "contentId": "<contentId>",
       "characterName": "<characterName>",
       "homeWorldId": 40
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "code": "<claimCode>",
       "expiresAt": "2026-08-06T12:10:00.0000000+00:00"
   }

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body parsed as ``LinkStartResponse``.
   * - Any other
     - Failure; body parsed as ``LinkStartError`` (see below).

.. list-table:: Response codes (``LinkStartError.Error``)
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - ``standing``
     - Account too new/inactive to claim yet (message names the required vs.
       observed age and player-seen counts).
   * - ``banned``
     - Account disabled by the server.
   * - ``protocol_too_old``
     - Client needs to update.
   * - ``not_registered``
     - Not yet registered — also raised locally, with no request sent, if no local
       credentials exist yet.
   * - ``bad_content_id``, ``bad_character_name``
     - Character could not be read cleanly.
   * - ``unreachable``
     - Client-synthesized: the request failed outright, or the response carried no
       usable ``Error`` string.
   * - *(anything else)*
     - Generic "claim code request failed" fallback message.

The resulting code is meant to be entered at ``echovault.gg/me`` within 10 minutes to
claim ownership of that character's public profile page and manage its privacy
settings on the site. Note that the request is authorized purely by whichever Echo
*installation* currently holds the local, DPAPI-protected credentials for that
character folder — i.e., it is gated by "who is running Echo as this character right
now," not by any Square Enix account proof, until the separate Lodestone verification
step below is completed.

.. _verify-endpoints:

``POST /v1/auth/verify/start``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Signed. Begins tying the local Echo installation to a public Square Enix Lodestone
profile.

.. include:: _verified.rst

Request/response schema (``VerifyStartRequest`` / ``VerifyStartResponse``):

.. code-block:: text

   {
     "protocolVersion": 2,
     "lodestoneId": string,
     "characterName": string,
     "homeWorldName": string,
     "contentId": string(ulong)
   }

   { "code": string }

.. code-block:: http
   :caption: Request

   POST /v1/auth/verify/start HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: <uploaderId>
   X-Echo-Timestamp: <unix-timestamp>
   X-Echo-Nonce: <random-32-hex-nonce>
   X-Echo-Signature: <hmac-sha256-hex-signature>

   {
       "protocolVersion": 2,
       "lodestoneId": "<lodestoneId>",
       "characterName": "<characterName>",
       "homeWorldName": "<homeWorldName>",
       "contentId": "<contentId>"
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   { "code": "<verifyCode>" }

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body parsed as ``VerifyStartResponse``.
   * - 429 Too Many Requests
     - ``ReadErrorCodeAsync`` synthesizes ``rate_limited`` (see below) — called
       unconditionally here, unlike ``/v1/auth/session``.
   * - Any other
     - Failure; code extracted via ``ReadErrorCodeAsync`` (see below), or falls
       back to ``unreachable``.

.. list-table:: Response codes (``VerifyStartResult.Error``)
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - ``rate_limited``
     - Too many attempts; wait an hour.
   * - ``already_claimed``
     - Lodestone character already verified by another Echo account.
   * - ``banned``
     - Account disabled.
   * - ``protocol_too_old``
     - Client needs to update.
   * - ``bad_lodestone_id``
     - Lodestone ID malformed.
   * - ``bad_content_id``, ``bad_world_name``, ``bad_character_name``
     - Character could not be read cleanly.
   * - ``not_registered``
     - Not yet registered. Added in plugin version ``0.8.1``; earlier versions fell
       through to the generic "could not start verification" fallback message for
       this code instead.
   * - ``null``
     - No response, or no usable error field — message inferred (source truncated
       here; see :ref:`transport-and-envelope`), not confirmed verbatim.
   * - *(anything else)*
     - Generic "could not start verification" fallback message.

The user is instructed to paste the returned code into their Lodestone profile's bio
field, then confirm in the Settings tab. Completion presumably causes the server to
check the Lodestone page for that code out-of-band — see
``POST /v1/auth/verify/complete`` next.

``POST /v1/auth/verify/complete``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Signed. Completes the Lodestone verification started above.

Request/response schema (``VerifyCompleteRequest`` / ``VerifyCompleteResponse``):

.. code-block:: text

   { "protocolVersion": 2 }

   { "verified": bool, "reason": string | null }

.. code-block:: http
   :caption: Request

   POST /v1/auth/verify/complete HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: <uploaderId>
   X-Echo-Timestamp: <unix-timestamp>
   X-Echo-Nonce: <random-32-hex-nonce>
   X-Echo-Signature: <hmac-sha256-hex-signature>

   {
       "protocolVersion": 2
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   { "verified": true, "reason": null }

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body parsed as ``VerifyCompleteResponse`` (``verified`` may still
       be ``false``, with a ``reason``).
   * - 429 Too Many Requests
     - ``ReadErrorCodeAsync`` synthesizes ``rate_limited`` as the ``Reason`` (see
       below) — called unconditionally here, same as verify/start above.
   * - Any other
     - Failure; code extracted via ``ReadErrorCodeAsync`` becomes the ``Reason``
       (see below).

.. list-table:: Response codes (``VerifyCompleteResponse.Reason``)
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - ``lodestone_unavailable``
     - Lodestone temporarily unavailable; code still valid.
   * - ``code_not_found``
     - Code not found in Lodestone bio yet.
   * - ``character_mismatch``
     - Lodestone character doesn't match the logged-in character.
   * - ``not_found``
     - No Lodestone profile with that ID.
   * - ``level_too_low``
     - Character below the level requirement.
   * - ``character_too_new``
     - Character too new to verify.
   * - ``banned``
     - Account disabled.
   * - ``expired``
     - Code expired.
   * - ``rate_limited``
     - Too many attempts — genuine or synthesized from a bare 429; indistinguishable.
   * - ``no_pending_verification``
     - Code no longer active.
   * - ``already_claimed``
     - Lodestone character already verified by another account.
   * - ``null``
     - No response from the server.
   * - *(anything else)*
     - Falls back to the raw code with underscores replaced by spaces.

A verified character's uploads bypass whatever corroboration/delay queue unverified
uploads sit in ("Verified uploads go live immediately" — Settings tab copy) — i.e.,
tying a real, named, public Square Enix profile to the plugin is directly incentivized
with faster publication of the data it collects about *other* people.

``POST /v1/appeals``
~~~~~~~~~~~~~~~~~~~~

Signed, requires ``X-Echo-Session``. Request schema (``AppealRequest``):
``{ "note": string | null }`` (truncated client-side to 500 characters; when ``null``,
the ``note`` key is omitted entirely per the rule in :ref:`transport-and-envelope`,
same as an unset ``fcTag``).

.. code-block:: http
   :caption: Request

   POST /v1/appeals HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: <uploaderId>
   X-Echo-Timestamp: <unix-timestamp>
   X-Echo-Nonce: <random-32-hex-nonce>
   X-Echo-Signature: <hmac-sha256-hex-signature>
   X-Echo-Session: <sessionToken>

   {
       "note": "This account should not have been restricted."
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK

``AppealAsync`` only checks the response status code (``IsSuccessStatusCode``) — it
never deserializes a response body, so no response schema is documented here; whatever
body the server returns, if any, is discarded by the client.

.. list-table:: HTTP status codes
   :widths: 20 80
   :header-rows: 1

   * - Status
     - Behavior
   * - 200 OK
     - Success; body discarded either way.
   * - Any other
     - Failure; ``AppealAsync`` returns ``false``, surfaced in chat only as "Echo:
       could not reach the server. Try again later."

.. list-table:: Response codes
   :widths: 20 80
   :header-rows: 1

   * - Code
     - Definition
   * - *(none)*
     - ``ReadErrorCodeAsync`` is never called; no error codes exist for this
       endpoint.

The existence of this endpoint implies a server-side moderation/ban system for
*uploaders* — i.e., people running the plugin can apparently be restricted and can
appeal. Nothing in the client protocol provides any equivalent notice, opt-out, or
appeal path for the *observed* players whose data is collected and published without
their participation.

.. _auto-search-sweep:

The auto-search sweep (DMA)
---------------------------

The most invasive and most clearly automation-violating subsystem is
``PlayerSearchRequest.Fire`` / ``SearchSweeper`` / ``SearchSweepPlan``
gated behind the off-by-default "Auto-sweep Player Search (advanced)" setting.

It locates the game client's live ``InfoProxySearch`` and writes directly into
that structure's raw memory at hardcoded byte offsets to set search parameters
a player would normally set through the UI:

   .. list-table::
      :widths: 30 15 55
      :header-rows: 1

      * - Offset
        - Field
        - What gets forced
      * - ``0x0D0`` (208)
        - location count
        - reset to 0 (all locations)
      * - ``0x0D8`` (216)
        - job bitmask
        - set to the single job currently being swept
      * - ``0x0E0``/``0x0E2`` (224/226)
        - level min/max
        - set to the current sweep's level band
      * - ``0x0E8`` (232)
        - Grand Company mask
        - forced to "all" (``0xFF``)
      * - ``0x0F0`` (240)
        - language mask
        - forced to "all" (``0xFF``)
      * - ``0x100`` (256)
        - search-area list
        - armed once per session with **all 34** known search-area codes covering
          every region of the game world, forcing maximum search scope
      * - ``0x184`` (386)
        - search-area group/scope flag
        - forced to ``7`` (broadest available scope)
      * - ``0x164`` (356)
        - name filter
        - cleared to empty (search everyone, not a specific name)

It then calls the structure's own ``RequestData()`` method (the same internal
function the game itself calls when a player clicks "Search")

``SearchSweepPlan`` then schedules these searches on its own.

.. _illustrative-walkthrough:

Illustrative walkthrough: config → register → session → verify → ingest
-----------------------------------------------------------------------

.. warning::

   **Everything in this section is fabricated.** No request below was sent to, and no
   response below was received from, ``echovault.gg`` or any other server. Every ID,
   key, signature, code, timestamp, and coordinate is a made-up placeholder invented
   only to show an example of real traffic.

**Scenario:** A player logs into a fresh character, "Thancred Waters" of
Balmung, with Echo installed for the first time. Echo activates, registers a new
identity with the server, fetches config, opens a session, and starts queuing
sightings of nearby players. The user then verifies the character against its
Lodestone profile from the Settings tab, so that this first batch of sightings is
published immediately instead of sitting in the corroboration queue.

**1. Fetch remote config** (``GET /v1/config``, unauthenticated, happens once at
startup before anything else):

.. code-block:: http
   :caption: Request

   GET /v1/config HTTP/1.1
   Host: echovault.gg

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "minPluginVersion": "0.7.0",
       "captureCadenceSeconds": 30,
       "ingestEnabled": true,
       "minEmitIntervalSeconds": 10,
       "socialCadenceSeconds": 900
   }

**2. Register a new installation identity** (``POST /v1/auth/register``, no stored
credentials exist yet for this character):

.. code-block:: http
   :caption: Request

   POST /v1/auth/register HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8

   {
       "protocolVersion": 2,
       "pluginVersion": "0.8.3"
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "uploaderId": "up_9f3e2a7c4b1d",
       "apiKey": "ak_3f8c9e2b7a1d4f6e8c0b2a9d7e5f1c3b",
       "hmacSecret": "R9k2pL7xQ3mN8vT1yU4wZ6bC0eF5gH2jK7lM9nP1qS0="
   }

The three response fields above are written straight into the local, DPAPI-encrypted
``keys.bin`` (see :ref:`local-storage` in :doc:`data_model`) and never leave the
machine again in this form. Every request from here on sends a *signature* derived
from ``hmacSecret``, never the secret itself.

**3. Open a session** (``POST /v1/auth/session``, signed with the freshly issued
secret):

.. code-block:: http
   :caption: Request

   POST /v1/auth/session HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: up_9f3e2a7c4b1d
   X-Echo-Timestamp: 1786023727
   X-Echo-Nonce: 8f2a1c9d3e7b4f6081c2d9a3e5f7b1c4
   X-Echo-Signature: 5b8e3a1f9c2d7e4b6a0f3c8d1e9b7a4f2c6d8e0b3a5f7c1d9e2b4a6f8c0d3e5b

   {
       "protocolVersion": 2,
       "uploaderId": "up_9f3e2a7c4b1d",
       "apiKey": "ak_3f8c9e2b7a1d4f6e8c0b2a9d7e5f1c3b"
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
       "token": "sess_4c8f1a9e3b7d2f6081c4a9e3f7b2d5c8",
       "expiresAt": "2026-08-06T19:42:07.4193021+00:00",
       "tier": "unverified"
   }

At this point Echo is fully operational and queuing ``Sighting`` records into
``outbox.jsonl``. It doesn't wait for verification. ``tier: "unverified"`` just
means whatever gets uploaded next will sit in the server's corroboration queue
instead of publishing immediately.

**4. Verify the character against Lodestone** (user-initiated from the Settings tab;
``POST /v1/auth/verify/start`` then, after the user pastes the returned code into
their public Lodestone profile bio and clicks "I saved it,"
``POST /v1/auth/verify/complete``):

.. include:: _verified.rst

.. code-block:: http
   :caption: Request

   POST /v1/auth/verify/start HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: up_9f3e2a7c4b1d
   X-Echo-Timestamp: 1786023751
   X-Echo-Nonce: c39a71e4f082b6d5a1c93e7f4b0d2a6c
   X-Echo-Signature: 9d2f6b8a4c1e0d7f3b5a9c2e8d1f4a7b6c0e3d9f2a5b8c1d4e7f0a3b6c9d2e5f

   {
       "protocolVersion": 2,
       "lodestoneId": "9858791",
       "characterName": "Thancred Waters",
       "homeWorldName": "Balmung",
       "contentId": "1152921520418218301"
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   { "code": "ECHO-DEADBEEF" }

.. code-block:: http
   :caption: Request

   POST /v1/auth/verify/complete HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: up_9f3e2a7c4b1d
   X-Echo-Timestamp: 1786023772
   X-Echo-Nonce: 7b4e91c3a086d2f5c8b1a4e7d0f3c6b9
   X-Echo-Signature: 3a7c1e5f9b2d6a0c4e8f1b5a9d3c7e0f2b6a4c8d1e5f9b3a7c0d4e8f2b6a0c5d

   {
       "protocolVersion": 2
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   { "verified": true, "reason": null }

The client sets ``RegistrationStatus.Verified`` locally the moment this response
comes back (``SettingsTab.CompleteVerifyAsync``). The *next* session refresh will
carry ``"tier": "verified"``, and every ingest from that point on is treated as
corroboration-exempt — "your uploads go live immediately," per the plugin's own
Settings tab copy.

**5. Upload the queued sightings** (``POST /v1/ingest``, signed, with the session
token attached). This is the batch that actually leaves the machine and reaches the
server — everything before it was setup:

.. code-block:: http
   :caption: Request

   POST /v1/ingest HTTP/1.1
   Host: echovault.gg
   Content-Type: application/json; charset=utf-8
   X-Echo-KeyId: up_9f3e2a7c4b1d
   X-Echo-Timestamp: 1786023784
   X-Echo-Nonce: 2d7f9a1c4e8b3f6081d2a9c5e7f1b4d6
   X-Echo-Signature: 1a4c7e0b3d6f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0a3f6c9e2b5d8a1f4c
   X-Echo-Session: sess_4c8f1a9e3b7d2f6081c4a9e3f7b2d5c8

   {
       "protocolVersion": 2,
       "pluginVersion": "0.8.3",
       "reporter": { "territoryId": 401, "x": 12.4, "y": 8.0, "z": -33.7 },
       "autoSearchEnabled": false,
       "sightings": [
           {
               "contentId": "1152921530918442017",
               "name": "Alisaie Leveilleur",
               "homeWorldId": 63,
               "homeWorldName": "Balmung",
               "currentWorldId": 63,
               "territoryId": 401,
               "x": 14.1,
               "y": 8.0,
               "z": -31.2,
               "jobId": 20,
               "level": 100,
               "fcTag": "SCION",
               "customizeBase64": "AQIDBAUGBwgJCgsMDQ4PEA==",
               "seenAtUtc": "2026-08-06T13:43:04.5884505+00:00",
               "source": "sweep",
               "accountId": "8821345990012",
               "titleId": 0,
               "grandCompany": 0,
               "equipment": [
                   { "id": 32320, "variant": 1, "stain0": 8, "stain1": 0 },
                   { "id": 32321, "variant": 1, "stain0": 8, "stain1": 0 },
                   { "id": 32322, "variant": 1, "stain0": 8, "stain1": 0 },
                   { "id": 32323, "variant": 1, "stain0": 8, "stain1": 0 },
                   { "id": 32324, "variant": 1, "stain0": 8, "stain1": 0 },
                   { "id": 9048, "variant": 0, "stain0": 0, "stain1": 0 },
                   { "id": 9049, "variant": 0, "stain0": 0, "stain1": 0 },
                   { "id": 9050, "variant": 0, "stain0": 0, "stain1": 0 },
                   { "id": 9051, "variant": 0, "stain0": 0, "stain1": 0 },
                   { "id": 9052, "variant": 0, "stain0": 0, "stain1": 0 }
               ],
               "mainhandModel": 3200101,
               "offhandModel": 0,
               "mountId": 0,
               "onlineStatusId": 47,
               "dutyId": 0,
               "isOnline": true
           },
           {
               "contentId": "1152921540217701933",
               "name": "Y\u0027shtola Rhul",
               "homeWorldId": 63,
               "homeWorldName": "Balmung",
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
               "mountId": 0,
               "onlineStatusId": 47,
               "dutyId": 0,
               "isOnline": true
           },
           {
               "contentId": "1152921551606339842",
               "name": "Alphinaud Leveilleur",
               "homeWorldId": 63,
               "homeWorldName": "Balmung",
               "currentWorldId": 63,
               "territoryId": 401,
               "x": 13.0,
               "y": 8.0,
               "z": -32.5,
               "jobId": 30,
               "level": 100,
               "customizeBase64": "ICEiIyQlJicoKSorLC0uLw==",
               "seenAtUtc": "2026-08-06T13:43:04.5884505+00:00",
               "source": "sweep",
               "accountId": "8821345990012",
               "titleId": 0,
               "grandCompany": 0,
               "equipment": [
                   { "id": 31900, "variant": 1, "stain0": 5, "stain1": 5 },
                   { "id": 31901, "variant": 1, "stain0": 5, "stain1": 5 },
                   { "id": 31902, "variant": 1, "stain0": 5, "stain1": 5 },
                   { "id": 31903, "variant": 1, "stain0": 5, "stain1": 5 },
                   { "id": 31904, "variant": 1, "stain0": 5, "stain1": 5 },
                   { "id": 9077, "variant": 0, "stain0": 0, "stain1": 0 },
                   { "id": 9078, "variant": 0, "stain0": 0, "stain1": 0 },
                   { "id": 9079, "variant": 0, "stain0": 0, "stain1": 0 },
                   { "id": 9080, "variant": 0, "stain0": 0, "stain1": 0 },
                   { "id": 9081, "variant": 0, "stain0": 0, "stain1": 0 }
               ],
               "mainhandModel": 3400301,
               "offhandModel": 0,
               "mountId": 0,
               "onlineStatusId": 47,
               "dutyId": 0,
               "isOnline": true
           }
       ]
   }

.. code-block:: http-response
   :caption: Response

   HTTP/1.1 200 OK
   Content-Type: application/json

   { "accepted": 3 }

From here, ``DrainLoop`` repeats step 5 roughly every 10 seconds for as long as the
outbox has anything queued, re-using the same session token until it is within an
hour of ``expiresAt``, at which point step 3 runs again automatically. Nothing about
this loop requires further input from the user once verification (step 4) is
complete — background collection and upload continue for as long as the game and
Echo stay open.
