// Inisialisasi Partikel
if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 30, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": ["#ff007f", "#00f0ff"] },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": true },
            "size": { "value": 3, "random": true },
            "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.1, "width": 1 },
            "move": { "enable": true, "speed": 2, "direction": "none", "random": true, "out_mode": "out" }
        }
    });
}

let finalResolvedUrl = "";

// Load history pas web dibuka
document.addEventListener("DOMContentLoaded", () => {
    renderHistory();
});

async function doBypass() {
    const urlInput = document.getElementById("urlInput").value.trim();
    const logEl = document.getElementById("log");
    const btnBypass = document.getElementById("btnBypass");
    const btnText = btnBypass.querySelector(".btn-text");
    const loader = document.getElementById("loader");
    const actionArea = document.getElementById("actionArea");

    if (!urlInput) {
        logEl.textContent = "Error: Input URL kosong, olivia.";
        return;
    }

    btnBypass.disabled = true;
    if (btnText) btnText.classList.add("hidden");
    if (loader) loader.classList.remove("hidden");
    actionArea.classList.add("hidden");
    logEl.textContent = "Memproses...";
    finalResolvedUrl = "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`/api/resolve?url=${encodeURIComponent(urlInput)}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const textData = await response.text();
        let data;
        try { data = JSON.parse(textData); } catch (e) { throw new Error("Error Vercel (Format HTML)."); }

        logEl.textContent = data.log + "\n\n== HASIL AKHIR ==\n" + data.finalUrl;
        finalResolvedUrl = data.finalUrl;

        if (finalResolvedUrl && finalResolvedUrl !== urlInput && finalResolvedUrl.startsWith("http")) {
            actionArea.classList.remove("hidden");
            saveHistory(urlInput, finalResolvedUrl); // Simpan riwayat
        } else {
            logEl.textContent += "\n\n(Gagal: Link tidak berubah atau API limit)";
        }
    } catch (err) {
        logEl.textContent = err.name === 'AbortError' ? "Error: Timeout (15 detik)." : `Error: ${err.message}`;
    } finally {
        btnBypass.disabled = false;
        if (btnText) btnText.classList.remove("hidden");
        if (loader) loader.classList.add("hidden");
    }
}

function openInNewTab() {
    if (finalResolvedUrl) window.open(finalResolvedUrl, "_blank");
}

// FITUR COPY
function copyLink() {
    if (!finalResolvedUrl) return;
    navigator.clipboard.writeText(finalResolvedUrl).then(() => {
        const btnCopy = document.getElementById("btnCopy");
        const originalText = btnCopy.innerText;
        btnCopy.innerText = "Tercopy!";
        setTimeout(() => { btnCopy.innerText = originalText; }, 2000);
    }).catch(err => {
        alert("Gagal copy: " + err);
    });
}

// FITUR HISTORY (LOCALSTORAGE)
function saveHistory(original, bypassed) {
    let history = JSON.parse(localStorage.getItem("momo_history")) || [];
    // Cegah duplikat
    history = history.filter(item => item.original !== original);
    history.unshift({ original: original, bypassed: bypassed });
    
    // Batasi maksimal 5 riwayat
    if (history.length > 5) history.pop();
    
    localStorage.setItem("momo_history", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById("historyList");
    let history = JSON.parse(localStorage.getItem("momo_history")) || [];
    
    if (history.length === 0) {
        list.innerHTML = '<li class="empty-history">Belum ada riwayat.</li>';
        return;
    }

    list.innerHTML = "";
    history.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="history-url">${item.original}</span> <span style="font-size:10px; color:var(--text-dim);">➔</span>`;
        li.onclick = () => {
            document.getElementById("urlInput").value = item.original;
            document.getElementById("log").textContent = "== HASIL DARI RIWAYAT ==\n" + item.bypassed;
            finalResolvedUrl = item.bypassed;
            document.getElementById("actionArea").classList.remove("hidden");
        };
        list.appendChild(li);
    });
}

function clearHistory() {
    localStorage.removeItem("momo_history");
    renderHistory();
}
