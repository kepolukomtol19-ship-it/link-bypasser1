let finalResolvedUrl = "";

async function doBypass() {
    const urlInput = document.getElementById("urlInput").value.trim();
    const logEl = document.getElementById("log");
    const btnBypass = document.getElementById("btnBypass");
    const btnOpen = document.getElementById("btnOpen");

    if (!urlInput) {
        logEl.textContent = "Error: URL kosong, olivia.";
        return;
    }

    logEl.textContent = "Memproses... (ngikutin redirect)";
    btnBypass.disabled = true;
    btnOpen.disabled = true;
    finalResolvedUrl = "";

    try {
        // Panggil backend serverless
        const response = await fetch(`/api/resolve?url=${encodeURIComponent(urlInput)}`);
        const data = await response.json();

        if (data.error) {
            logEl.textContent = `Gagal: ${data.error}`;
            return;
        }

        finalResolvedUrl = data.finalUrl;
        logEl.textContent = data.log + "\n\n== HASIL AKHIR ==\n" + finalResolvedUrl;
        btnOpen.disabled = false;

    } catch (err) {
        logEl.textContent = `Error Jaringan: ${err.message}`;
    } finally {
        btnBypass.disabled = false;
    }
}

function openInNewTab() {
    if (finalResolvedUrl) {
        window.open(finalResolvedUrl, "_blank");
    }
}