// ============================================================
// COD:M OCR PARSER
// Handles COD:M screenshots where metric labels appear first
// and their values appear together below the labels.
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

    // --------------------------------------------------------
    // CASE 1
    // Kills: 775
    // Kills 775
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // CASE 2
    //
    // Kills
    // ...
    // 775
    //
    // COD:M normally places the values below all labels.
    // --------------------------------------------------------

    const killsIndex =
        findLineIndex(
            lines,
            /^kills?$/i
        );

    if (killsIndex !== -1) {

        // First look for the COD:M layout.
        const layoutValue =
            findValueFromMetricLayout(
                lines,
                "kills"
            );

        if (
            layoutValue !== null
        ) {
            return layoutValue;
        }

        // General fallback.
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

            if (
                value !== null
            ) {
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

    // --------------------------------------------------------
    // First handle same-line formats:
    //
    // Accuracy: 43.83%
    // Accuracy 43.83%
    // --------------------------------------------------------

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];

        if (
            /head\s*shot/i.test(
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

            if (
                value !== null
            ) {
                return value;
            }
        }
    }

    // --------------------------------------------------------
    // COD:M ACTUAL LAYOUT
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
    //
    // Therefore:
    // Accuracy = first percentage value
    // Headshot Accuracy = second percentage value
    // --------------------------------------------------------

    const accuracyIndex =
        findLineIndex(
            lines,
            /^accuracy$/i
        );

    const headshotIndex =
        findLineIndex(
            lines,
            /^head\s*shot\s*accuracy$/i
        );

    if (
        accuracyIndex !== -1 &&
        headshotIndex !== -1 &&
        headshotIndex > accuracyIndex
    ) {

        const value =
            findPercentageValuesAfterHeaders(
                lines,
                accuracyIndex,
                headshotIndex
            );

        if (
            value !== null
        ) {
            return value;
        }
    }

    // --------------------------------------------------------
    // Separate-line fallback
    // --------------------------------------------------------

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

            if (
                value !== null
            ) {
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

    // --------------------------------------------------------
    // Same-line format
    //
    // Headshot Accuracy: 3.16%
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

        const sameLine =
            line.match(
                /head\s*shot\s*accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%/i
            );

        if (sameLine) {

            return parsePercentage(
                sameLine[1]
            );
        }

        const inline =
            line.match(
                /head\s*shot\s*accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i
            );

        if (inline) {

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
    // COD:M ACTUAL LAYOUT
    // --------------------------------------------------------

    const accuracyIndex =
        findLineIndex(
            lines,
            /^accuracy$/i
        );

    const headshotIndex =
        findLineIndex(
            lines,
            /^head\s*shot\s*accuracy$/i
        );

    if (
        accuracyIndex !== -1 &&
        headshotIndex !== -1 &&
        headshotIndex > accuracyIndex
    ) {

        const percentages =
            findAllPercentageValuesAfterHeaders(
                lines,
                accuracyIndex
            );

        if (
            percentages.length >= 2
        ) {

            return percentages[1];
        }
    }

    // --------------------------------------------------------
    // Separate lines
    // --------------------------------------------------------

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

            if (
                value !== null
            ) {
                return value;
            }
        }
    }

    // --------------------------------------------------------
    // OCR split format:
    //
    // Head Shot
    // Accuracy
    // ...
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

            const percentages =
                findAllPercentageValuesAfterHeaders(
                    lines,
                    i
                );

            if (
                percentages.length
            ) {
                return percentages[0];
            }
        }
    }

    return null;
}


// ============================================================
// COD:M LAYOUT HELPERS
// ============================================================

function findValueFromMetricLayout(
    lines,
    metric
) {

    const headerIndexes = [];

    const headerRegex =
        /^(kills?|total\s*damage|accuracy|head\s*shot\s*accuracy|ttk|hit\s*distance)$/i;

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        if (
            headerRegex.test(
                lines[i]
            )
        ) {

            headerIndexes.push(i);
        }
    }

    if (
        headerIndexes.length < 4
    ) {
        return null;
    }

    const firstValueIndex =
        headerIndexes[
            headerIndexes.length - 1
        ] + 1;

    if (
        firstValueIndex >= lines.length
    ) {
        return null;
    }

    const position =
        headerIndexes.findIndex(
            index =>
                lines[index]
                    .toLowerCase()
                    .replace(/\s+/g, " ")
                    .trim() ===
                metric.toLowerCase()
        );

    if (
        position === -1
    ) {
        return null;
    }

    const valueIndex =
        firstValueIndex + position;

    if (
        valueIndex >= lines.length
    ) {
        return null;
    }

    return parseInteger(
        lines[valueIndex]
    );
}


// ============================================================
// FIND PERCENTAGE VALUES
// ============================================================

function findPercentageValuesAfterHeaders(
    lines,
    startIndex
) {

    const values = [];

    // Find the end of the metric-header block.
    let headerEnd =
        startIndex;

    for (
        let i = startIndex;
        i < lines.length;
        i++
    ) {

        if (
            /^(kills?|total\s*damage|accuracy|head\s*shot\s*accuracy|ttk|hit\s*distance)$/i.test(
                lines[i]
            )
        ) {

            headerEnd = i;
        } else {

            // Once we leave the header block,
            // start looking for percentage values.
            if (
                i > headerEnd
            ) {
                break;
            }
        }
    }

    for (
        let i = headerEnd + 1;
        i < lines.length;
        i++
    ) {

        const value =
            parsePercentage(
                lines[i]
            );

        if (
            value !== null
        ) {

            values.push(
                value
            );

            if (
                values.length >= 2
            ) {
                break;
            }
        }
    }

    return values;
}


function findPercentageValuesAfterHeaders(
    lines,
    accuracyIndex,
    headshotIndex
) {

    const values = [];

    // In the COD:M layout the complete header block
    // ends at Hit Distance.
    //
    // Find the last known metric header after
    // Headshot Accuracy.

    const headerRegex =
        /^(kills?|total\s*damage|accuracy|head\s*shot\s*accuracy|ttk|hit\s*distance)$/i;

    let lastHeader =
        headshotIndex;

    for (
        let i = headshotIndex + 1;
        i < lines.length;
        i++
    ) {

        if (
            headerRegex.test(
                lines[i]
            )
        ) {

            lastHeader = i;

        } else {

            break;
        }
    }

    for (
        let i = lastHeader + 1;
        i < lines.length;
        i++
    ) {

        const value =
            parsePercentage(
                lines[i]
            );

        if (
            value !== null
        ) {

            values.push(
                value
            );

            if (
                values.length >= 2
            ) {
                break;
            }
        }
    }

    return values;
}


// ============================================================
// LINE SEARCH
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
// INTEGER
// ============================================================

function parseInteger(
    value
) {

    if (!value) {
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
        !Number.isInteger(number)
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
// PERCENTAGE
// ============================================================

function parsePercentage(
    value
) {

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