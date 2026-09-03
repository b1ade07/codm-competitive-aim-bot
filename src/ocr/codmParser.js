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
        .map(line =>
            line
                .replace(/\u00A0/g, " ")
                .trim()
        )
        .filter(Boolean);

    console.log(
        "COD:M PARSER: OCR lines:",
        lines
    );

    const kills =
        findKills(lines);

    const accuracy =
        findAccuracy(lines);

    const headshotAccuracy =
        findHeadshotAccuracy(lines);

    console.log(
        "COD:M PARSER RESULT:",
        {
            kills,
            accuracy,
            headshotAccuracy
        }
    );

    if (kills === null) {
        throw new Error(
            "Could not detect KILLS."
        );
    }

    if (accuracy === null) {
        throw new Error(
            "Could not detect ACCURACY."
        );
    }

    if (headshotAccuracy === null) {
        throw new Error(
            "Could not detect HEADSHOT ACCURACY."
        );
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

        accuracy:
            Number(
                accuracy.toFixed(2)
            ),

        headshotAccuracy:
            Number(
                headshotAccuracy.toFixed(2)
            )
    };
}


// ============================================================
// KILLS
// ============================================================

function findKills(lines) {

    // Same-line format:
    // Kills: 775
    // Kills 775

    for (const line of lines) {

        const sameLine =
            line.match(
                /^kills?\s*[:\-]?\s*(\d{1,4})$/i
            );

        if (sameLine) {
            return Number(
                sameLine[1]
            );
        }

        const inline =
            line.match(
                /\bkills?\b\s*[:\-]?\s*(\d{1,4})/i
            );

        if (inline) {
            return Number(
                inline[1]
            );
        }
    }

    // COD:M layout:
    //
    // Kills
    // Total Damage
    // Accuracy
    // Headshot Accuracy
    // TTK
    // Hit Distance
    //
    // 775
    // 78626.05
    // 43.83%
    // 3.16%
    // Counting
    // 22.66m

    const values =
        getCodmValueBlock(lines);

    if (values.length >= 1) {

        const value =
            parseInteger(
                values[0]
            );

        if (value !== null) {
            return value;
        }
    }

    // General fallback

    const killsIndex =
        findLineIndex(
            lines,
            /^kills?$/i
        );

    if (killsIndex !== -1) {

        for (
            let i = killsIndex + 1;
            i < Math.min(
                killsIndex + 15,
                lines.length
            );
            i++
        ) {

            const value =
                parseInteger(
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
// ACCURACY
// ============================================================

function findAccuracy(lines) {

    // Same-line formats

    for (const line of lines) {

        // Never treat Headshot Accuracy
        // as normal Accuracy.

        if (
            /head\s*shot\s*accuracy/i.test(
                line
            )
        ) {
            continue;
        }

        const sameLine =
            line.match(
                /^accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%$/i
            );

        if (sameLine) {

            return parsePercentage(
                sameLine[1]
            );
        }

        const inline =
            line.match(
                /^accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i
            );

        if (inline) {

            const value =
                parsePercentage(
                    inline[1]
                );

            if (value !== null) {
                return value;
            }
        }
    }

    // COD:M value block

    const values =
        getCodmValueBlock(lines);

    const percentages =
        values
            .map(value =>
                parsePercentage(value)
            )
            .filter(value =>
                value !== null
            );

    // First percentage = Accuracy

    if (
        percentages.length >= 1
    ) {
        return percentages[0];
    }

    // General fallback

    const accuracyIndex =
        findLineIndex(
            lines,
            /^accuracy$/i
        );

    if (
        accuracyIndex !== -1
    ) {

        for (
            let i = accuracyIndex + 1;
            i < Math.min(
                accuracyIndex + 15,
                lines.length
            );
            i++
        ) {

            if (
                /^head\s*shot\s*accuracy$/i.test(
                    lines[i]
                )
            ) {
                break;
            }

            const value =
                parsePercentage(
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
// HEADSHOT ACCURACY
// ============================================================

function findHeadshotAccuracy(lines) {

    // Same-line format:
    //
    // Headshot Accuracy: 3.16%

    for (const line of lines) {

        if (
            !/head\s*shot/i.test(
                line
            )
        ) {
            continue;
        }

        const sameLine =
            line.match(
                /head\s*shot\s*accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i
            );

        if (sameLine) {

            return parsePercentage(
                sameLine[1]
            );
        }
    }

    // COD:M value block

    const values =
        getCodmValueBlock(lines);

    const percentages =
        values
            .map(value =>
                parsePercentage(value)
            )
            .filter(value =>
                value !== null
            );

    // Second percentage = Headshot Accuracy

    if (
        percentages.length >= 2
    ) {
        return percentages[1];
    }

    // General fallback

    const headshotIndex =
        findLineIndex(
            lines,
            /^head\s*shot\s*accuracy$/i
        );

    if (
        headshotIndex !== -1
    ) {

        for (
            let i = headshotIndex + 1;
            i < Math.min(
                headshotIndex + 15,
                lines.length
            );
            i++
        ) {

            const value =
                parsePercentage(
                    lines[i]
                );

            if (value !== null) {
                return value;
            }
        }
    }

    // OCR split:
    //
    // Head Shot
    // Accuracy
    // 3.16%

    for (
        let i = 0;
        i < lines.length - 1;
        i++
    ) {

        if (
            /^head\s*shot$/i.test(
                lines[i]
            ) &&
            /^accuracy$/i.test(
                lines[i + 1]
            )
        ) {

            for (
                let j = i + 2;
                j < Math.min(
                    i + 15,
                    lines.length
                );
                j++
            ) {

                const value =
                    parsePercentage(
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
// COD:M VALUE BLOCK
// ============================================================

function getCodmValueBlock(lines) {

    const headers = [
        "kills",
        "total damage",
        "accuracy",
        "headshot accuracy",
        "ttk",
        "hit distance"
    ];

    const normalized =
        lines.map(
            normalizeLabel
        );

    const indexes =
        headers.map(
            header =>
                normalized.findIndex(
                    line =>
                        line === header
                )
        );

    // All six COD:M labels must exist.

    if (
        indexes.some(
            index =>
                index === -1
        )
    ) {
        return [];
    }

    const lastHeaderIndex =
        Math.max(
            ...indexes
        );

    // The six values begin immediately
    // after the last metric label.

    const values =
        lines.slice(
            lastHeaderIndex + 1,
            lastHeaderIndex + 7
        );

    if (
        values.length < 6
    ) {
        return [];
    }

    return values;
}


// ============================================================
// NORMALIZE LABEL
// ============================================================

function normalizeLabel(value) {

    return String(value)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}


// ============================================================
// FIND LINE INDEX
// ============================================================

function findLineIndex(
    lines,
    regex
) {

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        if (
            regex.test(
                lines[i]
            )
        ) {
            return i;
        }
    }

    return -1;
}


// ============================================================
// INTEGER PARSER
// ============================================================

function parseInteger(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const cleaned =
        String(value)
            .replace(/,/g, "")
            .trim();

    if (
        !/^\d{1,4}$/.test(
            cleaned
        )
    ) {
        return null;
    }

    const number =
        Number(cleaned);

    if (
        !Number.isInteger(
            number
        )
    ) {
        return null;
    }

    if (
        number < 0 ||
        number > 9999
    ) {
        return null;
    }

    return number;
}


// ============================================================
// PERCENTAGE PARSER
// ============================================================

function parsePercentage(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const cleaned =
        String(value)
            .replace(",", ".")
            .replace("%", "")
            .trim();

    if (!cleaned) {
        return null;
    }

    const number =
        Number(cleaned);

    if (
        Number.isNaN(number)
    ) {
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