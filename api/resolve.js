export default async function handler(req, res) {
    // CORS biar aman
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    
    if (req.method === "OPTIONS") return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Parameter 'url' kosong" });

    let currentUrl = url;
    let log = "";
    const seen = new Set();
    const maxHops = 20;
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

    for (let i = 0; i < maxHops; i++) {
        if (seen.has(currentUrl)) {
            log += `[Loop] Terdeteksi redirect berulang.\n`;
            break;
        }
        seen.add(currentUrl);

        try {
            // Fetch tanpa follow redirect otomatis
            const response = await fetch(currentUrl, {
                method: "GET",
                redirect: "manual",
                headers: { "User-Agent": UA }
            });

            log += `[${i}] ${response.status} -> ${currentUrl}\n`;

            // 1. Handle HTTP 301/302/307
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location");
                if (location) {
                    currentUrl = new URL(location, currentUrl).toString();
                    continue;
                }
            }

            const html = await response.text();

            // 2. Handle Meta Refresh
            const metaMatch = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i);
            if (metaMatch) {
                currentUrl = new URL(metaMatch[1], currentUrl).toString();
                log += `[Meta] -> ${currentUrl}\n`;
                continue;
            }

            // 3. Handle JS Redirect (window.location = "...")
            const jsMatch = html.match(/(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i);
            if (jsMatch) {
                currentUrl = new URL(jsMatch[1], currentUrl).toString();
                log += `[JS] -> ${currentUrl}\n`;
                continue;
            }

            // 4. Deteksi Paywall & Fallback ke Archive
            const isPaywall = /paywall|subscribe to read|premium content/i.test(html);
            if (isPaywall && !currentUrl.includes("web.archive.org")) {
                log += `[Paywall] Terdeteksi paywall. Mengalihkan ke Archive.org...\n`;
                currentUrl = `https://web.archive.org/web/2024/${currentUrl}`;
                continue;
            }

            // Selesai
            return res.status(200).json({ finalUrl: currentUrl, log });

        } catch (err) {
            log += `[Error] ${err.message}\n`;
            break;
        }
    }

    return res.status(200).json({ finalUrl: currentUrl, log });
}
