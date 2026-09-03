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
        throw new Error(
            "OCR image URL is missing."
        );
    }


    const apiKey =
        process.env.OCR_SPACE_API_KEY;


    if (!apiKey) {
        throw new Error(
            "OCR_SPACE_API_KEY is not configured."
        );
    }


    console.log(
        "OCR: Downloading Discord screenshot..."
    );


    // --------------------------------------------------------
    // DOWNLOAD IMAGE FROM DISCORD
    // --------------------------------------------------------

    const imageResponse =
        await fetch(imageUrl);


    if (!imageResponse.ok) {

        throw new Error(
            `Could not download screenshot: HTTP ${imageResponse.status}`
        );

    }


    const imageBuffer =
        await imageResponse.arrayBuffer();


    if (!imageBuffer.byteLength) {

        throw new Error(
            "Downloaded screenshot is empty."
        );

    }


    console.log(
        `OCR: Screenshot downloaded (${imageBuffer.byteLength} bytes).`
    );


    // --------------------------------------------------------
    // DETERMINE IMAGE TYPE
    // --------------------------------------------------------

    const contentType =
        imageResponse.headers.get(
            "content-type"
        ) || "image/png";


    let extension =
        "png";


    if (
        contentType.includes(
            "jpeg"
        ) ||
        contentType.includes(
            "jpg"
        )
    ) {

        extension = "jpg";

    } else if (
        contentType.includes(
            "webp"
        )
    ) {

        extension = "webp";

    } else if (
        contentType.includes(
            "gif"
        )
    ) {

        extension = "gif";

    }


    // --------------------------------------------------------
    // CREATE FORM DATA
    // --------------------------------------------------------

    const blob =
        new Blob(
            [
                imageBuffer
            ],
            {
                type:
                    contentType
            }
        );


    const form =
        new FormData();


    form.append(
        "file",
        blob,
        `codm_screenshot.${extension}`
    );


    form.append(
        "language",
        "eng"
    );


    form.append(
        "OCREngine",
        "2"
    );


    form.append(
        "isOverlayRequired",
        "false"
    );


    form.append(
        "scale",
        "true"
    );


    // --------------------------------------------------------
    // SEND IMAGE DIRECTLY TO OCR.SPACE
    // --------------------------------------------------------

    console.log(
        "OCR: Sending screenshot to OCR.Space..."
    );


    const response =
        await fetch(
            OCR_ENDPOINT,
            {
                method: "POST",

                headers: {
                    apikey:
                        apiKey
                },

                body:
                    form
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
    // READ RESPONSE
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
                ? data.ErrorMessage.join(
                    " "
                )
                : String(
                    data.ErrorMessage ||
                    "OCR processing failed."
                );


        throw new Error(
            message
        );

    }


    // --------------------------------------------------------
    // EXTRACT OCR TEXT
    // --------------------------------------------------------

    const text =

        Array.isArray(
            data.ParsedResults
        )
            ? data.ParsedResults
                .map(
                    result =>
                        result?.ParsedText ||
                        ""
                )
                .join(
                    "\n"
                )
            : "";


    // --------------------------------------------------------
    // EMPTY OCR RESULT
    // --------------------------------------------------------

    if (
        !text.trim()
    ) {

        throw new Error(
            "OCR returned no readable text."
        );

    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    console.log(
        "OCR: Text successfully extracted."
    );


    // TEMPORARY DEBUG LOG
    // This lets us see exactly what OCR.Space
    // returned for the COD:M screenshot.

    console.log(
        "OCR RAW TEXT:\n" + text
    );


    // --------------------------------------------------------
    // RETURN
    // --------------------------------------------------------

    return {

        text:
            text.trim(),

        raw:
            data

    };

}