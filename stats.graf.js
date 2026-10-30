// stats.graf.ofs.js
window.CVModuleGraficas = (function() {
    function renderGraficaTabs(HistorialSets, setGraficaSeleccionado, callbackSeleccionar) {
        const container = document.getElementById('setGraficasTabs');
        if (!container) return;
        container.innerHTML = '';

        HistorialSets.forEach((_, idx) => {
            let btnSet = document.createElement('button');
            btnSet.type = 'button';
            btnSet.className = `px-3.5 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${setGraficaSeleccionado === idx ? 'bg-brand-electric text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`;
            btnSet.textContent = `Set ${idx + 1}`;
            btnSet.onclick = (e) => { 
                e.preventDefault();
                callbackSeleccionar(idx); 
            };
            container.appendChild(btnSet);
        });

        let btnActual = document.createElement('button');
        btnActual.type = 'button';
        btnActual.className = `px-3.5 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${setGraficaSeleccionado === 'ACTUAL' ? 'bg-brand-electric text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`;
        btnActual.textContent = `Set Actual (#${HistorialSets.length + 1})`;
        btnActual.onclick = (e) => { 
            e.preventDefault();
            callbackSeleccionar('ACTUAL'); 
        };
        container.appendChild(btnActual);
    }

    function actualizarGraficas(S, HistorialSets, M, setGraficaSeleccionado, O, N, P, K, chartInstancia1, chartInstancia2, callbackActualizarInstancias) {
        const c1El = document.getElementById('c1');
        const c2El = document.getElementById('c2');
        if (!c1El || !c2El) return { b: chartInstancia1, a: chartInstancia2 };

        const x1 = c1El.getContext('2d'), x2 = c2El.getContext('2d'), labels = Object.values(O);
        let v1 = { p: [0,0,0,0,0,0], n: [0,0,0,0,0,0] }, v2 = { p: [0,0,0,0,0,0], n: [0,0,0,0,0,0] }, tp = 0, tn = 0;

        let accionesGraficaSet = S;
        let tituloSetLabel = `SET ACTUAL (Set #${HistorialSets.length + 1})`;
        if (setGraficaSeleccionado !== 'ACTUAL') {
            accionesGraficaSet = HistorialSets[setGraficaSeleccionado] || [];
            tituloSetLabel = `SET #${setGraficaSeleccionado + 1} (Guardado)`;
        }

        const keys = Object.keys(O);
        keys.forEach((k, idx) => {
            let p = 0, n = 0, ap = 0, an = 0;
            accionesGraficaSet.forEach(z => { 
                let t = z.action.replace(/[#=\+\-]/g, '');
                if (t === k) N[z.action] > 0 ? p++ : n++; 
            });
            M.forEach(z => { 
                let t = z.action.replace(/[#=\+\-]/g, '');
                if (t === k) {
                    if (N[z.action] > 0) { ap++; tp++; } else { an++; tn++; }
                }
            });
            v1.p[idx] = p; v1.n[idx] = n;
            v2.p[idx] = ap; v2.n[idx] = an;
        });

        if (chartInstancia1) chartInstancia1.destroy();
        let nuevaB = new Chart(x1, { type: 'bar', data: { labels, datasets: [{ label: 'Positivo (+)', data: v1.p, backgroundColor: P.b }, { label: 'Negativo (-)', data: v1.n, backgroundColor: P.o }] }, options: { ...K, plugins: { title: { display: true, text: tituloSetLabel } } } });
        
        const locInput = document.getElementById('equipoLocal');
        const rivInput = document.getElementById('equipoRival');
        const loc = locInput ? locInput.value || 'Local' : 'Local';
        const riv = rivInput ? rivInput.value || 'Rival' : 'Rival';
        
        const sumEl = document.getElementById('sum');
        if (sumEl) sumEl.innerHTML = `${loc} vs ${riv} — Sets jugados: <span class="text-brand-electric font-bold">${HistorialSets.length + 1}</span> | Positivos Totales: <span class="text-brand-electric font-bold">${tp}</span> | Negativos Totales: <span class="text-orange-600 font-bold">${tn}</span>`;
        
        if (chartInstancia2) chartInstancia2.destroy();
        let nuevaA = new Chart(x2, { type: 'bar', data: { labels, datasets: [{ label: 'Positivo (+)', data: v2.p, backgroundColor: P.b }, { label: 'Negativo (-)', data: v2.n, backgroundColor: P.o }] }, options: { ...K, plugins: { title: { display: true, text: 'TOTAL PARTIDO ACUMULADO' } } } });

        return { b: nuevaB, a: nuevaA };
    }

    return {
        renderGraficaTabs,
        actualizarGraficas
    };
})();
