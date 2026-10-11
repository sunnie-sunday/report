---
title: "Daily Routines"
description: "Early code analysis of Daily Routines, a new plugin with a stalking behavior similar to EchoVault."
weight: 30
---

Early code analysis of **Daily Routines**, a new plugin with a stalking behavior similar to **EchoVault**.
This report was quickly built in a day by decompiling the plugin's modules with ILSpy and analyzing it with AI (Claude Code's Opus 5.5).

## Daily Routines vs EchoVault: What Gets Recorded

**Both plugins quietly record the players around you and send them to a server run by the plugin's makers. EchoVault records far more about each player, including the ID that links their alts. Daily Routines records less about other players, but takes that same alt-linking ID from its own users.** Based on Daily Routines version 2.2.3.1.

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
| **Account ID (links their alts)** | **Yes** | **No** |
| Zone and exact spot on the map | Yes | No |
| Duty they are in | Yes | No |
| Appearance (race, face, hair, everything) | Yes | No |
| Gear and glamour, with dyes | Yes | No |
| Job, level, FC tag, title, Grand Company | Yes | No |
| Mount and online status | Yes | No |
| **Where you were when you saw them** | Yes | No |
| **How it works** |  |  |
| How often the same player is sent again | Every few minutes, or whenever anything about them changes | At most every 15 minutes |
| Can you turn it off? | Yes, in settings (on by default) | **No**, there is no setting |
| Starts when | You install it | You install it, whatever features you use |
| **What anyone can see later** |  |  |
| Where it shows | A public website anyone can browse | Inside the plugin: your friend list and blacklists |
| Current name and world from a character ID | Yes | Yes |
| Past names and world transfers | Yes | Yes |
| Where and when they were seen, activity over time | Yes | No |
| Their alts | Yes | No |
| Their outfits over time | Yes | No |

Daily Routines' blacklists can also be stored on its server and shared between users. Each entry records which character added it.

## Account IDs: yours, not theirs

**EchoVault takes the Account ID of the players you meet. Daily Routines leaves theirs alone but takes yours.**

|  | EchoVault | Daily Routines |
| --- | --- | --- |
| Account ID of players you meet | **Sent** to its server, to list their alts | Looked at only to check the player is real; **never sent** |
| Your own Account ID | Not sent | **Sent**, every time you log in, lightly scrambled (the scrambling can be undone) |
| Linked to your characters | No | **Yes**: sent together with the character ID of each character you log in with |
| Linked to your PC | No | **Yes**: sent with a fingerprint of your PC's hardware and home network |
| What the server can work out | The alts of everyone its users have met | The alts of everyone who uses the plugin, and which PC they play on |
| Used to block people from the plugin | No | **Yes**: the makers can remotely shut the plugin off for an account or PC |

What this means: with EchoVault, strangers can find your alts. With Daily Routines, your alts and your PC are known to the plugin's makers, not to other players, as far as the code shows.

One open point: Daily Routines sends sightings to one server and asks a second server for names. That they share the same data is very likely, but not proven.
