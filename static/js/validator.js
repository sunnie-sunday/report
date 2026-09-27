// Header names and JSON field names used to build and verify the signature.
const HOST_HEADER = "Host";
const TIMESTAMP_HEADER = "X-Echo-Timestamp";
const NONCE_HEADER = "X-Echo-Nonce";
const SIGNATURE_HEADER = "X-Echo-Signature";
const SECRET_FIELD_NAME = "hmacSecret";

async function sha256Hex(text) {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return new Uint8Array(digest).toHex();
}

async function hmacSha256Hex(secretBytes, text) {
	const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
	return new Uint8Array(signature).toHex();
}

function findSignedRequests(messages) {
	let secretBase64 = null;
	const signedRequests = [];

	for (let i = 0; i < messages.length; i++) {
		const message = messages[i];

		let json = null;
		try {
			json = JSON.parse(message.body);
		} catch (error) {
			json = null;
		}
		if (json && typeof json[SECRET_FIELD_NAME] === "string") {
			secretBase64 = json[SECRET_FIELD_NAME];
		}

		if (METHOD_LINE_PATTERN.test(message.startLine) && message.headers[SIGNATURE_HEADER]) {
			const startLineParts = message.startLine.split(" ");
			const method = startLineParts[0];
			// The request-line may be an absolute URL or a bare path + Host.
			const host = message.headers[HOST_HEADER];
			const path = new URL(startLineParts[1], "http://" + host).pathname;

			signedRequests.push({
				method: method,
				path: path,
				body: message.body,
				timestamp: message.headers[TIMESTAMP_HEADER],
				nonce: message.headers[NONCE_HEADER],
				signature: message.headers[SIGNATURE_HEADER],
				secretBase64: secretBase64,
				pre: message.sourcePre
			});
		}
	}

	return signedRequests;
}

async function checkSignature(request) {
	if (!request.secretBase64) {
		return { valid: false, error: "no hmacSecret found before this request" };
	}

	const minifiedPayload = JSON.stringify(JSON.parse(request.body));
	const unminifiedPayload = JSON.stringify(JSON.parse(request.body), null, 2);
	const payloadHash = await sha256Hex(minifiedPayload);
	const canonicalString = [request.method, request.path, payloadHash, request.timestamp, request.nonce].join("\n");
	const secretBytes = Uint8Array.fromBase64(request.secretBase64);
	const computedSignature = await hmacSha256Hex(secretBytes, canonicalString);

	return {
		valid: computedSignature.toLowerCase() === request.signature.toLowerCase(),
		payload: unminifiedPayload,
		payloadHash: payloadHash,
		timestamp: request.timestamp,
		nonce: request.nonce,
		canonicalString: canonicalString,
		secretBase64: request.secretBase64,
		computedSignature: computedSignature,
		error: null
	};
}

function technicalDetailsHtml(result) {
	return (
		"<details>" +
			"<summary>Technical details</summary>" +
			"<table>" +
				"<tr><td><strong>payload:</strong></td><td><code>" + result.payload + "</code></td></tr>" +
				"<tr><td><strong>payload-sha256:</strong></td><td><code>" + result.payloadHash + "</code></td></tr>" +
				"<tr><td><strong>timestamp:</strong></td><td><code>" + result.timestamp + "</code></td></tr>" +
				"<tr><td><strong>nonce:</strong></td><td><code>" + result.nonce + "</code></td></tr>" +
				"<tr><td><strong>canonical:</strong></td><td><code>" + result.canonicalString + "</code></td></tr>" +
				"<tr><td><strong>hmac-secret:</strong></td><td><code>" + result.secretBase64 + "</code></td></tr>" +
				"<tr><td><strong>computed:</strong></td><td><code class=\"sig-computed\">" + result.computedSignature + "</code></td></tr>" +
			"</table>" +
		"</details>"
	);
}

// Hides the icon, title and plain-language message while the technical details.
function hideMessageWhileDetailsOpen(popup) {
	const details = popup.querySelector("details");
	const icon = popup.querySelector(".swal2-icon");
	const title = popup.querySelector(".swal2-title");
	const message = popup.querySelector(".sig-popup-message");
	details.addEventListener("toggle", function () {
		icon.style.display = details.open ? "none" : "";
		title.style.display = details.open ? "none" : "";
		message.style.display = details.open ? "none" : "";
	});
}

