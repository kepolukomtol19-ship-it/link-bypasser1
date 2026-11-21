let finalResolvedUrl = "";

async function doBypass() {
    // Ganti bagian try lu jadi kayak gini:
    try {
        const response = await fetch(`/api/resolve?url=${encodeURIComponent(urlInput)}`);
        
        // Baca sebagai teks dulu
        const textData = await response.text();
        let data;

        // Coba ubah ke JSON
        try {
            data = JSON.parse(textData);
        } catch (e) {
            throw new Error("API Error: Server menolak request (bukan format JSON).");
        }

        logEl.textContent = data.log + "\n\n== HASIL AKHIR ==\n" + data.finalUrl;
        finalResolvedUrl = data.finalUrl;

        if (finalResolvedUrl && finalResolvedUrl !== urlInput && finalResolvedUrl.startsWith("http")) {
            btnOpen.classList.add("show");
            btnOpen.disabled = false;
        } else {
            logEl.textContent += "\n\n(Gagal: Link tidak berubah atau API limit)";
        }
    } catch (err) {
        logEl.textContent = `Error: ${err.message}`;
    }
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
