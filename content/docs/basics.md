---
title: "What is Echo?"
description: "The behavior of a plugin for FFXIV distributed under the names Echo and it’s server EchoVault."
weight: 10
aliases:
  - /docs/basics.html
---

**Echo** is a third-party plugin for **Final Fantasy XIV** that runs
continuously in the background while the game is open. While active, it sweeps
through every player character it can see and uploads detailed information about
them, building a public “census” of players without their knowledge or consent.

Because the *About* and *FAQ* pages on **EchoVault**’s website are extremely
dishonest on what is actually being collected, we are documenting associated
risks from analyzing it’s decompiled code (`v0.8.4`).

## Who ends up in its database?

Not just the person who installed Echo.
Echo logs anyone it can see or interact with, including people who:

* Are simply standing **nearby** an Echo user.
* Have the Echo user on their **friends list**, or their **Free Company**.
* Post a **Party Finder** listing that an Echo user happens to see.
* Get **right-clicked** by an Echo user for any reason.
* When an Echo user runs a **Player Search**.

You do not need to have Echo installed, know it exists, or have ever spoken to
the person running it, to end up in its database.

## Captured information

| Echo's plugin | Description                        |
| ---           | ---                                |
| ✅            | The character's name.              |
| ⚠️            | The character's permanent ID.      |
| ☢️            | The account's ID stalking alts.    |
| ✅            | The character's home world.        |
| ✅            | The world the character is seen.   |
| ✅            | The zone the character is seen.    |
| ✅            | The character's coordinates.       |
| ✅            | The character's current class/job. |
| ✅            | The character's current level.     |
| ✅            | The character's gender (♂/♀).      |
| ✅            | The character's appearance.        |
| ✅            | Each gear slots appearance.        |
| ✅            | The mount the character is riding. |
| ✅            | The character's used title.        |
| ✅            | The character's FC tag.            |
| ✅            | The character's Grand Company.     |
| ✅            | The character's status icon.       |

## Where does it all go?

Everything collected is sent to a third-party website (`echovault.gg`) that has
no affiliation with Square Enix. That site builds a public profile page for
each character assembled entirely from data that neither the character’s owner
nor Square Enix agreed to hand over.
