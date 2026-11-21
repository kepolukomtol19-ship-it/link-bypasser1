let finalResolvedUrl = "";

async function doBypass() {
    const urlInput = document.getElementById("urlInput").value.trim();
    const logEl = document.getElementById("log");
    const btnBypass = document.getElementById("btnBypass");
    const btnText = btnBypass.querySelector(".btn-text");
    const loader = document.getElementById("loader");
    const btnOpen = document.getElementById("btnOpen");

    if (!urlInput) {
        logEl.textContent = "Error: Input URL kosong, olivia.";
        return;
    }

    // Animasi Loading Mulai
    btnBypass.disabled = true;
    btnText.classList.add("hidden");
    loader.classList.remove("hidden");
    btnOpen.classList.remove("show");
    btnOpen.disabled = true;
    logEl.textContent = "Memproses...\nMencari rute bypass terbaik...";
    finalResolvedUrl = "";

    try {
        const response = await fetch(`/api/resolve?url=${encodeURIComponent(urlInput)}`);
        const data = await response.json();

        logEl.textContent = data.log + "\n\n== HASIL AKHIR ==\n" + data.finalUrl;
        finalResolvedUrl = data.finalUrl;

        // Cek jika link berhasil di-bypass (berbeda dari input asli)
        if (finalResolvedUrl && finalResolvedUrl !== urlInput && finalResolvedUrl.startsWith("http")) {
            btnOpen.classList.add("show");
            btnOpen.disabled = false;
        } else {
            logEl.textContent += "\n\n(Gagal: Link tidak berubah atau API limit)";
        }
    } catch (err) {
        logEl.textContent = `Error Jaringan: ${err.message}`;
    } finally {
        // Animasi Loading Selesai
        btnBypass.disabled = false;
        btnText.classList.remove("hidden");
        loader.classList.add("hidden");
    }
}

function openInNewTab() {
    if (finalResolvedUrl) window.open(finalResolvedUrl, "_blank");
}
