Glossary
===========

.. glossary::
    :sorted:

    Account ID

        .. important::
            No real Account ID has been collected or used to make this
            documentation or the Sunnie Sunday Report exploits possible.

        A permanent identifier Square Enix assigns to a whole service account,
        shared across every character on that account — distinct from a
        :term:`Content ID`, which identifies one character. Harvesting this field
        about other players is the specific behavior both Square Enix and the
        Dalamud project have separately identified as a safety issue when a
        different plugin did it. See :doc:`policy_violations` and the ``accountId``
        row in :ref:`sighting-schema`.

    Content ID
        A permanent identifier for one specific character that survives renames —
        distinct from :term:`Account ID`, which identifies the whole account behind
        potentially many characters. See the ``contentId`` row in
        :ref:`sighting-schema`.

    Dalamud
        The third-party plugin framework and API that Echo (and many other
        *Final Fantasy XIV* plugins) run on. Not affiliated with Square Enix.
        Doesn't endorse, approve of, or support any plugin of a similar nature to Echo.
        :doc:`policy_violations`.

    Echo
        A plugin users install into their FFXIV client that quietly watches every other
        player nearby and reports them to EchoVault's website.

    EchoVault
        The public-facing name of Echo's server and website, ``echovault.gg``.
        Not affiliated with Square Enix.

    Open source
        Whether a plugin's source code is publicly available for review. Dalamud
        requires plugins in its official repository to be open source, specifically
        so a submitted commit can be reviewed before it reaches players. Echo is
        closed source — this documentation exists only because its binaries had to
        be decompiled. See :doc:`policy_violations`.

    Sunnie
        Seeker of the Sun Miqo'te

    Sunnie Sunday
        The day between Caturday and Moonie Monday (every Sunday is a Sunnie Sunday)

    Sunnie Sunday Report
        Weekly report of discovered Echo users who have gone through the
        verification process.

    Telemetry
        Background data a plugin collects about its own operation or usage.
        Dalamud's guidance requires telemetry be opt-in, minimal, and anonymized.
        See :doc:`policy_violations` for how Echo's actual data collection compares
        against that standard.

    Unvaulted
        A pun implying a character was taken out of EchoVault's "Vault".
        No affiliation with projects using the same word.


    Verification

        .. include:: _verified.rst

        The process of proving ownership of a character by pasting a server-issued code
        into that character's public Lodestone profile bio.
        For Echo, it unlocks publishing instant sightings of that user's uploads.
        See :doc:`motives` for the incentive structure this creates.
