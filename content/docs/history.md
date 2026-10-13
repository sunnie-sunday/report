---
title: "History"
description: "Chronology of Account ID use and nearby-player collection by FFXIV plugins and tools."
weight: 30
---

Chronology of Account ID use and nearby-player collection by FFXIV plugins and tools.

Target:

- **Own ID**: the user's own Account ID, read from the game's account record (never masked by Square Enix).
- **Others' IDs**: Account IDs of other players (masked from patch 7.2), the alt-linking risk.

Severity:

- **HIGH** when the data leaves the user's client (server, relay, website)
- **MEDIUM** when other players' IDs are stored locally (database, config)
- **LOW** when only used in memory (passed back to the game, displayed, debug)

This list aims to be wide and transparent and may contain plugins that remain
ethical and secure despite their use of those IDs. The *what* and the *where*
matters here and the severity rating is there to help understand that.

## Account IDs

**2024-07-02 · Square Enix**\
Patch 7.0 makes the blacklist account-wide, exposing Account IDs to the client.\
[Lodestone](https://na.finalfantasyxiv.com/lodestone/topics/detail/aa06a87583c5acc62ea309feda1e1d0a8d2efdd8)

**2024-07-02 · PvpStats** · others' IDs\
Saves the Account ID of every player in PvP match results (Crystalline Conflict, Frontline, and Rival Wings from 2024-08-24) in its match history.\
Severity: MEDIUM\
Goes to: local only (match database; the plugin has no network code).\
Commits [`2fba8a2`](https://github.com/wrath16/PvpStats/commit/2fba8a2200bdd35c1b6271320fe529293db9b14d) and [`052ea47`](https://github.com/wrath16/PvpStats/commit/052ea4791ad530518cd217d51fabab741c7925bb) on GitHub; official repository

**2024-07-06 · Messenger** · others' IDs\
The settings' debug tab shows other players' Account IDs from the chat log, and from 2025-07-03 from the tell history.\
Severity: LOW\
Goes to: local only (debug tab).\
Commits [`48e8ead`](https://github.com/NightmareXIV/XIVInstantMessenger/commit/48e8ead09dee7aaaacdb3d8dfb77ea41f50ef9bb) and [`5fbf7f8`](https://github.com/NightmareXIV/XIVInstantMessenger/commit/5fbf7f82aaa4607ac33816277c10fe9826242fbe) on GitHub; official repository

**2024-07-14 · BossMod (awgil)** · own + others' IDs\
Debug windows show the Account IDs of nearby players and party members; a sanity check writes the user's own Account ID to the local log. Inherited by BossModReborn.\
Severity: LOW\
Goes to: local only (debug windows and log).\
Commits [`810f4f5`](https://github.com/awgil/ffxiv_bossmod/commit/810f4f55ec30ec531db3c373896358bfcecb22c6) and [`e7931b7`](https://github.com/awgil/ffxiv_bossmod/commit/e7931b7dd3c80522a7bb8cee822b343d4bb24266) on GitHub

**2024-07-17 · Mare Synchronos** · own + others' IDs\
Player identity becomes `SHA256(AccountId)`: sent to the server, relayed to paired users, matched against every nearby player.\
Severity: HIGH\
Goes to: Mare server, relayed to paired users (nearby players' hashes are matched locally).\
Commit [`bfafcad`](https://github.com/universalconquistador/MareSynchronosClient/commit/bfafcad8e8b84f0c82094aac63e5fc8a9e77c6b9) on GitHub

**2024-07-18 · Mare Synchronos** · own ID\
Server bans move from "character" to "XIV service account".\
Severity: HIGH\
Goes to: Mare server (bans keyed by account).\
Commit [`713d054`](https://github.com/ottercorp/Mare-server/commit/713d054ccb965f7adb8eafa6e3fb52853a1e6dd2) on GitHub

**2024-09-30 · Visibility** · others' IDs\
The VoidList (hidden players) is keyed by each hidden player's Account ID and saved in the plugin configuration.\
Severity: MEDIUM\
Goes to: local only (plugin configuration).\
Commit [`09bb95a`](https://github.com/SheepGoMeh/VisibilityPlugin/commit/09bb95a00cb2558749258e3d4d8617439ea05132) on GitHub; official repository (builds from 2024-09-30 to 2024-11-16)

**2024-10-10 · Sonar** · own ID\
Sends a reversable hash of the user's `Character.AccountId` at login.\
Severity: HIGH\
Goes to: Sonar server, with a hardware fingerprint.\
Commit [`30ad4cc`](https://github.com/FFXIV-Sonar/SonarDistrib/commit/30ad4ccc5aa80986699e4e43e1d9ebf32a08f154) on GitHub; released in 0.6.6.2

**2024-10-14 · CN Dalamud (OtterCorp)** · own ID\
Login telemetry adds `SHA256(AccountId)`; the public IP is now sent unhashed.\
Severity: HIGH\
Goes to: OtterCorp telemetry server.\
Commit [`cac4be4e`](https://github.com/ottercorp/Dalamud/commit/cac4be4e35f970edc657a05cd89b8946d8d40a9c) on GitHub

**2024-10-31 · Wholist** · others' IDs\
Hides blocked players from the nearby list by checking the game's blacklist with their Account ID.\
Severity: LOW\
Goes to: local only (passed back to the game).\
Commits [`6623d88`](https://github.com/Blooym/Dalamud.Wholist/commit/6623d880042e156cc298e9384de63ec160275d78) and [`bb42d15`](https://github.com/Blooym/Dalamud.Wholist/commit/bb42d1553716d9905613c6bc5c9088b9344afef6) on GitHub; official repository

**2024-11-20 · UsedName** · others' IDs\
Its social list struct includes the Account ID, logged only in debug builds.\
Severity: LOW\
Goes to: local only (debug log, not in release builds).\
Commit [`64b086d`](https://github.com/LittleNightmare/UsedName/commit/64b086d6149a62020f7bea905e404c54dafdb77d) on GitHub; official repository

**2024-12-04 · RetainerTrack (Liza Carvelli)** · others' IDs\
v4.3 stores the raw Account ID of nearby players and social lists in a local database (added after patch 7.0 exposed it).\
Severity: MEDIUM\
Goes to: local only (SQLite database).\
Commit [`d732d46`](https://github.com/RedAsteroid/DalamudPlugins/commit/d732d46cec4db195aede438b8d1365abc33c6248) on GitHub (redistributed build); decompiled 4.3

**2024-12-18 · ChatTwo** · others' IDs\
Keeps the sender's Account ID in memory to add them to the game's mute list.\
Severity: LOW\
Goes to: local only (in memory, passed back to the game).\
Commit [`7cbaf77`](https://github.com/Infiziert90/ChatTwo/commit/7cbaf77fe22da7f4e7b1b171c02d1b15c62e1042) on GitHub; official repository

**2025-01-10 · Dalamud**\
Statement: plugins can read Account IDs and Dalamud cannot prevent it.\
[dalamud.dev](https://dalamud.dev/news/2025/01/10/account-ids-and-plugins/)

**2025-01-10 · Mare Synchronos** · own + others' IDs\
The developer's Discord announcement argues "the primary reason for the switch was access control, aka to ensure the effectiveness of security actions such as bans". It also pretends the Account ID's hash "is not stored or connected to your Mare account in any long-term fashion", but its log had no retention or rotation limit in the code.\
[Archived screenshot](https://arch-img.b4k.dev/vg/1755846833955.png)

**2025-01-14 · CN Dalamud (OtterCorp)** · own ID\
Telemetry adds a hardware ID (MAC, CPU, disk), also sent as `X-Machine-Token` to every plugin repository.\
Severity: HIGH\
Goes to: OtterCorp telemetry server and every plugin repository.\
Commit [`9df793ae`](https://github.com/ottercorp/Dalamud/commit/9df793aee9df43601d76e2948bf708b8f81902d5) on GitHub

**2025-01-15 · Mare CN (OtterCorp)** · own ID\
Login sends `aidHash` and `machineId`; bans by account and by machine.\
Severity: HIGH\
Goes to: Mare CN server.\
Commits [`3dd37b8`](https://github.com/ottercorp/Mare-client/commit/3dd37b8f580545fff2cf5acf9dbb5cfe97511499) (client) and [`1950d80`](https://github.com/ottercorp/Mare-server/commit/1950d804bcc31400395cb9c5df6d2ec3862379c0) (server) on GitHub

**2025-01-24 · Square Enix**\
Yoshida: tools display "a segment of an FFXIV character's internal account ID"; asks players to stop; legal action considered.\
[SE forum](https://forum.square-enix.com/ffxiv/threads/515102-Regarding-the-Use-of-Third-Party-Programs-and-Player-Safety)

**2025-02-24 · PvpStats**\
Stops saving Account IDs (and Content IDs).\
Commit [`72a8123`](https://github.com/wrath16/PvpStats/commit/72a8123871ca750bb96aa6bab4e9fd4e2d224d45) on GitHub

**2025-03-25 · Square Enix**\
Patch 7.2 masks other players' Account IDs ("help prevent the identification of account IDs").\
[Patch 7.2 notes](https://na.finalfantasyxiv.com/lodestone/topics/detail/3c4910f373e497acd3428c37f6358e341e4cc06d/)

**2025-03-27 · Mare Synchronos** · own + others' IDs\
Reads the own ID via static signature `48 8B 0D ?? ?? ?? ?? 4C 8B CA`; an XOR formula undoes the 7.2 masking for other players.\
Severity: HIGH\
Goes to: Mare server (own hash); other players' unmasked hashes are matched locally.\
Commit [`ed604d9`](https://github.com/universalconquistador/MareSynchronosClient/commit/ed604d9bd65f6cff1dad496e11c53127fd216909) on GitHub

**2025-03-27 · Visibility**\
The VoidList switches to Content IDs, two days after patch 7.2.\
Commit [`8542db3`](https://github.com/SheepGoMeh/VisibilityPlugin/commit/8542db38fd28900a357511b021d298655e350574) on GitHub

**2025-06-19 · PlayerScope** · others' IDs\
Shut down after a cease-and-desist; data reportedly deleted.\
[Destructoid](https://www.destructoid.com/final-fantasy-xivs-controversial-stalker-plugin-is-taken-offline-after-cease-and-desist-threat-as-fans-rejoice/)

**2025-06-24 · CN Dalamud (OtterCorp)** · own ID\
Adopts Mare's signature to keep reading the real own ID.\
Severity: HIGH\
Goes to: OtterCorp telemetry server.\
Commit [`95414720`](https://github.com/ottercorp/Dalamud/commit/954147208bc23a2425de18859993d060817ba183) on GitHub

**2025-06-25 · RetainerTrack (Liza Carvelli)** · own + others' IDs\
v6.2 adds Mare's account-record signature and XOR formula to undo the 7.2 masking; still stored locally only.\
Severity: MEDIUM\
Goes to: local only (SQLite database).\
Commit [`88cc967`](https://github.com/RedAsteroid/DalamudPlugins/commit/88cc967167a04d65318e351e40d748f2131acd3f) on GitHub (redistributed build); decompiled 6.2

**2025-08-05 · Square Enix**\
Patch 7.3: "further adjustments" to obscure character IDs.\
[Patch 7.3 notes](https://na.finalfantasyxiv.com/lodestone/topics/detail/c04405c6cbe8519a0b6c8aa5e4d88a5d447419c9/)

**2025-08-08 · Mare Synchronos**\
Drops Account IDs ("fix aid discrepancy"); identity becomes `SHA256(ContentId)`.\
Commit [`b15f6f2`](https://github.com/universalconquistador/MareSynchronosClient/commit/b15f6f2c2a45c9c347f5f606c2df991074b60f94) on GitHub

**2025-08-11 · Mare CN (OtterCorp)** · own ID\
Merges the change for player matching, but keeps `aidHash` as its ban key.\
Severity: HIGH\
Goes to: Mare CN server.\
Commit [`688dc40`](https://github.com/ottercorp/Mare-client/commit/688dc403fd48051d4fd4865a1fbcea247b7e5efd) on GitHub

**2025-08-21 · Lightless Sync** · others' IDs\
Successor of Mare, from its final code: the Account ID is only used to avoid loading mods of players on its user's own in-game blocklist.\
Severity: LOW\
Goes to: local only (passed back to the game).\
Commit [`dd2e9bf7`](https://git.lightless-sync.org/Lightless-Sync/LightlessClient/commit/dd2e9bf7d1833fbf846c9cf14fb888600430231d) on Lightless' Git

**2025-08-22 · Mare Synchronos**\
Service shut down after a "legal inquiry".\
[Massively OP](https://massivelyop.com/2025/08/22/the-maker-of-a-popular-final-fantasy-xiv-cosmetic-mod-tool-has-ended-dev-over-a-legal-inquiry/)

**2025-08-24 · PlayerSync** · others' IDs\
Successor of Mare, from its final code: the Account ID is only used to avoid loading mods of players on its user's own in-game blocklist.\
Severity: LOW\
Goes to: local only (passed back to the game).\
Commit [`fd2f323`](https://github.com/universalconquistador/MareSynchronosClient/commit/fd2f323e2a66d4bd645335b453d3d8ea18dcfca7) on GitHub

**2025-09-16 · Mare CN (OtterCorp)** · own ID\
`aidHash` becomes mandatory for login (completed 2025-10-09).\
Severity: HIGH\
Goes to: Mare CN server.\
Commits [`eb879f1`](https://github.com/ottercorp/Mare-server/commit/eb879f13be8415f60779155fc0b5d1674c7a38b9) and [`12f3757`](https://github.com/ottercorp/Mare-server/commit/12f37576dcf3cb0fded666d7f2818185b81b7a82) on GitHub

**2025-12-19 · CN Dalamud (OtterCorp)**\
All telemetry removed ("remove unused and dead code").\
Commit [`6b032f62`](https://github.com/ottercorp/Dalamud/commit/6b032f62736a05d9f07bc256644b6054937cfc4f) on GitHub

**2026-04-02 · NekoAuth (Small-Miao)** · own ID\
Licence credential `MD5("NekoV#" + AccountId)`, read from the game's account record and linked to every character the user logs in on. Used by DailyRoutines (AtmoOmen), and by the paid NyaDraw (NiGuangOwO), which also sends WMI hardware IDs.\
Severity: HIGH\
Goes to: NekoAuth licence server.\
Decompiled DailyRoutines 2.0.2.5 – 2.2.3.3 and NyaDraw 1.14.0.35 – 1.15.1.1; commit [`803ddb1`](https://github.com/Dalamud-DailyRoutines/DailyRoutines.Localizations/commit/803ddb1a8fbc9d59d5d9e6423000e4ff02856edb) on GitHub

**2026-05-14 · PeepingTom** · others' IDs\
Hides blacklisted players from its target list by checking the game's blacklist with their Account ID.\
Severity: LOW\
Goes to: local only (passed back to the game).\
Commit [`3149902`](https://github.com/Caraxi/PeepingTom/commit/31499024f21b3ecd46555d58dd982c7fb44f7afb) on GitHub; official repository

**2026-05-30 · Memoria** · others' IDs\
v1.0.1: "Alt characters on the same account now link together reliably".\
Severity: HIGH\
Goes to: Memoria server and public website.\
[wtf.memoria.gg](https://wtf.memoria.gg/historical.html)

**2026-06-26 · PFRadar (decorwdyun)**\
No Account ID use; its UI notes the blacklist highlight "stopped working after 7.3".\
Decompiled 1.5.0.7

**2026-06-29 · Memoria** · others' IDs\
v1.3.0: account linking from server messages instead of in-memory values.\
Severity: HIGH\
Goes to: Memoria server and public website.\
[wtf.memoria.gg](https://wtf.memoria.gg/historical.html)

**2026-07-02 · Memoria**\
Shut down; alt display removed (critics claim back-end collection continued).\
[finalboss.io](https://finalboss.io/how-a-stalking-scandal-just-killed-ffxivs-memoria)

**2026-07-08 · EchoVault** · others' IDs\
Uploads `Character.AccountId` of nearby players and social lists with every sighting.\
Severity: HIGH\
Goes to: EchoVault server and public website.\
First mention on the [/vg/ archive](https://arch.b4k.dev/vg/thread/573322719/#573325512); decompiled 0.6.0 – 0.8.4

**2026-07-13 · Dalamud**\
Update: Square Enix's fix "is not enough to prevent malicious users".\
[dalamud.dev](https://dalamud.dev/news/2026/07/13/an-update-on-account-ids)

## Plugins scoping nearby players

**2023-02-25 · RetainerTrack (Liza Carvelli)**\
Repository created; tracks the players behind retainers and the characters seen nearby and in social lists. Account IDs added from 2024 (see above).\
Severity: MEDIUM\
Collects: Content ID, name (and later Account ID) of nearby players and social lists.\
Goes to: local SQLite only.\
[Archived repository](https://web.archive.org/web/20240619/https://git.carvel.li/liza/RetainerTrack); decompiled 4.3 – 6.2

**2024-07-17 → 2025-08-08 · Mare Synchronos**\
Severity: LOW\
Collects: the Account ID hash of every nearby player, to find paired users.\
Goes to: local matching only (the user's own hash goes to the server).\
Commits [`bfafcad`](https://github.com/universalconquistador/MareSynchronosClient/commit/bfafcad8e8b84f0c82094aac63e5fc8a9e77c6b9) → [`b15f6f2`](https://github.com/universalconquistador/MareSynchronosClient/commit/b15f6f2c2a45c9c347f5f606c2df991074b60f94) on GitHub

**2025-01-17 → 2025-06-19 · PlayerScope**\
Severity: HIGH\
Collects: characters and alts of players met.\
Goes to: public database and website.\
[SE forum](https://forum.square-enix.com/ffxiv/threads/515102-Regarding-the-Use-of-Third-Party-Programs-and-Player-Safety), [Destructoid](https://www.destructoid.com/final-fantasy-xivs-controversial-stalker-plugin-is-taken-offline-after-cease-and-desist-threat-as-fans-rejoice/)

**2025-04-04 · PFRadar (decorwdyun)**\
Repository created; Party Finder "X-ray" (see a listing's members without joining).\
[decorwdyun/PFRadar](https://github.com/decorwdyun/PFRadar)

**2025-04-30 · DailyRoutines (AtmoOmen)**\
"Check previous names" queries a server-side rename history, so player history was already stored.\
Severity: HIGH\
Goes to: the authors' server.\
Commit [`56a61fe`](https://github.com/Dalamud-DailyRoutines/DailyRoutines.ModulesPublic/commit/56a61fe8b6ef9ec36c134e09d151180e128ff091) on GitHub

**2025-10-05 · Lightless Sync**\
Lightfinder, off by default, shows which nearby players are also broadcasting.\
Severity: HIGH\
Collects: `SHA256(ContentId)` of every nearby player while the user broadcasts, including players who don't use Lightfinder or Lightless.\
Goes to: Lightless server, which only checks them against current broadcasters in its public code.\
Commit [`7672f147`](https://git.lightless-sync.org/Lightless-Sync/LightlessClient/commit/7672f147f5bb53505f690eb1554657626a7a2544) on Lightless' Git

**2026-02-20 · HuntVoidWatcher (konvarec)**\
Closed-source hunt tool, distributed with an access key. Each feature below is off by default and set up by the user.\
Severity: HIGH\
Collects: name and home world of any nearby player doing something that can spawn an S rank; all public chat messages with their senders's names.\
Goes to: Discord webhooks set by the user.\
[Distribution repository](https://github.com/konvarec/HuntVoidWatcherCustomRepo); decompiled 0.5.0.71

**2026-04-02 · DailyRoutines (AtmoOmen)**\
Severity: HIGH\
Collects: Content ID, name, home and current world of nearby players, friend / FC / linkshell / Player Search lists and Party Finder. No setting, undisclosed.\
Goes to: `103.236.67.155` (2.0.2.5), later `103.236.64.225`, over plain HTTP.\
Decompiled 2.0.2.5 – 2.2.3.3

**2026-04-24 → 2026-07-02 · Memoria**\
Severity: HIGH\
Collects: nearby players, names, worlds, sightings, alts.\
Goes to: public database, website, Discord bot.\
[wtf.memoria.gg](https://wtf.memoria.gg/historical.html), [archived repository](https://web.archive.org/web/20260702041033/https://github.com/RoseOfficial/Memoria)

**2026-06-26 · PFRadar (decorwdyun)**\
Severity: HIGH\
Collects: `{Content ID, name, home world, source}` of nearby players and character lists; PF listings. Its disclosure claims "only names and home worlds".\
Goes to: raw TCP to `49.235.185.254:53188` and `milalla.xuolu.com:56188`.\
Decompiled 1.5.0.7

**2026-07-08 · EchoVault**\
Successor of Memoria.\
Severity: HIGH\
Collects: Content ID, Account ID, name, worlds, position, job, level, FC tag, appearance, equipment, title, mount, online status...\
Goes to: EchoVault's server and public website `echovault.gg`.\
Decompiled 0.6.0 – 0.8.4
