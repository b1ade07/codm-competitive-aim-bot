// ============================================================
// COD:M OCR PARSER
// Robust parser for COD:M AIM DRILLS screenshots
// ============================================================

export function parseCodmStats(ocrText) {

    if (
        !ocrText ||
        typeof ocrText !== "string"
    ) {
        throw new Error(
            "OCR text is empty."
        );
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

    // Example:
    // Kills 775
    // Kills: 775
    // Kills - 775

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];

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

    // Example:
    //
    // Kills
    // 775

    const index =
        findLineIndex(
            lines,
            /^kills?$/i
        );

    if (index !== -1) {

        for (
            let i = index + 1;
            i < Math.min(
                index + 10,
                lines.length
            );
            i++
        ) {

            const value =
                parseInteger(
                    lines[i]
                );

            if (
                value !== null
            ) {
                return value;
            }
        }
    }

    // Final fallback
    const text =
        lines.join(" ");

    const match =
        text.match(
            /\bkills?\b\s*[:\-]?\s*(\d{1,4})/i
        );

    if (match) {
        return Number(
            match[1]
        );
    }

    return null;
}


// ============================================================
// ACCURACY
// ============================================================

function findAccuracy(lines) {

    // IMPORTANT:
    // Search normal Accuracy BEFORE looking at
    // Headshot Accuracy.
    //
    // This prevents:
    //
    // Accuracy = 43.83%
    // Headshot Accuracy = 3.16%
    //
    // from being confused.

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];

        // Ignore Headshot Accuracy
        if (
            /head\s*shot\s*accuracy/i.test(
                line
            )
        ) {
            continue;
        }

        // ----------------------------------------------------
        // Same line
        // Accuracy 43.83%
        // Accuracy: 43.83%
        // ----------------------------------------------------

        const sameLine =
            line.match(
                /^accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i
            );

        if (sameLine) {

            const value =
                parsePercentage(
                    sameLine[1]
                );

            if (
                value !== null
            ) {
                return value;
            }
        }

        // ----------------------------------------------------
        // Inline
        // Accuracy: 43.83%
        // ----------------------------------------------------

        const inline =
            line.match(
                /\baccuracy\b\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i
            );

        if (
            inline &&
            !/head\s*shot/i.test(
                line
            )
        ) {

            const value =
                parsePercentage(
                    inline[1]
                );

            if (
                value !== null
            ) {
                return value;
            }
        }
    }

    // --------------------------------------------------------
    // Separate lines
    //
    // Accuracy
    // 43.83%
    // --------------------------------------------------------

    const index =
        findLineIndex(
            lines,
            /^accuracy$/i
        );

    if (index !== -1) {

        for (
            let i = index + 1;
            i < Math.min(
                index + 10,
                lines.length
            );
            i++
        ) {

            // Stop if another metric label begins.
            if (
                /^(head\s*shot\s*accuracy|kills?|total\s*damage|ttk|hit\s*distance)$/i.test(
                    lines[i]
                )
            ) {
                break;
            }

            const value =
                parsePercentage(
                    lines[i]
                );

            if (
                value !== null
            ) {
                return value;
            }
        }
    }

    // --------------------------------------------------------
    // Full-text fallback
    // --------------------------------------------------------

    const text =
        lines.join(" ");

    const match =
        text.match(
            /(?:^|\s)accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i
        );

    if (
        match &&
        !/head\s*shot\s*accuracy/i.test(
            match[0]
        )
    ) {

        const value =
            parsePercentage(
                match[1]
            );

        if (
            value !== null
        ) {
            return value;
        }
    }

    return null;
}


// ============================================================
// HEADSHOT ACCURACY
// ============================================================

function findHeadshotAccuracy(lines) {

    // --------------------------------------------------------
    // Same line
    //
    // Headshot Accuracy 3.16%
    // Head Shot Accuracy: 3.16%
    // --------------------------------------------------------

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];

        if (
            !/head\s*shot/i.test(
                line
            )
        ) {
            continue;
        }

        const match =
            line.match(
                /head\s*shot\s*accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i
            );

        if (match) {

            const value =
                parsePercentage(
                    match[1]
                );

            if (
                value !== null
            ) {
                return value;
            }
        }
    }

    // --------------------------------------------------------
    // Separate lines
    //
    // Headshot Accuracy
    // 3.16%
    // --------------------------------------------------------

    const index =
        findLineIndex(
            lines,
            /^head\s*shot\s*accuracy$/i
        );

    if (index !== -1) {

        for (
            let i = index + 1;
            i < Math.min(
                index + 10,
                lines.length
            );
            i++
        ) {

            const value =
                parsePercentage(
                    lines[i]
                );

            if (
                value !== null
            ) {
                return value;
            }

            // Don't search indefinitely into
            // another metric.
            if (
                /^(accuracy|kills?|total\s*damage|ttk|hit\s*distance)$/i.test(
                    lines[i]
                )
            ) {
                break;
            }
        }
    }

    // --------------------------------------------------------
    // OCR may split:
    //
    // Head Shot
    // Accuracy
    // 3.16%
    // --------------------------------------------------------

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
                    i + 10,
                    lines.length
                );
                j++
            ) {

                const value =
                    parsePercentage(
                        lines[j]
                    );

                if (
                    value !== null
                ) {
                    return value;
                }
            }
        }
    }

    // --------------------------------------------------------
    // Full text fallback
    // --------------------------------------------------------

    const text =
        lines.join(" ");

    const match =
        text.match(
            /head\s*shot\s*accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i
        );

    if (match) {

        const value =
            parsePercentage(
                match[1]
            );

        if (
            value !== null
        ) {
            return value;
        }
    }

    return null;
}


// ============================================================
// HELPERS
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

function parseInteger(
    value
) {

    if (!value) {
        return null;
    }

    const cleaned =
        value
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

function parsePercentage(
    value
) {

    if (!value) {
        return null;
    }

    const cleaned =
        String(value)
            .replace(",", ".")
            .replace("%", "")
            .trim();

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