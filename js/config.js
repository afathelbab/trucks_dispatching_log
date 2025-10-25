// Configuration and constants
export const config = {
    initialData: {
        contractors: {
            "Elsamy - السامي": {
                trucks: [
                    { license: "6141-7523", capacity: 47 }, { license: "6536-8561", capacity: 49 },
                    { license: "6141-8512", capacity: 58 }, { license: "3463-3921", capacity: 56 },
                    { license: "8825-9471", capacity: 58 }, { license: "4175-6817", capacity: 49 },
                    { license: "9856-1795", capacity: 53 }, { license: "1277-9734", capacity: 50 },
                    { license: "8385-8789", capacity: 51 }, { license: "8348-9212", capacity: 48 },
                    { license: "2712-6893", capacity: 59 }, { license: "3845-1764", capacity: 55 },
                    { license: "6478-1368", capacity: 50 }, { license: "5312-9793", capacity: 57 },
                    { license: "1831-3734", capacity: 50 }, { license: "7956-2616", capacity: 59 },
                    { license: "3735-3453", capacity: 50 }, { license: "5939-1187", capacity: 48 },
                    { license: "8241-7579", capacity: 52 }, { license: "5715-3526", capacity: 50 },
                    { license: "1286-9472", capacity: 49 }, { license: "6479-9735", capacity: 50 },
                    { license: "7978-5474", capacity: 50 }, { license: "4846-9165", capacity: 50 },
                    { license: "5945-2757", capacity: 50 }, { license: "1752-8471", capacity: 49 },
                    { license: "4678-7176", capacity: 51 }, { license: "9471-1285", capacity: 48 }
                ],
                destinations: ["Abu Madi - أبو ماضي", "Elaalamya - العالمية", "Eldawlya - الدولية", "Ultra Extract - ألترا اكستراكت", "Unico - يونيكو"]
            },
            "Elbassyouny - البسيوني": {
                trucks: [
                    { license: "1859-2397", capacity: 49 }, { license: "4327-9482", capacity: 51 },
                    { license: "1892-5291", capacity: 61 }, { license: "4869-2487", capacity: 52 },
                    { license: "2459-2638", capacity: 53 }, { license: "1739-2749", capacity: 52 },
                    { license: "3129-1835", capacity: 57 }, { license: "1524-8913", capacity: 50 },
                    { license: "3467-1429", capacity: 55 }, { license: "3128-8237", capacity: 51 },
                    { license: "2518-9576", capacity: 52 }, { license: "5812-5164", capacity: 52 },
                    { license: "9583-5368", capacity: 44 }, { license: "5397-1876", capacity: 55 },
                    { license: "9568-5746", capacity: 48 }, { license: "5746-9568", capacity: 55}
                ],
                destinations: ["Abu Madi - أبو ماضي", "Elaalamya - العالمية"]
            },
            "Petrotreatment - بتروتريتمنت": {
                trucks: [
                    { license: "1954-5398", capacity: null }, // Assuming null capacity for manual entry
                    { license: "6359-4932", capacity: null },
                    { license: "1932-5417", capacity: null }
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
        ],
    },
    localStorageKeys: {
        appData: 'appData',
        dispatchLog: 'dispatchLog'
    }
};