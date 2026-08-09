Policy Violations
=================

.. note::

   This page cross-references Echo's behavior against published rules from
   Square Enix and from the Dalamud project. Quotations are drawn from the pages
   cited under each item.

Square Enix — FINAL FANTASY XIV User Agreement
-------------------------------------------------

**Data mining prohibition**

    "You may not intercept, mine or otherwise collect information from the Game using
    unauthorized third-party software."

    — `FINAL FANTASY XIV User Agreement
    <https://support.na.square-enix.com/rule.php?id=5382&tag=users_en>`_

Echo continuously reads other players' character data directly out of the running game
client — their position, appearance, gear, and internal account identifiers — and
uploads it to a third-party server it controls. This is precisely what the clause
describes: unauthorized third-party software mining information from the game.

**Prohibition on automated / "absentee" play**

    "Square Enix strictly prohibits the use of third-party programs or tools as these
    disrupt the balance of the game. Third-party programs and tools that permit
    automated or 'absentee' play are prohibited."

    — Summarized from `Prohibited Activities in Final Fantasy XIV
    <https://support.na.square-enix.com/faqarticle.php?id=5382&la=1&kid=68216>`_

Echo's opt-in "Auto-sweep Player Search" feature writes directly into the game
client's memory and calls the client's own network-request function to fire off
Player Search queries to Square Enix's servers on a randomized timer, with no direct
input from the player. That is a program submitting requests to the game servers on
the player's behalf while they are idle.
(see :ref:`auto-search-sweep` in :doc:`http_protocol`).

**Square Enix's own statement about a comparable plugin**

In Yoshi-P's forum statement `Regarding the Use of Third-Party Programs and Player Safety
<https://forum.square-enix.com/ffxiv/threads/515102-Regarding-the-Use-of-Third-Party-Programs-and-Player-Safety>`_,
Square Enix addressed a different plugin found to extract "character information not
normally visible in-game" specifically calling out one that surfaced "a segment of an
FFXIV character's internal account ID" in order to "correlate data across multiple
characters on the same service account." The statement:

- reiterates that "the use of third-party tools is prohibited by the FINAL FANTASY XIV User Agreement";
- states this kind of tool "could threaten the safety of players";
- and describes the response as pursuing both takedown of the tool and "legal action against developers."

Echo's own uploaded records include an explicit ``accountId`` field for **every other
player it observes**, read directly from the same internal game structure (see
:ref:`sighting-schema`). This is not an edge case adjacent to the incident Square
Enix described — it is the same category of data, collected about the same class of
victim (players who never installed the tool), for the same purpose (correlating
identity across characters).

Dalamud — project statements and developer guidelines
----------------------------------------------------------

**Statement on Account IDs and Plugins (2025-01-10)**

Responding to a plugin that "reads and stores" the account and content IDs of *other*
players, the Dalamud team wrote:

    "the Dalamud project fundamentally does not approve of the plugin in question."

    — `Statement on Account IDs and Plugins
    <https://dalamud.dev/news/2025/01/10/account-ids-and-plugins/>`_

The same statement points players toward the game's Blacklist and Report features "if
they have concerns about stalking or harassment" — implicitly acknowledging that
plugins which harvest these IDs about other players create exactly that risk. Echo
does precisely what this statement describes and disavows: it reads and permanently
stores both the ``ContentId`` and ``AccountId`` of every other player it sees, then
uploads them off the local machine to a server neither the observed player nor
Square Enix controls. The same statement also concedes the limits of Dalamud's own
enforcement: it maintains control over official-repository plugins through the
submission and review process, but "we cannot control plugins from custom
repositories as a matter of design" — the exact gap Echo's distribution model sits
in, described next.

**Plugin Publishing — the open-source / auditability requirement**

Every plugin distributed through Dalamud's official repository is required to be
open source, specifically so it can be reviewed before it ever reaches a player:

    "All plugins in the official repository are open-source, and no closed-source
    plugins are accepted. This means that their code can be inspected by anyone,
    should they wish to do so."

    — `Plugin Approval Process
    <https://dalamud.dev/plugin-publishing/approval-process/>`_

The mechanism behind that "ensures that both Dalamud and its plugins remain completely
open source and auditable by anyone interested"
(`Plugin Submission <https://dalamud.dev/plugin-publishing/submission/>`_).
The submission repository itself lists, as a bare prerequisite, that a plugin be hosted
on "a publicly accessible Git repo (GitHub, GitLab, or any self-hosted Git instance
that allows HTTP clones without authentication)"
(`DalamudPluginsD17 README <https://github.com/goatcorp/DalamudPluginsD17>`_).

Echo is not open source. Every fact in this documentation was reconstructed from
*decompiled* binaries precisely because no public source repository was
available to read instead; decompilation is only necessary when the original source
isn't published. That fact alone means Echo could never legitimately pass through
Dalamud's official review pipeline, independent of every other violation on this page.

**Plugin Restrictions — explicit account-ID rule**

Dalamud's own plugin-restrictions guidance states the rule directly, not as inference:

    "your plugin does not collect account IDs of player characters beyond your own in
    any form, regardless of the intended use or whether it is exposed to users."

    — `Plugin Restrictions <https://dalamud.dev/plugin-publishing/restrictions/>`_

``AccountId`` is a named field, populated for every captured player, in Echo's own
source (``ObjectTableSweeper.Capture`` and ``SocialCollector.CollectProxy``)

**Plugin Restrictions — automated server interaction**

The same guidance also states that plugins must not:

    "interact with the game servers in a way that is automatic, as in polling data or
    making requests without direct interaction from the user."

    — `Plugin Restrictions <https://dalamud.dev/plugin-publishing/restrictions/>`_

Echo's ``SearchSweeper`` does exactly this: while the local player is idle, it fires
Player Search requests to the game server on a randomized timer, entirely without
input from the user for each individual search. See :ref:`auto-search-sweep` for the
mechanism.

**Technical Considerations — telemetry must be opt-in, minimal, and anonymized**

Dalamud's developer guidance on data collection states that non-essential data
collection "requires... explicit user opt-in," which "may be done as part of a config
option or a welcome wizard that forces a choice"; that developers "should hash
information about the local player... on the client side so that a server-side data
breach does not reveal information"; and that any analytics identifier "must not
contain or be derived from any personal information" and should be designed so "a user
cannot be deanonymized even with full access to the raw datasets."

    — `Plugin Technical Considerations
    <https://dalamud.dev/plugin-development/technical-considerations/>`_

Echo's most invasive collectors — the constant nearby-player sweep, Party Finder
capture, and Friend List / Free Company roster capture — are **enabled by default**
the first time the plugin activates on a character (``PersistedSettings`` defaults to
``true`` for each); nothing resembling a forced consent choice is shown before capture
begins, which is the opposite of what this guidance asks for.

**Technical Considerations — data must be topical to the plugin**

The same page states that "data collection must be topical to the plugin in question,"
illustrated with an example: a Party Finder plugin may track which face types clear a
specific fight, but may not track general population appearance data unrelated to that
purpose.

Echo's own stated purpose — building a population "census" via a public
per-character profile site — is not a byproduct of some other feature; cataloguing
every other player *is* the feature. 
