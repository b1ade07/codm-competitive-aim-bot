// ============================================================
// COD:M OCR PARSER
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


    const lines =
        ocrText
            .replace(/\r/g, "")
            .split("\n")
            .map(
                line => line.trim()
            )
            .filter(Boolean);


    // ========================================================
    // FIND REQUIRED VALUES
    // ========================================================

    const kills =
        findKills(lines);

    const accuracy =
        findAccuracy(lines);

    const headshotAccuracy =
        findHeadshotAccuracy(lines);


    // ========================================================
    // VALIDATE EXISTENCE
    // ========================================================

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


    // ========================================================
    // VALIDATE KILLS
    // ========================================================

    if (
        !Number.isInteger(kills) ||
        kills < 0 ||
        kills > 9999
    ) {

        throw new Error(
            "Detected KILLS value is invalid."
        );

    }


    // ========================================================
    // VALIDATE ACCURACY
    // ========================================================

    if (
        accuracy < 0 ||
        accuracy > 100
    ) {

        throw new Error(
            "Detected ACCURACY value is invalid."
        );

    }


    // ========================================================
    // VALIDATE HEADSHOT ACCURACY
    // ========================================================

    if (
        headshotAccuracy < 0 ||
        headshotAccuracy > 100
    ) {

        throw new Error(
            "Detected HEADSHOT ACCURACY value is invalid."
        );

    }


    // ========================================================
    // RETURN CLEAN VALUES
    // ========================================================

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
// FIND KILLS
// ============================================================

function findKills(lines) {


    // --------------------------------------------------------
    // CASE 1:
    // Kills 775
    // Kills: 775
    // Kills - 775
    // --------------------------------------------------------

    for (const line of lines) {

        const match =
            line.match(
                /^kills?\s*[:\-]?\s*(\d{1,4})$/i
            );

        if (match) {

            return Number(
                match[1]
            );

        }

    }


    // --------------------------------------------------------
    // CASE 2:
    //
    // Kills
    // 775
    // --------------------------------------------------------

    const killsIndex =
        findLineIndex(
            lines,
            /^kills?$/i
        );


    if (killsIndex !== -1) {

        for (
            let i =
                killsIndex + 1;

            i <
                Math.min(
                    killsIndex + 11,
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


    // --------------------------------------------------------
    // CASE 3:
    // Kills 775 somewhere in OCR text
    // --------------------------------------------------------

    const text =
        lines.join("\n");


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
// FIND NORMAL ACCURACY
// ============================================================

function findAccuracy(lines) {


    // --------------------------------------------------------
    // IMPORTANT:
    // Ignore Headshot Accuracy.
    // --------------------------------------------------------

    for (const line of lines) {

        if (
            /head\s*shot/i.test(
                line
            )
        ) {

            continue;

        }


        const match =
            line.match(
                /^accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?$/i
            );


        if (match) {

            return Number(
                match[1]
                    .replace(",", ".")
            );

        }

    }


    // --------------------------------------------------------
    // CASE:
    //
    // Accuracy
    // 43.83%
    // --------------------------------------------------------

    const accuracyIndex =
        findLineIndex(
            lines,
            /^accuracy$/i
        );


    if (
        accuracyIndex !== -1
    ) {

        for (
            let i =
                accuracyIndex + 1;

            i <
                Math.min(
                    accuracyIndex + 6,
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


    return null;

}


// ============================================================
// FIND HEADSHOT ACCURACY
// ============================================================

function findHeadshotAccuracy(lines) {


    // --------------------------------------------------------
    // CASE 1:
    //
    // Headshot Accuracy 3.16%
    // Headshot Accuracy: 3.16%
    // --------------------------------------------------------

    for (const line of lines) {

        const match =
            line.match(
                /^head\s*shot\s*accuracy\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*%?$/i
            );


        if (match) {

            return Number(
                match[1]
                    .replace(",", ".")
            );

        }

    }


    // --------------------------------------------------------
    // CASE 2:
    //
    // Headshot
    // Accuracy
    // 3.16%
    // --------------------------------------------------------

    for (
        let i = 0;
        i <
            lines.length - 2;
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
                let j =
                    i + 2;

                j <
                    Math.min(
                        i + 7,
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
    // CASE 3:
    //
    // Headshot Accuracy
    // 3.16%
    //
    // IMPORTANT:
    // Search ONLY immediately after the exact label.
    // --------------------------------------------------------

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        if (
            /^head\s*shot\s*accuracy$/i.test(
                lines[i]
            )
        ) {

            for (
                let j =
                    i + 1;

                j <
                    Math.min(
                        i + 7,
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
    // NO GENERIC FALLBACK
    //
    // This is VERY IMPORTANT.
    //
    // We never take the normal Accuracy value
    // and use it as Headshot Accuracy.
    // --------------------------------------------------------

    return null;

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
// PARSE INTEGER
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
        Number(
            cleaned
        );


    if (
        !Number.isInteger(
            number
        ) ||
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

function parsePercentage(
    value
) {

    if (!value) {

        return null;

    }


    const match =
        value.match(
            /^(\d+(?:[.,]\d+)?)\s*%?$/
        );


    if (!match) {

        return null;

    }


    const number =
        Number(
            match[1]
                .replace(",", ".")
        );


    if (
        Number.isNaN(
            number
        )
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