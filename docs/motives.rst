:og:description: Every scoring, ranking, and progression mechanic Echo shows its own user.

Motives of Echo users
=====================

.. note::

   This page catalogues every scoring, ranking, and progression mechanic **Echo** shows
   its own user, and examines what those mechanics are for. Everything below is drawn
   from reading the plugin's own decompiled source code.

The other pages in this documentation describe *what* the plugin collects.
Here we ask ourselves why would a player choose to run it, day after day,
once they understand what it does? **Echo** does not just collect data passively
in the background — it wraps that collection as a contest from how much information
was gathered. It's the mechanism that turns a one-time install decision into
sustained, escalating participation.

The mechanics: gamification
---------------------------

Every item below is a distinct scoring or progression system,
all computed from capturing other players

**Named rank tiers with numeric thresholds** (``ScannerMilestones``) — 
three independent tracks, each a ladder of named ranks a player climbs purely
by accumulating more captured data:

.. list-table::
   :widths: 34 33 33
   :header-rows: 1

   * - Lifetime sightings
     - Characters first added by you
     - Territories covered
   * - Scout — 10,000
     - Spotter — 100
     - Wanderer — 10
   * - Surveyor — 100,000
     - Pathfinder — 1,000
     - Explorer — 25
   * - Cartographer — 500,000
     - Trailblazer — 5,000
     - Voyager — 50
   * - Atlas — 1,000,000
     - Vanguard — 10,000
     - Worldwalker — 100
   * - Luminary — 2,500,000
     - —
     - —
   * - Legend — 5,000,000
     - Pioneer — 25,000
     - —

Each track is rendered as a progress bar showing the current tier name and the next,
the same visual language used for experience bars and achievement progress in video games.

First to **catalogue** bonus (``CharactersContributed``),
counts characters the user was the *first* out of everyone
running the plugin, to report. This is a deliberate design choice: it specifically rewards
discovering people nobody else running **Echo** has logged yet.

A **leaderboard** (``ScannerStatsResponse.PercentileBand``),
reports where the user's weekly sighting count ranks against other contributors;
The ``/echovault stats`` chat command surface this
as ``"you're in the top {N}% of contributors this week"`` whenever the band is 75 or
better. For this number to exist at all, the server must be tracking and ranking every
contributor's volume against every other contributor's.

The optional, live **overlay window** (``OverlayWindow``),
keeps a small HUD on screen during play showing the running session sighting count,
A persistent drip of positive feedback for the single behavior the plugin exists to encourage.

The main **Dashboard** tab (``DashboardTab.Draw``),
shows session sightings and rate, zones visited this session, and
— for verified accounts — the current week's count with the percentile line above.
For unverified accounts, it suggests to *"Verify to go live instantly"*,
directly pressuring to complete an identity-verification step, described next.

**Verification**-gated gratification (``POST /v1/auth/verify/complete``).

.. include:: _verified.rst

Newly registered installations have their uploads held in an unspecified "corroboration"
queue rather than published immediately. Completing Lodestone verification removes that delay.

The **Coverage** tab (``CoverageTab.Draw`` / ``ScanSuggestions.Build``),
computes a "novelty percentage" — how much of that world's population is not yet in the
database. It actively points the user toward the specific places where uncatalogued people
are most likely to be found.

Personal motives
----------------

- **Relationship surveillance.** Keeping tabs on a current or former partner's
  location, play schedule, and who they're partied or grouped with — jealousy,
  suspicion, or a breakup one side hasn't emotionally let go of.
- **Post-conflict monitoring.** After a falling-out — a Free Company split, a
  raid-team dispute, a community callout — watching a specific person's
  movements and associations to gather "receipts," anticipate their next move,
  or maintain a sense of leverage over the conflict.
- **Parasocial fixation.** Following a streamer, well-known RPer, or other
  community figure the user has never met but feels entitled to know about,
  driven by fandom attachment rather than any real relationship.
- **Controlling behavior.** Wanting to know where a partner, friend, or FC
  member is and who they're with at all times, as a substitute for trusting
  them or simply asking.
- **Gossip and social currency.** Being "the person who knows things" in a Free
  Company or Discord server — using passively gathered information about who is
  where, with whom, to gain standing or attention within a social group.
- **Insecurity and reassurance-seeking.** Checking on someone repeatedly out of
  anxiety rather than malice — the tool offers a compulsive, always-available
  way to resolve uncertainty that has more to do with the user's own state of
  mind than with the person being watched.
- **Retaliation.** Deliberately building a record on a specific person after a
  dispute, with the explicit intent to use it against them later — for
  harassment, for a callout post, or simply so they "can't hide."
- **Completionist/collector drive.** Independent of any one target, the same
  impulse that drives achievement-hunting or in-game collection-log
  completion — wanting every character "logged" purely because the mechanism
  to do so exists, with no target in mind beyond the count itself.
- **Moral distancing through reframing.** Genuinely not registering the
  activity as surveillance because the plugin describes it as a "census" and
  "coverage" (see the mechanics above) — letting a user do something they
  would recognize as wrong if it were named plainly, while maintaining a
  self-image as a contributor to a benign collective project.

These motives are not mutually exclusive,
and some **Echo** users may likely fall into more than one.

If you feel unsafe
------------------

.. warning::

    This page exists to make **Echo**'s behavior legible to the people it
    affects. It is not a substitute for Square Enix's own support channels,
    or for local law enforcement if things ever do cross into a real-world
    safety concern.

- **Use the game's own block and report tools first.** ``/blocklist add`` stops
  a specific character from whispering, inviting, or otherwise reaching you
  directly; the in-game Support menu's report/GM petition flow is the
  appropriate channel for harassing or threatening behavior tied to a specific
  character, regardless of what plugin (if any) enabled it. (This page
  makes no claim about how Square Enix would respond to a report.)
- **Keep evidence in a form a GM petition can use.** Screenshots, approximate
  in-game times, and the character+world name involved. Avoid editing the
  originals so the record stays usable if you do file a petition.
- **Don't engage the person directly.** Confronting tends to confirm you've
  noticed and can encourage more of the same;
  block-and-report is generally the safer path.
- **Reduce what's passively visible.** Free Company and party visibility
  settings, and your Lodestone character page's own privacy options, control
  some of what a stranger can see or infer.
- **Consider whether a public routine is making you easy to find.** A posted
  static/raid schedule, a regular streaming slot, or a predictable daily
  circuit are the kind of patterns that make repeated tracking easier
  regardless of the tool involved; varying that routine, at least temporarily,
  is a low-cost mitigation.
- **Secure your Square Enix account itself**, separately from the in-game
  behavior: enable the One-Time Password app, use a unique password, and check
  for sessions or linked devices you don't recognize. Account-level compromise
  is a different risk than being watched in-game, but the two can compound.
- **Tell someone in your circle.** An FC or static leader, or a friend who
  plays with you, so you're not the only person who's noticed the pattern.

None of the above requires treating this as a physical-safety emergency — most
in-game tracking never becomes one. But if at any point what you're seeing
does cross into a genuine fear for your real-world safety (for example,
someone demonstrates they know where you actually live), that's the point to
involve local law enforcement or a local victim-support organization, the same
as for any other real-world safety concern.
