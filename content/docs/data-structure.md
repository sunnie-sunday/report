---
title: "Data Model"
description: "C# data structure of Echo's plugin."
weight: 21
aliases:
  - /docs/data_model.html
---

The C# data structure of Echo's plugin. Every type below is declared in it's
decompiled code (`v8.0.4`).

## Registration and session

C#
```csharp
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
```

## Ingest: the sighting payload

The three types that make up the `/v1/ingest` request body: `EquipSlot`,
`ReporterSelf`, and `Sighting` itself, plus the envelope `IngestBatch` that
wraps them.

C#
```csharp
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
```

This is the core payload type, and populated by each collectors described below.

| Field | Type | Notes |
| --- | --- | --- |
| `contentId`` | ulong (string) | Permanent per-character identifier. |
| `name`` | string | Full character name at time of capture. |
| `homeWorldId` / `homeWorldName` | uint / string | Character's home world. |
| `currentWorldId` | uint | World the character is currently playing on. |
| `territoryId` | ushort | Current zone/instance ID. |
| `x` / `y` / `z` | float | Exact in-game position at time of capture. |
| `jobId` / `level` | byte | Current class/job and level. |
| `fcTag` | string (optional) | Free Company tag, if any. |
| `customizeBase64` | string | Base64 of the game's raw "Customize" byte block. | friends, FC, linkshells, last Player Search result.
| `seenAtUtc` | timestamp | When this sighting occurred. |
| `source` | string | One of `sweep`, `spawn`, `social`, `namecache`, `search` |
| `accountId` | ulong (string) | **SE account identifier**, shared across every character on the same account. |
| `titleId` | ushort | Currently equipped title. |
| `grandCompany` | byte | Grand Company + rank byte (`Battalion`). |
| `equipment` | list of `EquipSlot` |
| `mainhandModel` / `offhandModel` | ulong | Weapon model IDs for both weapon slots. |
| `reporter` | `ReporterSelf` | The *uploading* player's own zone + exact coordinates. |
| `mountId` | ushort | Currently summoned mount, if any. |
| `onlineStatusId` | ushort | Online/away/busy/roleplaying... status. |
| `dutyId` | ushort | Current duty/instance content ID (namecache/PF source only). |
| `isOnline` | bool (optional) | `v0.8.3`. Whether the observed character was online when captured. |

## Collection channels

Echo runs four independent collectors:

| Collector | Cadence | Mechanism |
| --- | --- | --- |
| `ObjectTableSweeper` | 5s full sweep, 1s spawn-diff | Iterates every nearby `IPlayerCharacter` |
| `SocialCollector` | Party: 15s, Rosters: 60s, Search: 15s | Reads party, friends, FC, linkshells, last Player Search result. |
| `NameCacheCollector` | Event-driven | Captures every Party Finder listing received and right-click context menus. |
| `SearchSweeper` / `PlayerSearchRequest` | Randomized (opt-in) | Automates the game's own Player Search feature (DMA). |

## Server config

C#
```csharp
public record ConfigResponse(
   string MinPluginVersion,
   int CaptureCadenceSeconds,
   bool IngestEnabled,
   int MinEmitIntervalSeconds = 10,
   int SocialCadenceSeconds = 900);
```

## Coverage / scan targets

C#
```csharp
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
```

## Scanner stats

Gamification contributor stats for a specific API key.

The client waits out a full 15 minutes regardless of whether the previous attempt
succeeded. If the very first fetch fails, the Progress tab keeps showing *"No stats
yet - they appear once uploads flow."* until the next attempt, 15 minutes later.

C#
```csharp
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
```

## Claims and verification

C#
```csharp
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
```

## Appeals and generic errors

C#
```csharp
public record AppealRequest(
   string? Note);

public record ErrorResponse(
   string Error);
```

## Local storage

```text
<pluginConfigDir>/instances/<ContentId as 16-hex-digit>/
 instance.lock     - exclusive file lock; prevents two game clients logged into
                     the same character from double-reporting
 keys.bin          - DPAPI-encrypted (Windows, per-user) blob containing:
                     uploaderId, apiKey, hmacSecret, sessionToken,
                     sessionExpiresAt, tier
 outbox.jsonl      - queue of not-yet-uploaded Sighting JSON lines, capped at
                     50 MB (oldest entries evicted first when full), drained in
                     batches of up to 200 lines roughly every 10 seconds
```

`keys.bin` under the Dalamud plugin config directory (`InstancePaths`) is
protected with `System.Security.Cryptography.ProtectedData` (DPAPI) using a
fixed static entropy value (`"echo-keystore-v1"`). this protects the file from
being read by a different Windows user account on the same machine, but does not
add any protection beyond what DPAPI itself provides, and is irrelevant to what
is sent over the network, which is plain JSON over TLS.

These two types never appear on the wire at all.
They exist purely to persist local state to disk between sessions.

C#
```csharp
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
```
