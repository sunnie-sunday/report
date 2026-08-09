What is Echo?
=============

.. _echo-start:

**Echo** is a third-party plugin for **Final Fantasy XIV** that runs continuously in the background while the game is open.
While active, it sweeps through every player character it can see and uploads detailed information about them,
building a searchable public "census" of players without their knowledge or consent.

Because the *About* and *FAQ* pages on **EchoVault's** website are extremely dishonest
on what is actually being collected, we are documenting it from analyzing it's decompiled code.

.. _echo-end:

.. warning::

   This page describes the behavior of a plugin distributed under the names
   **Echo** and it's server **EchoVault** (``echovault.gg``).
   Every claim made here is traceable in that plugin's code (``v0.8.3``)

Who ends up in its database?
----------------------------

Not just the person who installed Echo. Echo logs *anyone it can see or interact with*,
including people who:

- Are simply standing near an Echo user, in a city, in the open world, or in a duty.
- Have the Echo user on their **friends list**, or are in the same **Free Company**,
  even if they're offline or on the other side of the map when Echo reads that list.
- Post a **Party Finder** listing that an Echo user happens to see.
- Get **right-clicked** by an Echo user for any reason — the target is logged the
  instant the context menu opens, whether or not the Echo user picks anything from it.
- Show up in the results when an Echo user runs a normal **Player Search** — or, if the
  Echo user has turned on an extra "auto-sweep" option, show up in *searches the plugin
  runs on its own*, described further below.

You do not need to have Echo installed, know it exists, or have ever spoken to the
person running it, to end up in its database.

Captured information
--------------------

For every character it observes, Echo can capture:

- The character's exact name and home world.
- Exactly where they are — precise **in-game coordinates**,
  plus which **zone** they're currently in.
- Their job/class and level.
- Their Free Company tag.
- Their **full appearance** — race, clan, gender, face, hairstyle, skin tone
  and every other appearance slider — encoded so they could reconstruct
  the character's exact look.
- **Every piece of gear** they're wearing, including the specific dye colors used, and
  both of their equipped weapons.
- Their current mount, their **online status**, and which duty they're currently inside.
- Their equipped title.
- Two separate, **permanent ID numbers** issued by Square Enix: one identifies that
  specific character forever (it survives name changes), and the other identifies the
  player's *entire account* — the number that would let someone connect a player's
  alternate characters to one another. Square Enix and the team behind Dalamud have
  each separately and publicly said, in response to a different plugin doing this
  exact thing, that harvesting that second number is a safety problem, not a gray area.
  See :doc:`policy_violations` for the direct quotes.

None of this requires the person being recorded to do anything at all. Being visible
on an Echo user's screen for a moment is enough.

While some of this data isn't currently being used on EchoVault's web interface,
it's still being collected for archival and possible future uses.

How does it work?
-----------------

Echo doesn't wait for the player running it to do anything — it runs several automatic
collectors at once, for as long as the game is open:

**Constant background scanning.**
Every five seconds, Echo scans *every player character currently rendered on the
Echo user's screen* and records anyone it hasn't already logged recently. A second,
faster check runs every second specifically to catch anyone who *just* walked into
view, so nobody avoids it just by passing through quickly.

**Reading your friends list and FC roster, even from afar.**
Once a minute, Echo reads straight out of the game client's internal memory: the Echo
user's Friend List, their Free Company roster, and several other social lists the game
already keeps track of for them. This means a character can be logged simply because
someone who has *them* on a friends list, or in the same FC, is running Echo —
regardless of whether that character is even online.

**Party Finder and right-click capture.**
Every listing that shows up in the Party Finder window is captured automatically. So
is whoever the Echo user was last targeting the instant they open a right-click menu
on a player — even if they close the menu without clicking anything in it. Echo even
adds a "View on EchoVault" option to that same menu, openly advertising that the
target now has a page on the website.

An optional feature called **Auto-sweep Player Search**. When turned on, it will quietly
and repeatedly run the game's own "Player Search" feature on its own: cycling through
every job, every level range, and every searchable region of the game world, purely to
sweep up as many strangers as possible. The plugin's own author warns that this crosses
into automated play (bot).

All of this runs silently, all the time, in the background. There is no in-game
warning, banner, or consent screen shown to the people being recorded, because they
are not the ones who installed anything.

Where does it all go?
---------------------

Everything collected is bundled up and sent to a third-party website (``echovault.gg``)
that has no affiliation with Square Enix. That site builds a public profile page for
each character assembled entirely from data that neither the character's owner nor
Square Enix agreed to hand over.

There is also a feature that lets an Echo user link a character to its public Square
Enix Lodestone (forum) profile, by pasting a verification code into that profile's
bio. That step is meant to prove the person running Echo actually owns the character
they're claiming — but its side effect is permanently and publicly tying an
Echo-collected profile to a real, named, and searchable Square Enix identity page.

How can it be disabled?
-----------------------

Only the person *running* Echo can change its settings — you have no control over any
of this if you're simply near someone using it, in their party, on their friends list,
or in their FC. And several of the most invasive collectors — the constant nearby-player
scan, the Party Finder capture, and the Friend List / FC roster capture — are switched
**on by default** the very first time Echo starts on a character.

While recent EchoVault updates have hidden characters with private Lodestone profiles,
this does not prevent them from collecting your character's information described above.

tl;dr
-----

If you have ever stood near someone running this plugin, been in their party, been on
their friends list, been in their Free Company, or shown up in a Party Finder listing
they happened to see — your character's appearance, gear, location, current status,
and two sensitive identifiers may already be sitting in a database on a website you
have never heard of, without your knowledge or consent, viewable by strangers.
