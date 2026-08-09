const METHOD_LINE_PATTERN = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)\s+HTTP\/\d\.\d$/;
const STATUS_LINE_PATTERN = /^HTTP\/\d\.\d\s+\d/;

function isStartLine(line) {
	return METHOD_LINE_PATTERN.test(line) || STATUS_LINE_PATTERN.test(line);
}

function splitIntoMessages(rawText) {
	const lines = [];
	for (const rawLine of rawText.split("\n")) {
		lines.push(rawLine.trim());
	}

	const startIndexes = [];
	for (let i = 0; i < lines.length; i++) {
		if (isStartLine(lines[i])) {
			startIndexes.push(i);
		}
	}
	startIndexes.push(lines.length);

	const messages = [];
	for (let i = 0; i < startIndexes.length - 1; i++) {
		messages.push(lines.slice(startIndexes[i], startIndexes[i + 1]));
	}
	return messages;
}

function parseMessage(messageLines) {
	const startLine = messageLines[0];
	const headers = {};

	let lineIndex = 1;
	for (; lineIndex < messageLines.length; lineIndex++) {
		const line = messageLines[lineIndex];
		if (line === "") {
			lineIndex++;
			break;
		}
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;
		const headerName = line.slice(0, colonIndex).trim();
		const headerValue = line.slice(colonIndex + 1).trim();
		headers[headerName] = headerValue;
	}

	const bodyLines = [];
	for (; lineIndex < messageLines.length; lineIndex++) {
		if (messageLines[lineIndex] !== "") {
			bodyLines.push(messageLines[lineIndex]);
		}
	}

	return { startLine: startLine, headers: headers, body: bodyLines.join("\n") };
}
