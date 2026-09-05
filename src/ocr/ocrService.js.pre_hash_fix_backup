import "dotenv/config";
import crypto from "crypto";

const OCR_ENDPOINT =
    "https://api.ocr.space/parse/image";

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

    const screenshotHash =
        crypto
            .createHash("sha256")
            .update(
                Buffer.from(imageBuffer)
            )
            .digest("hex");

    console.log(
        "OCR: Screenshot hash generated."
    );

    const contentType =
        imageResponse.headers.get(
            "content-type"
        ) || "image/png";

    let extension = "png";

    if (
        contentType.includes("jpeg") ||
        contentType.includes("jpg")
    ) {
        extension = "jpg";
    } else if (
        contentType.includes("webp")
    ) {
        extension = "webp";
    } else if (
        contentType.includes("gif")
    ) {
        extension = "gif";
    }

    const blob =
        new Blob(
            [imageBuffer],
            {
                type: contentType
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

    console.log(
        "OCR: Sending screenshot to OCR.Space..."
    );

    const response =
        await fetch(
            OCR_ENDPOINT,
            {
                method: "POST",
                headers: {
                    apikey: apiKey
                },
                body: form
            }
        );

    if (!response.ok) {
        throw new Error(
            `OCR API HTTP error: ${response.status}`
        );
    }

    const data =
        await response.json();

    if (data.IsErroredOnProcessing) {
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
                .join("\n")
            : "";

    if (!text.trim()) {
        throw new Error(
            "OCR returned no readable text."
        );
    }

    console.log(
        "OCR: Text successfully extracted."
    );

    console.log(
        "OCR RAW TEXT:\n" + text
    );

    return {
        text: text.trim(),
        raw: data,
        screenshotHash
    };
}