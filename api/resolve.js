export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Parameter 'url' kosong" });

    let log = "";

    // 1. Deteksi domain shortener yang butuh bypass API
    const bypassDomains = [
        "linkvertise.com", "linkvertise.net", "up-to-down.net",
        "work.ink", "loot-labs.com", "lootlabs.gg",
        "adfoc.us", "sub2unlock.com", "sub2unlock.net",
        "mboost.me", "boost.ink", "socialwolvez.com"
    ];

    const isShortener = bypassDomains.some(domain => url.includes(domain));

    if (isShortener) {
        log += `[Shortener] Terdeteksi link key. Mengirim ke API Bypass...\n`;
        
        try {
            // GANTI URL API DI BAWAH SESUAI PROVIDER YANG LU PAKAI
            // Contoh pakai bypass.vip (butuh API key kalau pakai versi pro, atau pakai endpoint publik kalau ada)
            const apiUrl = `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`;
            
            const apiRes = await fetch(apiUrl, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });

            const apiData = await apiRes.json();

            if (apiData.status === "success" || apiData.result) {
                log += `[API] Berhasil dibypass!\n`;
                return res.status(200).json({ 
                    finalUrl: apiData.result || apiData.destination, 
                    log 
                });
            } else {
                log += `[API Error] ${apiData.message || "Gagal bypass"}\n`;
                // Fallback ke archive atau lempar error
                return res.status(200).json({ finalUrl: url, log });
            }

        } catch (err) {
            log += `[API Err] ${err.message}\n`;
            return res.status(200).json({ finalUrl: url, log });
        }
    }

    // 2. JIKA LINK BIASA (Bukan shortener key), pakai metode redirect lama
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
