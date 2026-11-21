export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL kosong" });

    let log = "";

    const bypassDomains = [
        "linkvertise.com", "linkvertise.net", "up-to-down.net",
        "work.ink", "loot-labs.com", "lootlabs.gg",
        "adfoc.us", "sub2unlock.com", "sub2unlock.net",
        "mboost.me", "boost.ink", "socialwolvez.com"
    ];

    const isShortener = bypassDomains.some(domain => url.includes(domain));

    if (isShortener) {
        log += `[Shortener] Terdeteksi link key. Mencari API yang hidup...\n`;
        
        // Daftar API Fallback
        const apiEndpoints = [
            `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`,
            `https://api.bypass.city/bypass?url=${encodeURIComponent(url)}`,
            `https://bypass.pics/api?url=${encodeURIComponent(url)}`
        ];

        for (let i = 0; i < apiEndpoints.length; i++) {
            try {
                log += `[Mencoba API ${i+1}]...\n`;
                const apiRes = await fetch(apiEndpoints[i], { 
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } 
                });
                
                const textData = await apiRes.text();
                let apiData;
                try { apiData = JSON.parse(textData); } catch(e) { continue; } // Skip kalau bukan JSON

                let resultLink = apiData.result || apiData.destination || apiData.url;

                if (resultLink && resultLink.startsWith("http")) {
                    log += `[API ${i+1}] Berhasil dibypass!\n`;
                    return res.status(200).json({ finalUrl: resultLink, log });
                }
            } catch (err) {
                log += `[API ${i+1}] Error/Timeout. Pindah...\n`;
            }
        }
        
        log += `[GAGAL] Semua API sedang down atau limit.\n`;
        return res.status(200).json({ finalUrl: url, log });
    }

    // Redirect Native (Buat link biasa)
    let currentUrl = url;
    const seen = new Set();
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0";

    for (let i = 0; i < 10; i++) {
        if (seen.has(currentUrl)) break;
        seen.add(currentUrl);

        try {
            const response = await fetch(currentUrl, { redirect: "manual", headers: { "User-Agent": UA } });
            log += `[${i}] ${response.status} -> ${currentUrl}\n`;

            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location");
                if (location) {
                    currentUrl = new URL(location, currentUrl).toString();
                    continue;
                }
            }
            break;
        } catch (e) {
            log += `[Err] ${e.message}\n`;
            break;
        }
    }

    return res.status(200).json({ finalUrl: currentUrl, log });
}
