---
title: "Sunnie Sunday Report 2026-11-08: Position Exploit Edition"
date: 2026-11-08
---
With new **Lodestone** codes becoming generic and the `HTTP 409` **Conflict**
exploit still not yielding new results... it was time for a new exploit! This
one combines the in-game position of EchoVault contributors with the reporters
X,Y,Z coordinates that was available in a JSON for claimed characters. By using
our own characters as bait and using EchoVault's `/api/me` endpoint, we could
compare those reporter coordinates with the coordinates of characters nearby.
This worked well because nobody moves in this game!

![Download my data (JSON)](download-json.png)

A big thanks to
[u/Particular-Side-3994](https://www.reddit.com/user/Particular-Side-3994/)
for sharing his tools and findings.


{{< character "38244369" >}}

![Princess Shortcake JSON](princess-shortcake-json.png)

![Princess Shortcake sighting](princess-shortcake-sighting.png)

{{< character "21181174" >}}

{{< character "55569859" >}}

{{< character "19179713" >}}

{{< character "13215614" >}}

{{< character "62591450" >}}

{{< character "54299104" >}}

{{< character "34289640" >}}

{{< character "62080541" >}}

{{< character "42169342" >}}

We're publishing those findings since the **Position** exploit is also fixed.
All I will say for now is that there's more exploitable data so this won't
be the end of the **Sunnie Sunday Report** just yet.
