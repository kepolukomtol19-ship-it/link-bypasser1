// Inisialisasi Partikel (Animasi di belakang kaca)
if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 40, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": ["#ff007f", "#00f0ff", "#ffffff"] },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": true },
            "size": { "value": 3, "random": true },
            "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.1, "width": 1 },
            "move": { "enable": true, "speed": 2, "direction": "none", "random": true, "out_mode": "out" }
        },
        "interactivity": {
            "events": { "onhover": { "enable": true, "mode": "grab" } },
            "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } } }
        }
    });
}

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
    if (btnText) btnText.classList.add("hidden");
    if (loader) loader.classList.remove("hidden");
    btnOpen.classList.remove("show");
    btnOpen.disabled = true;
    logEl.textContent = "Memproses...\nMenembak API. (Maksimal tunggu 15 detik)";
    finalResolvedUrl = "";

    // Set Timeout biar gak nge-hang
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`/api/resolve?url=${encodeURIComponent(urlInput)}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const textData = await response.text();
        let data;

        try {
            data = JSON.parse(textData);
        } catch (e) {
            throw new Error("Server ngebales format HTML (Error Vercel).");
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
        if (err.name === 'AbortError') {
            logEl.textContent = "Error: Timeout! API terlalu lama merespon (15 detik).";
        } else {
            logEl.textContent = `Error Jaringan: ${err.message}`;
        }
    } finally {
        // Animasi Loading Selesai
        btnBypass.disabled = false;
        if (btnText) btnText.classList.remove("hidden");
        if (loader) loader.classList.add("hidden");
    }
}

function openInNewTab() {
    if (finalResolvedUrl) window.open(finalResolvedUrl, "_blank");
}
