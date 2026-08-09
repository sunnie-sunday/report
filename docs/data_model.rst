Data Model (C#)
===============

.. note::

   This page covers *what shape* Echo's data takes: the ``Sighting`` record (the
   core payload uploaded per observed character) and every other type exchanged with
   ``echovault.gg``. For *how* this data travels, see :doc:`http_protocol`.

Every type below is declared in Echo's plugin and (presumably) its server.

Registration and session
------------------------

.. code-block:: csharp
   :caption: C#

   public record RegisterRequest(
       int ProtocolVersion,
       string PluginVersion);

   public record RegisterResponse(
       string UploaderId,
       string ApiKey,
       string HmacSecret);

   public record SessionRequest(
       int ProtocolVersion,
       string UploaderId,
       string ApiKey);

   public record SessionResponse(
       string Token,
       DateTimeOffset ExpiresAt,
       string Tier = "unverified");

See ``POST /v1/auth/register`` and ``POST /v1/auth/session`` in :doc:`http_protocol`.

Ingest: the sighting payload
----------------------------

The three types that make up the ``/v1/ingest`` request body — ``EquipSlot``,
``ReporterSelf``, and ``Sighting`` itself — plus the envelope, ``IngestBatch``, that
wraps them.

.. code-block:: csharp
   :caption: C#

   public record ReporterSelf(
       ushort TerritoryId,
       float X,
       float Y,
       float Z);

   public record EquipSlot(
       uint Id,
       byte Variant,
       byte Stain0,
       byte Stain1);

   public record Sighting(
       ulong ContentId,
       string Name,
       uint HomeWorldId,
       uint CurrentWorldId,
       ushort TerritoryId,
       float X,
       float Y,
       float Z,
       byte JobId,
       byte Level,
       string? FcTag,
       string? CustomizeBase64,
       DateTimeOffset SeenAtUtc,
       string Source = "sweep",
       ulong AccountId = 0uL,
       ushort TitleId = 0,
       byte GrandCompany = 0,
       List<EquipSlot>? Equipment = null,
       ulong MainhandModel = 0uL,
       ulong OffhandModel = 0uL,
       string? HomeWorldName = null,
       ReporterSelf? Reporter = null,
       ushort MountId = 0,
       ushort OnlineStatusId = 0,
       ushort DutyId = 0,
       bool? IsOnline = null);

   public record IngestBatch(
       int ProtocolVersion,
       string PluginVersion,
       ReporterSelf Reporter,
       List<Sighting> Sightings,
       bool AutoSearchEnabled = false);

   public record IngestResponse(
       int Accepted);

.. _sighting-schema:

Sighting schema
~~~~~~~~~~~~~~~

This is the core payload type, and populated by each of the six
collector code paths described below.

.. list-table::
   :widths: 22 15 63
   :header-rows: 1

   * - Field
     - Type
     - Notes
   * - ``contentId``
     - ulong (string)
     - Permanent per-character identifier. Survives character renames.
   * - ``name``
     - string
     - Full character name at time of capture.
   * - ``homeWorldId`` / ``homeWorldName``
     - uint / string
     - Character's home world.
   * - ``currentWorldId``
     - uint
     - World the character is currently visiting/playing on, if different.
   * - ``territoryId``
     - ushort
     - Current zone/instance ID.
   * - ``x`` / ``y`` / ``z``
     - float
     - Exact in-game position at time of capture (sweep/spawn sources only).
   * - ``jobId`` / ``level``
     - byte
     - Current class/job and level.
   * - ``fcTag``
     - string, optional
     - Free Company tag, if any.
   * - ``customizeBase64``
     - string, optional
     - Base64 of the game's raw "Customize" byte block — race, clan, gender, face,
       hair, skin/eye/hair color, and every other appearance slider, sufficient to
       reconstruct the character's exact appearance.
   * - ``seenAtUtc``
     - timestamp
     - When this sighting occurred.
   * - ``source``
     - string
     - One of ``sweep``, ``spawn``, ``social``, ``namecache``, ``search`` — which
       collector produced this record (``SightingSource`` constants).
   * - ``accountId``
     - ulong (string)
     - **Square Enix service-account-level identifier**, shared across every character
       on the same account. See :doc:`policy_violations` for why this specific field
       is independently flagged by both Square Enix and the Dalamud project as a
       safety issue when harvested from other players.
   * - ``titleId``
     - ushort
     - Currently equipped title.
   * - ``grandCompany``
     - byte
     - Grand Company + rank byte (``Battalion``).
   * - ``equipment``
     - list of ``EquipSlot``
     - One entry per gear slot: ``{ id, variant, stain0, stain1 }`` — item ID, variant,
       and both dye-channel colors, for up to 10 slots.
   * - ``mainhandModel`` / ``offhandModel``
     - ulong
     - Weapon model IDs for both weapon slots.
   * - ``reporter``
     - ``ReporterSelf``, optional
     - The *uploading* player's own zone + exact coordinates at ingest time (see
       ``/v1/ingest`` in :doc:`http_protocol`) — attached at the batch level, not
       per-sighting, but included here because it means raw traffic to this endpoint
       also discloses the observer's own location, not only the observed player's.
   * - ``mountId``
     - ushort
     - Currently summoned mount, if any.
   * - ``onlineStatusId``
     - ushort
     - Online/away/busy/roleplaying/etc. status.
   * - ``dutyId``
     - ushort
     - Current duty/instance content ID (namecache/Party-Finder source only).
   * - ``isOnline``
     - bool, optional
     - ``v0.8.3``. Whether the observed character was online at capture time.

