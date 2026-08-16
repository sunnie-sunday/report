:og:description: Breakdown of all types of Lodestone Echo codes.

Types of Echo Lodestone codes
=============================

Some characters can currently be found on the Lodestone with Echo codes in their bios.
This can lead to some confusion so here is a little breakdown of them:

Claim codes
-----------

Format: ``echo-claim-deadbeef``

This code is for the "Claim your character" feature of EchoVault.
We do not recommend to use this as the process sends data about you to EchoVault's developper.

Characters with this code *could* be users, but most of them just wants control over their own characters on the site.

Takedown codes
--------------

Format: ``echo-takedown-deadbeef``

This code is for the "Character removal" form of EchoVault.
We do not recommend to use this as it still sends data about you to EchoVault's developper
(he has also shared the form's content on his Discord to make fun of it in the past).

Again, characters with this code *could* be users hiding themselves on the site,
but most of them just wants to be removed for privacy reasons.

User verification codes
-----------------------

Format: ``ECHO-DEADBEEF``

There is only one use for this code: becoming a verified user to contribute sightings to EchoVault.
Some users didn't even delete that code from their character's bio.

.. include:: _verified.rst

EchoVault's server will throw an ``"already_claimed"`` error at the ``/v1/auth/verify/start`` endpoint if the user is already verified.
See :doc:`http_protocol`.
