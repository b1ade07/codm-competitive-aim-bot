// ============================================================
// COD:M OCR PARSER
// ============================================================

export function parseCodmStats(ocrText) {

    if (!ocrText || typeof ocrText !== "string") {
        throw new Error("OCR text is empty.");
    }

    const lines = ocrText
        .replace(/\r/g, "")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    const kills = findKills(lines);
    const accuracy = findAccuracy(lines);
    const headshotAccuracy = findHeadshotAccuracy(lines);

    if (kills === null) {
        throw new Error("Could not detect KILLS.");
    }

    if (accuracy === null) {
        throw new Error("Could not detect ACCURACY.");
    }

    if (headshotAccuracy === null) {
        throw new Error("Could not detect HEADSHOT ACCURACY.");
    }

    if (
        !Number.isInteger(kills) ||
        kills < 0 ||
        kills > 9999
    ) {
        throw new Error(
            "Detected KILLS value is invalid."
        );
    }

    if (
        accuracy < 0 ||
        accuracy > 100
    ) {
        throw new Error(
            "Detected ACCURACY value is invalid."
        );
    }

    if (
        headshotAccuracy < 0 ||
        headshotAccuracy > 100
    ) {
        throw new Error(
            "Detected HEADSHOT ACCURACY value is invalid."
        );
    }

    return {
        kills: Math.round(kills),
        accuracy: Number(accuracy.toFixed(2)),
        headshotAccuracy: Number(
            headshotAccuracy.toFixed(2)
        )
    };
}


// ============================================================
// FIND KILLS
// ============================================================

function findKills(lines) {

    // Kills and value on same line
    for (const line of lines) {

        const match = line.match(
            /^kills?\s*[:\-]?\s*(\d{1,4})$/i
        );

        if (match) {
            return Number(match[1]);
        }
    }

    // Kills label followed by value
    const killsIndex = findLineIndex(
        lines,
        /^kills?$/i
    );

    if (killsIndex !== -1) {

        for (
            let i = killsIndex + 1;
            i < Math.min(killsIndex + 11, lines.length);
            i++
        ) {

            const value = parseInteger(lines[i]);

            if (value !== null) {
                return value;
            }
        }
    }

    // Whole-text fallback
    const text = lines.join("\n");

    const match = text.match(
        /kills?\s*[:\-]?\s*(\d{1,4})/i
    );

    if (match) {
        return Number(match[1]);
    }

    return null;
}


// ============================================================
// FIND ACCURACY
// ============================================================

function findAccuracy(lines) {

    // Accuracy and value on same line
    for (const line of lines) {

        if (/head\s*shot/i.test(line)) {
            continue;
        }

        const match = line.match(
            /^accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?$/i
        );

        if (match) {
            return Number(
                match[1].replace(",", ".")
            );
        }
    }

    // Accuracy label followed by value
    const accuracyIndex = findLineIndex(
        lines,
        /^accuracy$/i
    );

    if (accuracyIndex !== -1) {

        for (
            let i = accuracyIndex + 1;
            i < Math.min(accuracyIndex + 11, lines.length);
            i++
        ) {

            const value = parsePercentage(
                lines[i]
            );

            if (value !== null) {
                return value;
            }
        }
    }

    return null;
}


// ============================================================
// FIND HEADSHOT ACCURACY
// ============================================================

function findHeadshotAccuracy(lines) {

    // Headshot Accuracy and value on same line
    for (const line of lines) {

        if (!/head\s*shot/i.test(line)) {
            continue;
        }

        const match = line.match(
            /head\s*shot\s*accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i
        );

        if (match) {
            return Number(
                match[1].replace(",", ".")
            );
        }
    }

    // Headshot Accuracy label followed by value
    const headshotIndex = findLineIndex(
        lines,
        /^head\s*shot\s*accuracy$/i
    );

    if (headshotIndex !== -1) {

        for (
            let i = headshotIndex + 1;
            i < Math.min(headshotIndex + 11, lines.length);
            i++
        ) {

            const value = parsePercentage(
                lines[i]
            );

            if (value !== null) {
                return value;
            }
        }
    }

    // OCR split into two lines:
    // Headshot
    // Accuracy

    for (
        let i = 0;
        i < lines.length - 1;
        i++
    ) {

        if (
            /^head\s*shot$/i.test(lines[i]) &&
            /^accuracy$/i.test(lines[i + 1])
        ) {

            for (
                let j = i + 2;
                j < Math.min(i + 12, lines.length);
                j++
            ) {

                const value = parsePercentage(
                    lines[j]
                );

                if (value !== null) {
                    return value;
                }
            }
        }
    }

    return null;
}


// ============================================================
// FIND LINE INDEX
// ============================================================

function findLineIndex(lines, regex) {

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        if (regex.test(lines[i])) {
            return i;
        }
    }

    return -1;
}


// ============================================================
// PARSE INTEGER
// ============================================================

function parseInteger(value) {

    if (!value) {
        return null;
    }

    const cleaned = value
        .replace(/,/g, "")
        .trim();

    if (!/^\d{1,4}$/.test(cleaned)) {
        return null;
    }

    const number = Number(cleaned);

    if (
        !Number.isInteger(number) ||
        number < 0 ||
        number > 9999
    ) {
        return null;
    }

    return number;
}


// ============================================================
// PARSE PERCENTAGE
// ============================================================

function parsePercentage(value) {

    if (!value) {
        return null;
    }

    const match = value.match(
        /^(\d+(?:[.,]\d+)?)\s*%?$/
    );

    if (!match) {
        return null;
    }

    const number = Number(
        match[1].replace(",", ".")
    );

    if (Number.isNaN(number)) {
        return null;
    }

    if (
        number < 0 ||
        number > 100
    ) {
        return null;
    }

    return number;
}