// stats.honor.ofs.js
window.CVModuleHonor = (function() {
    function renderCuadroHonor(Roster, M, N) {
        const grid = document.getElementById('cuadroHonorGrid');
        if (!grid) return;
        let dPartido = {};

        Roster.forEach(p => {
            dPartido[p.key] = { p: 0, n: 0, total: 0, efectividad: 0, dif: 0, name: p.name, num: p.num };
        });

        M.forEach(l => {
            let k = dPartido[l.playerKey];
            if (k) {
                let v = N[l.action];
                if (v > 0) k.p++; else k.n++;
                k.total++;
            }
        });

        Object.values(dPartido).forEach(k => {
            k.efectividad = k.total > 0 ? Math.round((k.p / k.total) * 100) : 0;
            k.dif = k.p - k.n;
        });

        const topCuadro = Object.values(dPartido)
            .filter(x => x.total > 0)
            .sort((a, b) => {
                if (b.dif !== a.dif) return b.dif - a.dif;
                return b.p - a.p;
            })
            .slice(0, 4);

        if (!topCuadro.length) {
            grid.innerHTML = '<p class="col-span-full text-center text-slate-400 text-xs py-4 italic">Se requieren acciones registradas en el partido para determinar los reconocimientos.</p>';
            return;
        }

        grid.innerHTML = '';
        topCuadro.forEach((k, idx) => {
            let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
            let badgeText = `Top #${idx + 1}`;
            let iconHtml = '<i class="fas fa-medal text-slate-400"></i>';

            if (idx === 0) {
                badgeStyle = "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md border-amber-300";
                badgeText = "🏆 MVP DEL PARTIDO";
                iconHtml = '<i class="fas fa-crown text-amber-300 animate-bounce"></i>';
            } else if (idx === 1) {
                badgeStyle = "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md border-blue-300";
                badgeText = "⭐ ALL-STAR";
                iconHtml = '<i class="fas fa-star text-sky-200"></i>';
            }

            grid.innerHTML += `
                <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 relative overflow-hidden">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${badgeStyle} flex items-center gap-1">
                            ${iconHtml} ${badgeText}
                        </span>
                        <span class="text-xs font-black text-emerald-600 font-mono">${k.efectividad}% Ef.</span>
                    </div>
                    <div>
                        <div class="text-xs font-black text-slate-900 truncate">#${k.num} ${k.name}</div>
                        <div class="flex items-center justify-between text-[10px] font-semibold mt-1">
                            <span class="font-mono text-sm font-black ${k.dif >= 0 ? 'text-brand-electric' : 'text-orange-600'}">Dif: ${k.dif >= 0 ? '+' : ''}${k.dif}</span>
                            <span class="font-mono text-slate-600">Total <span class="text-brand-electric font-bold">${k.p}</span> | <span class="text-orange-600 font-bold">${k.n}</span></span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    return { renderCuadroHonor };
})();