Collection channels
~~~~~~~~~~~~~~~~~~~

Echo runs four independent collectors:

.. list-table::
   :widths: 22 15 63
   :header-rows: 1

   * - Collector
     - Cadence
     - Mechanism
   * - ``ObjectTableSweeper``
     - 5s full sweep, 1s spawn-diff
     - Iterates every ``IPlayerCharacter`` currently in ``IObjectTable.PlayerObjects``
       (i.e. rendered/known to the client) and reads position, appearance, gear,
       account/content IDs, etc. directly from the character's live
       ``BattleChara``/``DrawDataContainer`` memory. Source tags: ``sweep``, ``spawn``.
   * - ``SocialCollector``
     - Party: 15s · Rosters: 60s · Search: 15s
     - Reads the local/cross-realm party (``InfoProxyCrossRealm``) and, every 60
       seconds, six separate internal "InfoProxy" list caches by ID (``15, 6, 4, 31,
       22, 23`` — friend list / FC roster / linkshell-class social lists the game
       already maintains client-side), plus the last Player Search result set if
       enabled. Source tag: ``social`` (and ``search`` for the search-result reader).
   * - ``NameCacheCollector``
     - Event-driven
     - Captures every Party Finder listing received (``IPartyFinderGui.ReceiveListing``)
       and whichever player was targeted the moment a right-click context menu opens
       (``IContextMenu.OnMenuOpened``) — regardless of whether the user selects
       anything from that menu. Source tag: ``namecache``.
   * - ``SearchSweeper`` / ``PlayerSearchRequest``
     - Randomized, opt-in
     - Automates the game's own Player Search feature — see
       :ref:`auto-search-sweep` in :doc:`http_protocol`. Source tag: ``search``.

Server config
-------------

.. code-block:: csharp
   :caption: C#

   public record ConfigResponse(
       string MinPluginVersion,
       int CaptureCadenceSeconds,
       bool IngestEnabled,
       int MinEmitIntervalSeconds = 10,
       int SocialCadenceSeconds = 900);

See ``GET /v1/config`` in :doc:`http_protocol`.

Coverage / scan targets
-----------------------

.. code-block:: csharp
   :caption: C#

   public record ScanTargetsRequest(
       int ProtocolVersion,
       uint WorldId,
       int TargetsRevision = 0);

   public record ScanTarget(
       int TerritoryId,
       int NewPlayers7d,
       int? LastSweptHoursAgo,
       int Sightings7d);

   public record WorldCompleteness(
       int WorldId,
       int Indexed,
       int? EstimatedPopulation,
       double? CompletenessPct,
       double? NoveltyPct);

   public record ScanTargetsResponse(
       string GeneratedAt,
       int WorldId,
       int TargetsRevision,
       List<ScanTarget> Targets,
       List<WorldCompleteness> DcWorlds);

See ``POST /v1/scan-targets`` in :doc:`http_protocol`.

Scanner stats
-------------

.. code-block:: csharp
   :caption: C#

   public record ScannerStatsRequest(
       int ProtocolVersion);

   public record ScannerBestWeek(
       string WeekStart,
       int Count);

   public record ScannerStatsResponse(
       long LifetimeSightings,
       int WeekSightings,
       string WeekStart,
       ScannerBestWeek? BestWeek,
       int CharactersObserved,
       int CharactersContributed,
       int TerritoriesCovered,
       int? PercentileBand,
       string ComputedAt);

.. note::

   The client waits out a full 15 minutes regardless of whether the previous attempt
   succeeded. If the very first fetch fails, the Progress tab keeps showing *"No stats
   yet - they appear once uploads flow."* until the next attempt, 15 minutes later.

See ``POST /v1/scanner/stats`` and :doc:`motives` for what this data is used for.

Claims and verification
-----------------------

