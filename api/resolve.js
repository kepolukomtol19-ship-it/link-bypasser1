export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Parameter 'url' kosong" });

    let log = "";

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
            // Panggil API bypass
            const apiUrl = `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`;
            const apiRes = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
            const apiData = await apiRes.json();

            // Cek apakah hasilnya beneran link (diawali http) atau cuma teks error
            let resultLink = apiData.result || apiData.destination;

            if (resultLink && (resultLink.startsWith("http://") || resultLink.startsWith("https://"))) {
                log += `[API] Berhasil dibypass!\n`;
                return res.status(200).json({ finalUrl: resultLink, log });
            } else {
                // Kalau API ngirim teks "FREE API SHUT DOWN", kita tangkap di sini
                log += `[API Gagal] Server API lagi down atau limit.\n`;
                log += `[Info] Pesan dari API: ${resultLink || "Unknown error"}\n`;
                return res.status(200).json({ finalUrl: url, log });
            }

        } catch (err) {
            log += `[API Err] Gagal konek ke API: ${err.message}\n`;
            return res.status(200).json({ finalUrl: url, log });
        }
    }

    // --- KODE LAMA BUAT LINK BIASA (REDIRECT) ---
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
