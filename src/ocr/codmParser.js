// ============================================================
// COD:M OCR PARSER
// ============================================================


// ============================================================
// MAIN PARSER
// ============================================================

export function parseCodmStats(
    ocrText
) {

    if (
        !ocrText ||
        typeof ocrText !== "string"
    ) {

        throw new Error(
            "OCR text is empty."
        );

    }


    // --------------------------------------------------------
    // CLEAN OCR TEXT
    // --------------------------------------------------------

    const text =
        cleanOCRText(
            ocrText
        );


    // --------------------------------------------------------
    // SPLIT INTO LINES
    // --------------------------------------------------------

    const lines =
        text

            .split(/\r?\n/)

            .map(
                line =>
                    line.trim()
            )

            .filter(
                Boolean
            );


    // --------------------------------------------------------
    // FIND KILLS
    // --------------------------------------------------------

    const kills =
        findKills(
            lines,
            text
        );


    // --------------------------------------------------------
    // FIND ACCURACY
    // --------------------------------------------------------

    const accuracy =
        findAccuracy(
            lines,
            text
        );


    // --------------------------------------------------------
    // FIND HEADSHOT ACCURACY
    // --------------------------------------------------------

    const headshotAccuracy =
        findHeadshotAccuracy(
            lines,
            text
        );


    // --------------------------------------------------------
    // VALIDATE
    // --------------------------------------------------------

    if (
        kills === null
    ) {

        throw new Error(
            "Could not detect KILLS."
        );

    }


    if (
        accuracy === null
    ) {

        throw new Error(
            "Could not detect ACCURACY."
        );

    }


    if (
        headshotAccuracy === null
    ) {

        throw new Error(
            "Could not detect HEADSHOT ACCURACY."
        );

    }


    // --------------------------------------------------------
    // RANGE CHECK
    // --------------------------------------------------------

    if (
        kills < 0 ||
        kills > 9999
    ) {

        throw new Error(
            "Detected kills are outside the valid range."
        );

    }


    if (
        accuracy < 0 ||
        accuracy > 100
    ) {

        throw new Error(
            "Detected accuracy is outside the valid range."
        );

    }


    if (
        headshotAccuracy < 0 ||
        headshotAccuracy > 100
    ) {

        throw new Error(
            "Detected headshot accuracy is outside the valid range."
        );

    }


    // --------------------------------------------------------
    // RETURN
    // --------------------------------------------------------

    return {

        kills:
            Math.round(kills),

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
// CLEAN OCR TEXT
// ============================================================

function cleanOCRText(
    text
) {

    return text

        .replace(
            /\r/g,
            ""
        )

        .replace(
            /[\u00A0]/g,
            " "
        )

        .replace(
            /[|]/g,
            "I"
        )

        .replace(
            /[ \t]+/g,
            " "
        )

        .trim();

}


// ============================================================
// FIND KILLS
// ============================================================

function findKills(
    lines,
    text
) {

    // --------------------------------------------------------
    // Look for a line containing KILLS
    // --------------------------------------------------------

    for (
        const line of lines
    ) {

        if (
            /\bkills?\b/i.test(
                line
            )
        ) {

            const numbers =
                line.match(
                    /\b\d{1,4}\b/g
                );


            if (
                numbers &&
                numbers.length
            ) {

                const value =
                    Number(
                        numbers[
                            numbers.length - 1
                        ]
                    );


                if (
                    Number.isInteger(value)
                ) {

                    return value;

                }

            }

        }

    }


    // --------------------------------------------------------
    // Whole-text fallback
    // --------------------------------------------------------

    const match =
        text.match(

            /kills?\s*[:\-]?\s*(\d{1,4})/i

        );


    if (match) {

        return Number(
            match[1]
        );

    }


    return null;

}


// ============================================================
// FIND ACCURACY
// ============================================================

function findAccuracy(
    lines,
    text
) {

    // --------------------------------------------------------
    // First look for a NORMAL accuracy line.
    //
    // Do NOT accidentally use Headshot Accuracy.
    // --------------------------------------------------------

    for (
        const line of lines
    ) {

        if (
            !/accuracy/i.test(
                line
            )
        ) {

            continue;

        }


        if (
            /head\s*shot/i.test(
                line
            ) ||
            /headshots?/i.test(
                line
            )
        ) {

            continue;

        }


        const value =
            extractPercentage(
                line
            );


        if (
            value !== null
        ) {

            return value;

        }

    }


    // --------------------------------------------------------
    // Whole-text fallback
    // --------------------------------------------------------

    const match =
        text.match(

            /(?<!head\s*shot\s*)accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i

        );


    if (match) {

        return Number(
            match[1].replace(
                ",",
                "."
            )
        );

    }


    return null;

}


// ============================================================
// FIND HEADSHOT ACCURACY
// ============================================================

function findHeadshotAccuracy(
    lines,
    text
) {

    // --------------------------------------------------------
    // Look for HEADSHOT + ACCURACY
    // --------------------------------------------------------

    for (
        const line of lines
    ) {

        if (

            /head\s*shot/i.test(
                line
            ) &&

            /accuracy/i.test(
                line
            )

        ) {

            const value =
                extractPercentage(
                    line
                );


            if (
                value !== null
            ) {

                return value;

            }

        }

    }


    // --------------------------------------------------------
    // Look for HEADSHOT alone
    // --------------------------------------------------------

    for (
        const line of lines
    ) {

        if (
            /headshots?/i.test(
                line
            )
        ) {

            const value =
                extractPercentage(
                    line
                );


            if (
                value !== null
            ) {

                return value;

            }

        }

    }


    // --------------------------------------------------------
    // Whole-text fallback
    // --------------------------------------------------------

    const match =
        text.match(

            /head\s*shots?\s*(?:accuracy)?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?/i

        );


    if (match) {

        return Number(
            match[1].replace(
                ",",
                "."
            )
        );

    }


    // --------------------------------------------------------
    // HEADSHOT ACCURACY reversed/mangled OCR
    // --------------------------------------------------------

    const reversed =
        text.match(

            /accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?\s*head\s*shots?/i

        );


    if (reversed) {

        return Number(
            reversed[1].replace(
                ",",
                "."
            )
        );

    }


    return null;

}


// ============================================================
// EXTRACT PERCENTAGE
// ============================================================

function extractPercentage(
    line
) {

    // --------------------------------------------------------
    // Prefer number followed by %
    // --------------------------------------------------------

    const percentage =
        line.match(

            /(\d+(?:[.,]\d+)?)\s*%/

        );


    if (percentage) {

        return Number(

            percentage[1].replace(
                ",",
                "."
            )

        );

    }


    // --------------------------------------------------------
    // Number without % symbol
    // --------------------------------------------------------

    const numbers =
        line.match(

            /\b\d+(?:[.,]\d+)?\b/g

        );


    if (
        !numbers ||
        !numbers.length
    ) {

        return null;

    }


    // Usually the final number on
    // the statistics line is the value.

    const value =
        Number(

            numbers[
                numbers.length - 1
            ].replace(
                ",",
                "."
            )

        );


    if (
        value >= 0 &&
        value <= 100
    ) {

        return value;

    }


    return null;

}