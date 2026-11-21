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
        
        // Daftar API Fallback Terbaru
        const apiEndpoints = [
            `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`,
            `https://api.bypass.pics/bypass?url=${encodeURIComponent(url)}`,
            `https://bypass.bot.nu/bypass?url=${encodeURIComponent(url)}`,
            `https://api.bypass.tools/api?url=${encodeURIComponent(url)}`,
            `https://api.bypass.city/bypass?url=${encodeURIComponent(url)}`
        ];

        // Rotasi User-Agent biar gak dianggap bot sama Cloudflare
        const userAgents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
        ];

        for (let i = 0; i < apiEndpoints.length; i++) {
            try {
                log += `[Mencoba API ${i+1}]...\n`;
                const apiRes = await fetch(apiEndpoints[i], { 
                    headers: { 
                        "User-Agent": userAgents[i % userAgents.length],
                        "Accept": "application/json"
                    } 
                });
                
                const textData = await apiRes.text();
                let apiData;
                
                // Cek JSON
                try { 
                    apiData = JSON.parse(textData); 
                } catch(e) { 
                    log += `[API ${i+1}] Nolak (bukan JSON).\n`;
                    continue; 
                }

                let resultLink = apiData.result || apiData.destination || apiData.url || apiData.data;

                if (resultLink && typeof resultLink === "string" && resultLink.startsWith("http")) {
                    log += `[API ${i+1}] Berhasil dibypass!\n`;
                    return res.status(200).json({ finalUrl: resultLink, log });
                } else {
                    log += `[API ${i+1}] Respon tidak valid.\n`;
                }
            } catch (err) {
                log += `[API ${i+1}] Timeout / Error. Pindah...\n`;
            }
        }
        
        log += `[GAGAL] Semua API sedang mokad atau limit harian habis.\n`;
        return res.status(200).json({ finalUrl: url, log });
    }

    // --- REDIRECT NATIVE ---
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
