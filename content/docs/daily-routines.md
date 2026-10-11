---
title: "Daily Routines"
description: "Code analysis of Daily Routines, a new plugin with a stalking behavior similar to EchoVault."
weight: 30
---

Code analysis of **Daily Routines**, a plugin with a stalking behavior similar to **EchoVault**.

## Daily Routines vs EchoVault: What Gets Recorded

Both plugins quietly record the players around you and send them to a server run by the plugin's makers. **EchoVault** records far more about each player, including the ID that links their alts. **Daily Routines** records less about other players, but takes that same alt-linking ID from its own users.

## Two IDs you should know

The game gives every character and every account a hidden number. You never see them in game, but plugins can read them.

- **Character ID**: a permanent number for one character. It never changes, even after a name change or a world transfer. Anyone holding it can follow that character through every rename and transfer.
- **Account ID**: one number shared by **every character on the same Square Enix account**. Anyone holding it can tell which characters are alts of the same player. Square Enix and the Dalamud team have both warned against tools that collect it.

## Players you meet

Both plugins record other players automatically while you play. Neither one asks the players being recorded.

|  | EchoVault | Daily Routines |
| --- | --- | --- |
| **Who gets recorded** |  |  |
| Players around you | Yes, checked every few seconds | Yes, checked every second |
| Your friend list, FC members, linkshells | Yes | Yes |
| Player Search results | Yes | Yes |
| Party Finder recruiters | Yes | Yes |
| Anyone you right-click | Yes | No |
| Runs Player Search on its own to find more people | Yes, if turned on | No |
| **What is recorded about them** |  |  |
| Character ID | Yes | Yes |
| Name, home world, current world | Yes | Yes |
| Account ID (links their alts) | **Yes** | **No** |
| Zone and position | Yes | No |
| Duty they are in | Yes | No |
| Appearance | Yes | No |
| Gear and glamour, with dyes | Yes | No |
| Job, level, FC tag, title | Yes | No |
| Mount and online status | Yes | No |
| Reporter's location | Yes | No |
| **What anyone can see later** |  |  |
| Where it shows | A public website anyone can browse | Inside the plugin: your friend list and blacklists |
| Current name from a character ID | Yes | Yes |
| Past names and world transfers | Yes | Yes |
| Location activity over time | Yes | No |
| Their alts | Yes | No |
| Their outfits over time | Yes | No |

**Daily Routines**' blacklists can also be stored on its server and shared between users. Each entry records which character added it.

## Account IDs

**EchoVault** takes the Account ID of the players you meet. **Daily Routines** leaves theirs alone but takes yours.

|  | EchoVault | Daily Routines |
| --- | --- | --- |
| Account ID of players you meet | **Sent** to its server, to list their alts | Looked at only to check the player is real; **never sent** |
| Your own Account ID | Not sent | **Sent**, every time you log in, lightly scrambled (the scrambling can be undone) |
| Linked to your characters | No | **Yes**: sent together with the character ID of each character you log in with |
| Linked to your PC | No | **Yes**: sent with a fingerprint of your PC's hardware and home network |
| What the server can work out | The alts of everyone its users have met | The alts of everyone who uses the plugin, and which PC they play on |
| Used to block people from the plugin | No | **Yes**: the makers can remotely shut the plugin off for an account or PC |

What this means: with **EchoVault**, strangers can find your alts. With **Daily Routines**, your alts and your PC are known to the plugin's makers, not to other players.

## Timeline: from cheat ban to ban-proof launcher

The Chinese game client runs its own build of Dalamud, maintained by OtterCorp. **Daily Routines** started there, so its history goes through it.

### 2024-06: Daily Routines fingerprints its users' PCs

**Daily Routines** was still fully open source then. A login hook hashes hardware serial numbers and sends them to the author's server:

```csharp
private const string WorkerUrl = "https://spbs.atmoomen.top/";
["ProcessorId", "SerialNumber", "SerialNumber", "VolumeSerialNumber", "MACAddress",];
await UploadEntry(new(GetEncryptedMachineCode()));
```

### 2024-12-03: OtterCorp bans Daily Routines as a cheat plugin

OtterCorp adds it to the Chinese Dalamud's cheat plugin list ([`b449a61`](https://github.com/ottercorp/DalamudAssets/commit/b449a61ba704e94f750802430e895b2432e31890), "add darry rings"). The list stores names as SHA-256 hashes, and this one is `SHA256("DailyRoutines")`:

```json
{ "Name": "7774CEA690A1982D782D32CB33B777902A93AEED06C9E116F01C5046EF7B304C", ... }
```

The commit doesn't give a reason, but the label is accurate. **Daily Routines** include combat cheats, for example:

- **Forged packets**: `AutoActionAlignCamera` sends the server a fake position update just before an action.
- **Hidden information**: `AutoDisplayHiddenCast` patches the game's memory to show boss casts the game deliberately hides.
- **Automated placement**: `AutoReplaceLocationAction` places ground-targeted actions at the arena centre automatically.

### 2025-02-21: a tool to undo the ban

