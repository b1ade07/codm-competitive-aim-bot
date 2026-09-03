export function getDailyCycle() {

    const now = new Date();

    const ist = new Date(
        now.toLocaleString(
            "en-US",
            {
                timeZone: "Asia/Kolkata"
            }
        )
    );

    if (ist.getHours() < 3) {
        ist.setDate(
            ist.getDate() - 1
        );
    }

    const year =
        ist.getFullYear();

    const month =
        String(
            ist.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            ist.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


export function getISTDateTime() {

    return new Date().toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            hour12: false
        }
    );
}