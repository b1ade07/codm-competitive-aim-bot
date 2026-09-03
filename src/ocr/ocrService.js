import "dotenv/config";

// ============================================================
// OCR.SPACE SERVICE
// ============================================================

const OCR_ENDPOINT =
    "https://api.ocr.space/parse/image";


// ============================================================
// RUN OCR
// ============================================================

export async function runOCR(imageUrl) {

    if (!imageUrl) {
        throw new Error("OCR image URL is missing.");
    }

    const apiKey =
        process.env.OCR_SPACE_API_KEY;

    if (!apiKey) {
        throw new Error(
            "OCR_SPACE_API_KEY is not configured."
        );
    }


    // --------------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------------

    const body =
        new URLSearchParams();

    body.append(
        "url",
        imageUrl
    );

    body.append(
        "language",
        "eng"
    );

    body.append(
        "OCREngine",
        "2"
    );

    body.append(
        "isOverlayRequired",
        "false"
    );

    body.append(
        "scale",
        "true"
    );

    // Tell OCR.Space this is an image.
    body.append(
        "filetype",
        "JPG"
    );


    // --------------------------------------------------------
    // SEND REQUEST
    // --------------------------------------------------------

    const response =
        await fetch(
            OCR_ENDPOINT,
            {
                method: "POST",

                headers: {
                    apikey: apiKey,
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body
            }
        );


    // --------------------------------------------------------
    // HTTP ERROR
    // --------------------------------------------------------

    if (!response.ok) {

        throw new Error(
            `OCR API HTTP error: ${response.status}`
        );

    }


    // --------------------------------------------------------
    // JSON RESPONSE
    // --------------------------------------------------------

    const data =
        await response.json();


    // --------------------------------------------------------
    // OCR PROCESSING ERROR
    // --------------------------------------------------------

    if (
        data.IsErroredOnProcessing
    ) {

        const message =
            Array.isArray(
                data.ErrorMessage
            )
                ? data.ErrorMessage.join(" ")
                : String(
                    data.ErrorMessage ||
                    "OCR processing failed."
                );

        throw new Error(message);
    }


    // --------------------------------------------------------
    // EXTRACT TEXT
    // --------------------------------------------------------

    const text =

        Array.isArray(
            data.ParsedResults
        )
            ? data.ParsedResults
                .map(
                    result =>
                        result?.ParsedText || ""
                )
                .join("\n")
            : "";


    // --------------------------------------------------------
    // EMPTY OCR RESULT
    // --------------------------------------------------------

    if (!text.trim()) {

        throw new Error(
            "OCR returned no readable text."
        );

    }


    // --------------------------------------------------------
    // RETURN
    // --------------------------------------------------------

    return {

        text: text.trim(),

        raw: data

    };

}