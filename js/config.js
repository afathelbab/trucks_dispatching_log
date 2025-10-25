// Configuration and constants
export const config = {
    initialData: {
        contractors: {
            "Elsamy - السامي": {
                trucks: [
                    { license: "6141-7523", capacity: 47 }, { license: "6536-8561", capacity: 49 },
                    // ... more trucks
                ],
                destinations: ["Abu Madi - أبو ماضي", "Elaalamya - العالمية", "Eldawlya - الدولية", "Ultra Extract - ألترا اكستراكت", "Unico - يونيكو"]
            },
            "Elbassyouny - البسيوني": {
                trucks: [
                    { license: "1859-2397", capacity: 49 }, { license: "4327-9482", capacity: 51 },
                    // ... more trucks
                ],
                destinations: ["Abu Madi - أبو ماضي", "Elaalamya - العالمية"]
            },
            "Petrotreatment - بتروتريتمنت": {
                trucks: [
                    { license: "1954-5398" },
                    { license: "6359-4932" },
                    { license: "1932-5417" }
                ],
                destinations: ["Unico - يونيكو"]
            }
        },
        sources: [
            "Off-spec Condensate Tank",
            "Rich MEG Tank",
            "Open Drains - P01 Area",
            "Open Drain - S01 Area",
            "Inspection Tank"
        ]
    },
    shifts: ["Day Shift", "Night Shift - Before Midnight", "Night Shift After Midnight"],
    statuses: ["Dispatched", "Verified"],
    localStorageKeys: {
        appData: 'appData',
        dispatchLog: 'dispatchLog'
    }
};