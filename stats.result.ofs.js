// stats.result.ofs.js
window.CVModuleResultados = (function() {
    function renderResumenTabs(HistorialSets, setResumenSeleccionado, callbackSeleccionar) {
        const tabsContainer = document.getElementById('resumenTabs');
        if (!tabsContainer) return;
        tabsContainer.innerHTML = '';

        let btnActual = document.createElement('button');
        btnActual.type = 'button';
        btnActual.className = `px-3.5 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${setResumenSeleccionado === 'ACTUAL' ? 'bg-brand-electric text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`;
        btnActual.textContent = `Set Actual (#${HistorialSets.length + 1})`;
        btnActual.onclick = (e) => { 
            e.preventDefault();
            callbackSeleccionar('ACTUAL'); 
        };
        tabsContainer.appendChild(btnActual);

        HistorialSets.forEach((_, idx) => {
            let btnSet = document.createElement('button');
            btnSet.type = 'button';
            btnSet.className = `px-3.5 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${setResumenSeleccionado === idx ? 'bg-brand-electric text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`;
            btnSet.textContent = `Set ${idx + 1}`;
            btnSet.onclick = (e) => { 
                e.preventDefault();
                callbackSeleccionar(idx); 
            };
            tabsContainer.appendChild(btnSet);
        });
    }

    function renderResumenAtletas(Roster, S, HistorialSets, setResumenSeleccionado, N) {
        const s = document.getElementById('st');
        if (!s) return;
        s.innerHTML = '';

        let accionesAResumir = S;
        if (setResumenSeleccionado !== 'ACTUAL') {
            accionesAResumir = HistorialSets[setResumenSeleccionado] || [];
        }

        let d = {};
        Roster.forEach(p => {
            d[p.key] = { key: p.key, p: 0, n: 0, total: 0, efectividad: 0, dif: 0, a: {}, name: p.name, num: p.num };
        });

        accionesAResumir.forEach(l => {
            let k = d[l.playerKey];
            if (k) {
                let v = N[l.action];
                let t = l.action.replace(/[#=\+\-]/g, '');
                
                if (v > 0) k.p++; else k.n++;
                k.total++;
                
                if (!k.a[t]) k.a[t] = { p: 0, n: 0 };
                if (v > 0) k.a[t].p++; else k.a[t].n++;
            }
        });

        Object.values(d).forEach(k => {
            k.efectividad = k.total > 0 ? Math.round((k.p / k.total) * 100) : 0;
            k.dif = k.p - k.n;
        });

        const listaOrdenada = Object.values(d).sort((a, b) => {
            if (b.dif !== a.dif) return b.dif - a.dif;
            return b.p - a.p;
        });

        if (!Roster.length) {
            s.innerHTML = '<p class="text-center text-slate-400 text-xs py-3">Agrega atletas al Roster para iniciar el registro.</p>';
        } else {
            listaOrdenada.forEach(k => {
                let dt = '';
                Object.keys(k.a).forEach(x => dt += `<span class="mr-2 font-mono">${x}: <span class="text-brand-electric font-bold">${k.a[x].p}</span>|<span class="text-orange-600 font-bold">${k.a[x].n}</span></span>`);
                s.innerHTML += `
                    <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex flex-col gap-1 shadow-sm">
                        <div class="flex justify-between items-center font-black text-slate-800">
                            <span>#${k.num} ${k.name}</span>
                            <div class="flex items-center gap-1.5">
                                <span class="px-2 py-0.5 rounded-lg ${k.dif >= 0 ? 'bg-blue-50 text-brand-electric' : 'bg-orange-50 text-orange-600'} font-mono text-sm font-black">Dif: ${k.dif >= 0 ? '+' : ''}${k.dif}</span>
                                <span class="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-black border border-emerald-200 font-mono">${k.efectividad}% Ef.</span>
                                <span class="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-black border border-slate-200 font-mono">Total <span class="text-brand-electric">${k.p}</span> | <span class="text-orange-600">${k.n}</span></span>
                            </div>
                        </div>
                        <div class="text-[10px] text-slate-500">${dt || '<span class="italic text-slate-400">Sin jugadas registradas en este set</span>'}</div>
                    </div>`;
            });
        }
    }

    function renderTablaMatricial(Roster, S, HistorialSets, N) {
        const tbodySets = document.getElementById('tablaSetsBody');
        let totalSetsJugados = Math.min(5, Math.max(1, HistorialSets.length + (S.length > 0 ? 1 : 0)));

        if (tbodySets) {
            const theadTr = tbodySets.closest('table').querySelector('thead tr');
            if (theadTr) {
                let thHtml = `<th class="p-2.5 min-w-[120px]">Atleta</th>`;
                for (let i = 0; i < totalSetsJugados; i++) {
                    thHtml += `<th class="p-2.5 text-center">Set ${i + 1}</th>`;
                }
                thHtml += `<th class="p-2.5 text-center min-w-[90px]">Total Partido</th>`;
                theadTr.innerHTML = thHtml;
            }

            tbodySets.innerHTML = '';
            if (!Roster.length) {
                tbodySets.innerHTML = `<tr><td colspan="${totalSetsJugados + 2}" class="text-center py-3 text-slate-400 italic">Sin atletas en el roster.</td></tr>`;
            } else {
                Roster.forEach(p => {
                    let tr = document.createElement('tr');
                    tr.className = "border-b border-slate-100 hover:bg-slate-50/50";
                    
                    let htmlCols = `<td class="p-2.5 font-bold text-slate-900">#${p.num} ${p.name}</td>`;
                    let totalP = 0, totalN = 0, totalGlobal = 0;

                    for (let i = 0; i < totalSetsJugados; i++) {
                        let accionesSet = (i < HistorialSets.length) ? HistorialSets[i] : S;
                        let setP = 0, setN = 0, setTot = 0;
                        
                        accionesSet.forEach(ac => {
                            if (ac.playerKey === p.key) {
                                if (N[ac.action] > 0) setP++; else setN++;
                                setTot++;
                            }
                        });

                        totalP += setP;
                        totalN += setN;
                        totalGlobal += setTot;

                        let setEf = setTot > 0 ? Math.round((setP / setTot) * 100) : 0;
                        let setDif = setP - setN;

                        htmlCols += `<td class="p-2.5 text-center font-mono">
                            <div class="text-xs font-black ${setDif >= 0 ? 'text-brand-electric' : 'text-orange-600'}">Dif: ${setDif >= 0 ? '+' : ''}${setDif}</div>
                            <div class="text-[11px] font-bold text-slate-700"><span class="text-brand-electric">${setP}</span> | <span class="text-orange-600">${setN}</span></div>
                            <div class="text-[9px] text-emerald-600 font-bold">${setEf}% Ef.</div>
                        </td>`;
                    }

                    let totalEf = totalGlobal > 0 ? Math.round((totalP / totalGlobal) * 100) : 0;
                    let totalDif = totalP - totalN;

                    htmlCols += `<td class="p-2.5 text-center font-black bg-slate-50/80 font-mono">
                        <div class="text-xs font-black ${totalDif >= 0 ? 'text-brand-electric' : 'text-orange-600'}">Dif: ${totalDif >= 0 ? '+' : ''}${totalDif}</div>
                        <div class="text-[11px] font-bold text-slate-900"><span class="text-brand-electric">${totalP}</span> | <span class="text-orange-600">${totalN}</span></div>
                        <div class="text-[9px] text-emerald-600 font-bold">${totalEf}% Ef.</div>
                    </td>`;

                    tr.innerHTML = htmlCols;
                    tbodySets.appendChild(tr);
                });
            }
        }
    }

    return {
        renderResumenTabs,
        renderResumenAtletas,
        renderTablaMatricial
    };
})();
