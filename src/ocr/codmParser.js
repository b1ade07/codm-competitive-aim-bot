// ============================================================
// COD:M OCR PARSER
// ============================================================

function cleanLines(text) {
    return String(text || "")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
}


// ============================================================
// NORMALIZE OCR TEXT
// ============================================================

function normalizeLine(line) {
    return String(line || "")
        .trim()
        .toLowerCase()
        .replace(/[^\w\s%.-]/g, "")
        .replace(/\s+/g, " ");
}


// ============================================================
// CHECK NUMERIC VALUE
// ============================================================

function isNumberLine(line) {
    return /^\d+(?:\.\d+)?$/.test(
        String(line).trim()
    );
}


// ============================================================
// CHECK PERCENTAGE
// ============================================================

function isPercentageLine(line) {
    return /^\d+(?:\.\d+)?%$/.test(
        String(line).trim()
    );
}


// ============================================================
// CHECK KILLS
// ============================================================

function parseInteger(line) {
    const value = Number.parseInt(
        String(line).trim(),
        10
    );

    return Number.isFinite(value)
        ? value
        : null;
}


// ============================================================
// CHECK PERCENTAGE NUMBER
// ============================================================

function parsePercentage(line) {
    const value = Number.parseFloat(
        String(line)
            .replace("%", "")
            .trim()
    );

    return Number.isFinite(value)
        ? value
        : null;
}


// ============================================================
// FIND COD:M VALUE BLOCK
//
// COD:M OCR normally returns:
//
// Kills
// Total Damage
// Accuracy
// Headshot Accuracy
// TTK
// Hit Distance
//
// 695
// 70393.44
// 38.29%
// 1.88%
// Counting
// 12.63m
//
// We only need the six values immediately following
// the six-stat header section.
// ============================================================

function getCodmValueBlock(lines) {

    const normalized =
        lines.map(normalizeLine);

    const killsIndex =
        normalized.findIndex(
            line => line === "kills"
        );

    const totalDamageIndex =
        normalized.findIndex(
            line => line === "total damage"
        );

    const accuracyIndex =
        normalized.findIndex(
            line => line === "accuracy"
        );

    const headshotIndex =
        normalized.findIndex(
            line =>
                line === "headshot accuracy" ||
                line === "headshotaccuracy"
        );

    /*
     * TTK may be incorrectly recognized by OCR as:
     *
     * TIK
     * TTK
     * TIK.
     * etc.
     *
     * We therefore do NOT depend on TTK.
     */

    if (
        killsIndex === -1 ||
        totalDamageIndex === -1 ||
        accuracyIndex === -1 ||
        headshotIndex === -1
    ) {
        return null;
    }

    /*
     * The four known headers should appear together near
     * the beginning of the OCR result.
     */

    const firstHeader =
        Math.min(
            killsIndex,
            totalDamageIndex,
            accuracyIndex,
            headshotIndex
        );

    /*
     * Find the first numeric value after the header area.
     */

    let valueStart = -1;

    for (
        let i = firstHeader + 1;
        i < lines.length;
        i++
    ) {

        if (
            isNumberLine(lines[i]) ||
            isPercentageLine(lines[i])
        ) {

            valueStart = i;

            break;

        }

    }

    if (valueStart === -1) {
        return null;
    }

    /*
     * We need:
     *
     * value 0 = Kills
     * value 1 = Total Damage
     * value 2 = Accuracy
     * value 3 = Headshot Accuracy
     *
     * We intentionally ignore OCR text between the values,
     * such as "Counting".
     */

    const values = [];

    for (
        let i = valueStart;
        i < lines.length && values.length < 4;
        i++
    ) {

        const line =
            String(lines[i]).trim();

        if (
            isNumberLine(line) ||
            isPercentageLine(line)
        ) {

            values.push(line);

        }

    }

    if (values.length < 4) {
        return null;
    }

    return {
        kills: parseInteger(values[0]),

        totalDamage:
            Number.parseFloat(values[1]),

        accuracy:
            parsePercentage(values[2]),

        headshotAccuracy:
            parsePercentage(values[3])
    };
}


// ============================================================
// MAIN COD:M PARSER
// ============================================================

export function parseCodmStats(text) {

    const lines =
        cleanLines(text);

    console.log(
        "COD:M PARSER: OCR lines:",
        lines
    );

    const result =
        getCodmValueBlock(lines);

    if (!result) {

        throw new Error(
            "Could not detect COD:M stat values."
        );

    }

    if (
        result.kills === null ||
        result.kills < 0
    ) {

        throw new Error(
            "Could not detect KILLS."
        );

    }

    if (
        result.accuracy === null ||
        result.accuracy < 0 ||
        result.accuracy > 100
    ) {

        throw new Error(
            "Could not detect ACCURACY."
        );

    }

    if (
        result.headshotAccuracy === null ||
        result.headshotAccuracy < 0 ||
        result.headshotAccuracy > 100
    ) {

        throw new Error(
            "Could not detect HEADSHOT ACCURACY."
        );

    }

    console.log(
        "COD:M PARSER RESULT:",
        {
            kills: result.kills,
            accuracy: result.accuracy,
            headshotAccuracy:
                result.headshotAccuracy
        }
    );

    return {
        kills: result.kills,

        accuracy:
            result.accuracy,

        headshotAccuracy:
            result.headshotAccuracy
    };
}