**AtmoOmen** publishes [DontBanMyPlugins](https://github.com/AtmoOmen/DontBanMyPlugins). It installs a hidden scheduled task that runs at logon with the highest privileges, and wipes the cheat list whenever the launcher downloads it:

```csharp
Filter = "cheatplugin.json"
writer.Write("[]");
```

### 2025-02-23: Soil, a launcher without bans

Two days later comes [Soil](https://github.com/AtmoOmen/FFXIVQuickLauncher) `1.0.0`, **AtmoOmen**'s fork of the Chinese launcher and of Dalamud. Its README advertises "no Dalamud plugin ban mechanism". In the code:

- the ban list is always empty:

  ```csharp
  private readonly BannedPlugin[] bannedPlugins = [];
  ```

- OtterCorp's plugin repo is labelled "illegal" (`非法主库地址`) and silently replaced with **AtmoOmen**'s mirror:

  ```csharp
  dalamudConfig.MainRepoUrl = MainRepoUrlSoil;
  ```

- **AtmoOmen**'s own repo, which hosts Daily Routines, is preinstalled:

  ```csharp
  // AtmoOmen
  "https://gh.atmoomen.top/raw.githubusercontent.com/AtmoOmen/DalamudPlugins/main/pluginmaster.json",
  ```

The same README promises "无任何数据上报逻辑" (no data reporting of any kind). **Soil** even generates fake device IDs for each account, so the game's publisher can't link accounts to one PC (`FakeMachineInfo.cs`).

### 2025 onwards: collection grows

With the ban out of the way for **Soil** users, **Daily Routines** collects more:

- **2025-04-30**: a "Check previous names" button queries the author's server for a player's rename history ([`56a61fe`](https://github.com/Dalamud-DailyRoutines/DailyRoutines.ModulesPublic/commit/56a61fe8b6ef9ec36c134e09d151180e128ff091)), so that history was already being recorded.
- **2026-04-02**: version `2.0.2.5`, the oldest binary checked here, already uploads sightings of nearby players (to `103.236.67.155`).
- **2026-08-18**: the account credential appears, described as one that "binds to the currently logged-in game account" ([`803ddb1`](https://github.com/Dalamud-DailyRoutines/DailyRoutines.Localizations/commit/803ddb1a8fbc9d59d5d9e6423000e4ff02856edb)). This is the Account ID credential described above.

The same author fakes device IDs to protect accounts in **Soil**, and sends real hardware and Account IDs to their own server in **Daily Routines**.

## How the data is sent

Requests to the plugin's own API servers also carry the header `X-Plugin: daily-routines`.
The sightings ingest, the player lookups and the credential checks are all **plain HTTP to bare IP addresses**, so your Character ID, your credential hashes and other players' sightings cross the network unencrypted. Only the NekoAuth licence server and the `PassAuthInfo.txt` file use HTTPS.

### Sightings ingest

`POST http://103.236.64.225/api/report/cid`

Sends the players you meet. It is always on and has no setting. Each player is sent at most once every 15 minutes, in batches of 1 to 200. Every batch carries your PC's **M** token (see below) in a `credential` header, and every value is sent as a string.

```json
{
  "list": [
    {
      "content_id": "<Character ID>",
      "name": "<character name>",
      "world": "<home world>",
      "world_id": "<home world ID>",
      "current_world": "<current world>",
      "current_world_id": "<current world ID>",
      "region": "<region>"
    }
  ]
}
```

### Player history search

These two endpoints turn a Character ID back into a name. They sit on a different server from the ingest, and the client never shows how the two servers share data.

Requests to `192.140.166.30` carry the same hardcoded token three times, as `x-plugin-key`, `apikey` and `Authorization: Bearer`.

**Current name and world**

`POST http://192.140.166.30:3999/api/get_player_info_cid`

```json
{"p_contentid": "<Character ID>", "p_region": "<region>"}
```

**Rename history**

`POST http://192.140.166.30:3999/api/get_player_name_history`

Returns every rename, as `before_name`, `after_name` and `created_at`.

```json
{"contentid": "<Character ID>", "region": "<region>"}
```

### Credentials: who you are to the server

At each login the plugin builds up to three IDs for you. Each is `prefix + MD5("NekoV#" + source)` written in hex. The salt `NekoV#` is hardcoded in the plugin, so anyone holding a token can test guesses against it.

| Credential | Source | Links |
| --- | --- | --- |
| **A**: account | Your Account ID | Your alts |
| **M**: machine | Your PC's hardware IDs | Your PC |
| **T**: tattoo | A hidden native DLL | Your PC and network |

- **A**: the Account ID is shared by all your characters, so it links your alts. Account IDs are numbers, so the hash can be brute-forced back to the ID.
- **M**: built from the TPM endorsement key, SMBIOS UUID, board, chassis and BIOS serial numbers, manufacturer and model, and the Windows `MachineGuid`. On Linux, only `MachineGuid`, a random ID created when the game was set up rather than taken from the hardware. Also sent as the `credential` header on the sightings ingest.
- **T**: a native Windows DLL hidden inside the plugin as compressed base64. The plugin writes it to disk and calls its `get_machine_id`. It imports `GetIpNetTable`, which reads the local network's address table (your router included). Its exact inputs were not analysed. Skipped on Linux.
