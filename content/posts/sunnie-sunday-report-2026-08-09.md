---
title: "Sunnie Sunday Report 2026-08-09"
date: 2026-08-09
---
The initial 10 verified EchoVault contributors found:

{{< character "10431569" >}}
{{< character "42126460" >}}
{{< character "14903427" >}}
{{< character "59845227" >}}
{{< character "61680429" >}}
{{< character "41007569" >}}
{{< character "60733943" >}}
{{< character "23168188" >}}
{{< character "43865878" >}}
{{< character "40795954" >}}

The `HTTP 409` **Conflict** exploit was discovered when creating characters with
the intention of poisoning EchoVault with fake data. Trying to create a reporter
twice with the same character gave me that error, then it was as simple as
trying that same process with other characters to see if they already verified
themselves as sightings contributors too.

Echo's wire API is documented at [Transfer Protocol](/docs/transfer-protocol/).
