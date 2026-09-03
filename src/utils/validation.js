export function validateKills(value) {

    if (!/^\d+$/.test(value)) {
        return {
            valid: false,
            message: "Kills must be a whole number."
        };
    }

    const kills = Number(value);

    if (kills < 0 || kills > 9999) {
        return {
            valid: false,
            message: "Invalid kills value."
        };
    }

    return {
        valid: true,
        value: kills
    };
}


export function validatePercentage(value) {

    const normalized =
        String(value)
            .trim()
            .replace("%", "");

    if (!/^\d+(\.\d+)?$/.test(normalized)) {
        return {
            valid: false,
            message:
                "Accuracy must be a number such as 25 or 25.50."
        };
    }

    const number =
        Number(normalized);

    if (number < 0 || number > 100) {
        return {
            valid: false,
            message:
                "Percentage must be between 0 and 100."
        };
    }

    return {
        valid: true,
        value: Number(number.toFixed(2))
    };
}


export function isValidRoleType(role) {

    return [
        "PRIMARY",
        "SECONDARY"
    ].includes(role);
}


export function isImageAttachment(attachment) {

    if (!attachment) {
        return false;
    }

    if (
        attachment.contentType &&
        attachment.contentType.startsWith("image/")
    ) {
        return true;
    }

    const name =
        attachment.name?.toLowerCase() || "";

    return (
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".webp") ||
        name.endsWith(".gif")
    );
}