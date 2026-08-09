// Header names and JSON field names used to build and verify the signature.
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

function findSignedRequest(messages) {
	let secretBase64 = null;
	let signedMessage = null;

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
			signedMessage = message;
		}
	}

	if (!signedMessage) {
		return null;
	}

	const startLineParts = signedMessage.startLine.split(" ");
	const method = startLineParts[0];
	const path = new URL(startLineParts[1]).pathname;

	return {
		method: method,
		path: path,
		body: signedMessage.body,
		timestamp: signedMessage.headers[TIMESTAMP_HEADER],
		nonce: signedMessage.headers[NONCE_HEADER],
		signature: signedMessage.headers[SIGNATURE_HEADER],
		secretBase64: secretBase64
	};
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
		messages.push(parseMessage(messageLines[i]));
	}
	return messages;
}

function setUpPre(preElement) {
	const signedRequest = findSignedRequest(readMessages(preElement));
	if (!signedRequest) {
		return;
	}

	preElement.innerHTML = preElement.innerHTML.replace(
		signedRequest.signature,
		'<button type="button" class="sig-value">' + signedRequest.signature + "</button>"
	);
	const button = preElement.querySelector(".sig-value");

	// Re-reads the <pre>'s current text and recomputes, so an edit made through the
	// browser inspector is reflected instead of trusting whatever we last computed.
	async function recheck() {
		const currentRequest = findSignedRequest(readMessages(preElement));

		if (!currentRequest) {
			button.classList.remove("sig-valid", "sig-invalid");
			return null;
		}

		const result = await checkSignature(currentRequest);

		// Remove and add back-to-back, with no await between them, so the browser
		// never gets a chance to paint the undecorated state in between (the flash).
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

	// Changing button.classList only touches the button's own class attribute, so this
	// observer never sees its own recheck() updates — no risk of it fighting itself.
	new MutationObserver(function () {
		button.classList.remove("sig-valid", "sig-invalid");
	}).observe(preElement, { childList: true, characterData: true, subtree: true });

	recheck();
}

function main() {
	const preElements = document.querySelectorAll("pre");
	for (let i = 0; i < preElements.length; i++) {
		setUpPre(preElements[i]);
	}
}

main();