function openPopup(result) {
	if (result.error) {
		Swal.fire({
			icon: "warning",
			title: "Could not be checked",
			text: result.error
		});
	} else if (result.valid) {
		Swal.fire({
			icon: "success",
			title: "Authentic",
			html: '<p class="sig-popup-message">This request is authentic.<br>Nothing was changed after it was signed.</p>' + technicalDetailsHtml(result),
			width: "40rem",
			didOpen: hideMessageWhileDetailsOpen
		});
	} else {
		Swal.fire({
			icon: "error",
			title: "Tampered",
			html: '<p class="sig-popup-message">This request does not check out.<br>It may have been altered after it was signed.</p>' + technicalDetailsHtml(result),
			width: "40rem",
			didOpen: hideMessageWhileDetailsOpen
		});
	}
}

function readMessages(preElement) {
	const messageLines = splitIntoMessages(preElement.textContent);
	const messages = [];
	for (let i = 0; i < messageLines.length; i++) {
		const message = parseMessage(messageLines[i]);
		message.sourcePre = preElement;
		messages.push(message);
	}
	return messages;
}

// Gathered from the whole group rather than from a single <pre>.
function readMessagesFromGroup(preElements) {
	let messages = [];
	for (let i = 0; i < preElements.length; i++) {
		messages = messages.concat(readMessages(preElements[i]));
	}
	return messages;
}

function setUpGroup(preElements) {
	const signedRequests = findSignedRequests(readMessagesFromGroup(preElements));
	if (signedRequests.length === 0) {
		return;
	}

	// Re-reads the group's current text and recomputes to prevent edits.
	const requestsByPre = new Map();
	for (let i = 0; i < signedRequests.length; i++) {
		const pre = signedRequests[i].pre;
		if (!requestsByPre.has(pre)) {
			requestsByPre.set(pre, []);
		}
		requestsByPre.get(pre).push(signedRequests[i]);
	}
	requestsByPre.forEach(function (requestsInPre, pre) {
		let html = pre.innerHTML;
		for (let i = 0; i < requestsInPre.length; i++) {
			html = html.replace(
				requestsInPre[i].signature,
				'<button type="button" class="sig-value">' + requestsInPre[i].signature + "</button>"
			);
		}
		pre.innerHTML = html;
	});

	const observer = new MutationObserver(function () {
		for (let i = 0; i < preElements.length; i++) {
			preElements[i].querySelectorAll(".sig-value").forEach(function (button) {
				button.classList.remove("sig-valid", "sig-invalid");
			});
		}
	});
	for (let i = 0; i < preElements.length; i++) {
		observer.observe(preElements[i], { childList: true, characterData: true, subtree: true });
	}

	const localIndexes = new Map();
	for (let i = 0; i < signedRequests.length; i++) {
		const pre = signedRequests[i].pre;
		const localIndex = localIndexes.has(pre) ? localIndexes.get(pre) + 1 : 0;
		localIndexes.set(pre, localIndex);
		setUpButton(preElements, signedRequests[i], localIndex);
	}
}

function setUpButton(preElements, signedRequest, localIndex) {
	const preElement = signedRequest.pre;
	const buttons = preElement.querySelectorAll(".sig-value");
	const button = buttons[localIndex];

	// Re-reads the group's current text and recomputes to prevent edits.
	async function recheck() {
		const currentRequests = findSignedRequests(readMessagesFromGroup(preElements)).filter(function (request) {
			return request.pre === preElement;
		});
		const currentRequest = currentRequests[localIndex];

		if (!currentRequest) {
			button.classList.remove("sig-valid", "sig-invalid");
			return null;
		}

		const result = await checkSignature(currentRequest);

		// Prevent a flashing undecorated state.
		button.classList.remove("sig-valid", "sig-invalid");
		button.classList.add(result.valid ? "sig-valid" : "sig-invalid");

		return result;
	}

	button.addEventListener("click", function (event) {
		event.stopPropagation();
		recheck().then(function (result) {
			if (result) {
				openPopup(result);
			}
		});
	});

	recheck();
}

function groupPreElements() {
	const groups = [];
	const seen = new Set();
	const preElements = document.querySelectorAll("pre");
	for (let i = 0; i < preElements.length; i++) {
		const pre = preElements[i];
		if (seen.has(pre)) continue;

		const container = pre.closest(".bio-text");
		const groupPres = container ? Array.from(container.querySelectorAll("pre")) : [pre];
		for (let j = 0; j < groupPres.length; j++) {
			seen.add(groupPres[j]);
		}
		groups.push(groupPres);
	}
	return groups;
}

function main() {
	const groups = groupPreElements();
	for (let i = 0; i < groups.length; i++) {
		setUpGroup(groups[i]);
	}
}

main();