.. code-block:: csharp
   :caption: C#

   public record LinkStartRequest(
       int ProtocolVersion,
       ulong ContentId,
       string CharacterName,
       uint HomeWorldId);

   public record LinkStartResponse(
       string Code,
       DateTimeOffset ExpiresAt);

   public record LinkStartError(
       string Error,
       int? AgeDays = null,
       int? AgeRequiredDays = null,
       int? Observed = null,
       int? ObservedRequired = null);

   public record VerifyStartRequest(
       int ProtocolVersion,
       string LodestoneId,
       string CharacterName,
       string HomeWorldName,
       ulong ContentId);

   public record VerifyStartResponse(
       string Code);

   public record VerifyCompleteRequest(
       int ProtocolVersion);

   public record VerifyCompleteResponse(
       bool Verified,
       string? Reason);

``LinkStartError`` is what ``/v1/claims/link/start`` returns on failure instead of
``LinkStartResponse``; ``LinkClaimMessages.Describe`` pattern-matches on its
``Error`` string (``"standing"``, ``"banned"``, ``"protocol_too_old"``, ``"not_registered"``,
``"bad_content_id"``, ``"bad_character_name"``, ``"unreachable"``, or an unrecognized code)
to produce the in-game chat message. See ``POST /v1/claims/link/start`` and
the two ``/v1/auth/verify/*`` endpoints in :doc:`http_protocol`.

Appeals and generic errors
--------------------------

.. code-block:: csharp
   :caption: C#

   public record AppealRequest(
       string? Note);

   public record ErrorResponse(
       string Error);

``ErrorResponse`` is the generic ``{ "error": "..." }`` shape ``EchoApiClient``
attempts to parse from any non-success response (``ReadErrorCodeAsync``) to extract a
machine-readable error code — used by the session-refresh and link/verify flows to
distinguish, for example, ``"unknown_key"`` (triggers a fresh registration) from a
rate limit (``response.StatusCode == 429`` maps to the synthetic code
``"rate_limited"`` even without a body). See ``POST /v1/appeals`` in
:doc:`http_protocol`.

Unused
------

Two more types exist but are never used.
They are presumably shared with server-side or website-only code.

.. code-block:: csharp
   :caption: C#

   public record PlayerProfileResponse(
       ulong ContentId,
       string Name,
       uint HomeWorldId,
       uint CurrentWorldId,
       ushort LastTerritoryId,
       byte Level,
       byte JobId,
       string? FcTag,
       DateTimeOffset FirstSeenAt,
       DateTimeOffset LastSeenAt,
       ushort TitleId = 0,
       byte GrandCompany = 0,
       string? EquipmentJson = null,
       string? AvatarUrl = null,
       string? PortraitUrl = null,
       string? HomeWorldName = null);

   public record ScanTargetsWorld(
       string GeneratedAt,
       int WorldId,
       List<ScanTarget> Targets);

``PlayerProfileResponse`` in particular is worth noting even though the plugin never
touches it: its shape — ``FirstSeenAt``/``LastSeenAt``, an ``AvatarUrl`` and
``PortraitUrl`` — strongly suggests it is exactly what backs each character's public
profile page on ``echovault.gg``.

.. _local-storage:

Local storage
-------------

.. code-block:: text

   <pluginConfigDir>/instances/<ContentId as 16-hex-digit>/
     instance.lock     - exclusive file lock; prevents two game clients logged into
                          the same character from double-reporting
     keys.bin           - DPAPI-encrypted (Windows, per-user) blob containing:
                             uploaderId, apiKey, hmacSecret, sessionToken,
                             sessionExpiresAt, tier
     outbox.jsonl        - queue of not-yet-uploaded Sighting JSON lines, capped at
                          50 MB (oldest entries evicted first when full), drained in
                          batches of up to 200 lines roughly every 10 seconds

``keys.bin`` under the Dalamud plugin config directory (``InstancePaths``) is protected
with ``System.Security.Cryptography.ProtectedData`` (DPAPI)
using a fixed static entropy value (``"echo-keystore-v1"``) — this protects the file
from being read by a different Windows user account on the same machine, but does not
add any protection beyond what DPAPI itself provides, and is irrelevant to what is
sent over the network, which is plain JSON over TLS. The ``keys.bin`` payload itself
is the ``StoredCredentials`` type — see the "Local-only types" section below.

Local-only types
----------------

These two types never appear on the wire at all — they exist purely to persist local
state to disk between sessions.

.. code-block:: csharp
   :caption: C#

   public record StoredCredentials(
       string UploaderId,
       string ApiKey,
       string HmacSecretBase64,
       string? SessionToken,
       DateTimeOffset? SessionExpiresAt,
       string? Tier = null);

   public sealed record PersistedSettings(
       bool CaptureEnabled = true,
       bool SocialCaptureEnabled = true,
       bool NameCacheCaptureEnabled = true,
       bool SearchCaptureEnabled = true,
       bool ContextMenuLinkEnabled = true,
       bool AutoSearchEnabled = false,
       bool OverlayEnabled = false,
       bool OverlayClickThrough = false,
       bool OverlayLocked = false);
