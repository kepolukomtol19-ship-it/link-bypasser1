async function doBypass() {
    const urlInput = document.getElementById("urlInput").value.trim();
    const logEl = document.getElementById("log");
    const btnBypass = document.getElementById("btnBypass");
    const btnOpen = document.getElementById("btnOpen");

    if (!urlInput) return;

    logEl.textContent = "Memproses link (bisa 10-30 detik buat link key)...";
    btnBypass.disabled = true;
    btnOpen.disabled = true;

    try {
        const response = await fetch(`/api/resolve?url=${encodeURIComponent(urlInput)}`);
        const data = await response.json();

        logEl.textContent = data.log + "\n\n== HASIL AKHIR ==\n" + data.finalUrl;
        finalResolvedUrl = data.finalUrl;
        
        if (data.finalUrl && !data.finalUrl.includes("linkvertise") && !data.finalUrl.includes("work.ink")) {
            btnOpen.disabled = false;
        }

    } catch (err) {
        logEl.textContent = `Error: ${err.message}`;
    } finally {
        btnBypass.disabled = false;
    }
}
