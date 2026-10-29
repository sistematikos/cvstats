(async function () {
    import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(async ({ createClient }) => {

        const _ = id => document.getElementById(id);
        const empresaID = (localStorage.getItem('youcontrol_empresa_id') || '').trim();
        const clubNombre = localStorage.getItem('control_voley_club_nombre') || empresaID || 'Club Voley';

        let supaUrl = localStorage.getItem('control_voley_supa_url');
        let supaKey = localStorage.getItem('control_voley_supa_key');

        if (supaUrl) supaUrl = supaUrl.replace(/[\[\]]/g, '').trim();
        if (supaKey) supaKey = supaKey.replace(/[\[\]]/g, '').trim();

        if (!empresaID || !supaUrl || !supaKey) {
            alert("Sesión no autorizada o credenciales faltantes.");
            window.location.href = '../index.html';
        }

        const userEmailEl = _('userEmail');
        if (userEmailEl) {
            userEmailEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Club: ${clubNombre}`;
        }

        const supabase = createClient(supaUrl, supaKey);

        let L_Nomina = [];
        let Roster = [];
        let S = [];
        let HistorialSets = [];
        let M = [];
        let atletaSeleccionadoKey = null;
        let b = null, a = null;
        let toastTimeout = null;

        const N = {
            'Servicio#': 1,  'Servicio=': -1,
            'Ataque#': 1,    'Ataque=': -1,
            'Bloqueo#': 1,   'Bloqueo=': -1,
            'Recepción#': 1, 'Recepción=': -1,
            'Defensa#': 1,   'Defensa=': -1,
            'Armada+': 1,    'Armada-': -1
        };

        const O = { 
            Servicio: 'Servicio', 
            Ataque: 'Ataque', 
            Bloqueo: 'Bloqueo', 
            Recepción: 'Recepción', 
            Defensa: 'Defensa',
            Armada: 'Armada'
        };
        const P = { b: '#0055FF', r: '#dc2626', o: '#FF5500', g: '#10b981' };
        const K = { scales: { y: { ticks: { stepSize: 1 } } }, responsive: true, maintainAspectRatio: false };

        function mostrarToast(mensaje) {
            const toast = _('toastNotificacion');
            const texto = _('toastTexto');
            if (!toast || !texto) return;
            texto.textContent = mensaje;

            toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
            toast.classList.add('opacity-100', 'translate-y-0');

            if (toastTimeout) clearTimeout(toastTimeout);

            toastTimeout = setTimeout(() => {
                toast.classList.remove('opacity-100', 'translate-y-0');
                toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
            }, 2000);
        }

        function poblarNominaSelect() {
            const select = _('selectNomina');
            if (!select) return;
            select.innerHTML = '<option value="">Seleccione de Nómina...</option>';
            L_Nomina.forEach(p => {
                let o = document.createElement('option');
                o.value = p.cedulaIdentidad || p.id;
                o.textContent = `#${p.nroCamiseta || '0'} ${p.nombre} ${p.apellido || ''}`;
                select.appendChild(o);
            });
        }

        function renderRosterCards() {
            const container = _('rosterCardsGrid');
            const countRoster = _('countRoster');
            if (countRoster) countRoster.textContent = Roster.length;

            if (!container) return;

            if (!Roster.length) {
                container.innerHTML = '<div class="col-span-full text-center py-4 text-xs text-slate-400 italic">No hay atletas en el roster del partido.</div>';
                const badge = _('atletaSeleccionadoBadge');
                if (badge) badge.classList.add('hidden');
                atletaSeleccionadoKey = null;
                return;
            }

            container.innerHTML = '';
            Roster.forEach(p => {
                const card = document.createElement('div');
                const isSelected = (atletaSeleccionadoKey === p.key);
                
                card.className = `relative p-2.5 rounded-2xl cursor-pointer flex items-center gap-2 card-atleta-item shadow-sm ${isSelected ? 'card-atleta-selected' : ''}`;
                card.onclick = () => seleccionarAtleta(p.key, p.num, p.name);

                card.innerHTML = `
                    <button type="button" class="absolute top-1 right-2 text-slate-300 hover:text-rose-600 font-bold text-xs z-10" onclick="event.stopPropagation(); window.quitarDeRoster('${p.key}')">&times;</button>
                    <span class="px-2 py-0.5 rounded-lg bg-blue-50 text-brand-electric font-black text-xs border border-blue-100 shrink-0">#${p.num}</span>
                    <div class="font-extrabold text-slate-900 text-xs truncate w-full">${p.name}</div>
                `;
                container.appendChild(card);
            });
        }

        function seleccionarAtleta(key, num, name) {
            atletaSeleccionadoKey = key;
            const badge = _('atletaSeleccionadoBadge');
            const nombreSel = _('nombreAtletaSel');
            if (badge) badge.classList.remove('hidden');
            if (nombreSel) nombreSel.textContent = `#${num} ${name}`;
            renderRosterCards();
        }

        window.quitarDeRoster = (key) => {
            Roster = Roster.filter(x => x.key !== key);
            if (atletaSeleccionadoKey === key) {
                atletaSeleccionadoKey = null;
                const badge = _('atletaSeleccionadoBadge');
                if (badge) badge.classList.add('hidden');
            }
            guardarEstado();
            renderRosterCards();
            U();
        };

        window.registrarAccionDirecta = (accion) => {
            if (!atletaSeleccionadoKey) {
                alert("Por favor selecciona un atleta del roster primero (Paso 1).");
                return;
            }

            let l = { playerKey: atletaSeleccionadoKey, action: accion };
            M.push(l);
            S.push(l);
            guardarEstado();
            U();
            mostrarToast(`Registrado: ${accion}`);
        };

        function guardarEstado() {
            localStorage.setItem('vRoster_' + empresaID, JSON.stringify(Roster));
            localStorage.setItem('vS_' + empresaID, JSON.stringify(S));
            localStorage.setItem('vHistSets_' + empresaID, JSON.stringify(HistorialSets));
            localStorage.setItem('vM_' + empresaID, JSON.stringify(M));
        }

        function guardarEnHistorial() {
            if (!M.length) return;
            let historial = JSON.parse(localStorage.getItem('vHistorial_' + empresaID) || '[]');
            const loc = _('equipoLocal')?.value || clubNombre;
            const riv = _('equipoRival')?.value || 'Rival';
            
            const partidoResumen = {
                id: Date.now(),
                fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                enfrentamiento: `${loc} vs ${riv}`,
                accionesTotales: M.length,
                datos: [...M],
                sets: [...HistorialSets]
            };

            historial.unshift(partidoResumen);
            if (historial.length > 7) historial.pop();
            localStorage.setItem('vHistorial_' + empresaID, JSON.stringify(historial));
            renderHistorial();
        }

        function renderHistorial() {
            const grid = _('historialGrid');
            if (!grid) return;
            let historial = JSON.parse(localStorage.getItem('vHistorial_' + empresaID) || '[]');
            
            if (!historial.length) {
                grid.innerHTML = '<p class="text-center text-slate-400 text-xs py-2 italic">No hay partidos guardados en el historial.</p>';
                return;
            }

            grid.innerHTML = '';
            historial.forEach((h, idx) => {
                grid.innerHTML += `
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                            <span class="font-black text-slate-900">${h.enfrentamiento}</span>
                            <div class="text-[10px] text-slate-500">Fecha: ${h.fecha} — Sets jugados: ${h.sets?.length || 0}</div>
                        </div>
                        <span class="px-2 py-1 bg-brand-50 text-brand-electric font-bold rounded-lg border border-brand-electric/20">Partido #${idx + 1}</span>
                    </div>
                `;
            });
        }

        function U() {
            const s = _('st');
            if (!s) return;
            s.innerHTML = '';

            let d = {};
            Roster.forEach(p => {
                d[p.key] = { key: p.key, p: 0, n: 0, total: 0, efectividad: 0, dif: 0, a: {}, name: p.name, num: p.num };
            });

            S.forEach(l => {
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
                    Object.keys(k.a).forEach(x => dt += `<span class="mr-2 font-mono">${x}: <span class="text-brand-electric font-bold">${k.a[x].p}</span>|<span class="text-brand-orange font-bold">${k.a[x].n}</span></span>`);
                    s.innerHTML += `
                        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex flex-col gap-1 shadow-sm">
                            <div class="flex justify-between items-center font-black text-slate-800">
                                <span>#${k.num} ${k.name}</span>
                                <div class="flex items-center gap-1.5">
                                    <span class="px-2 py-0.5 rounded-lg ${k.dif >= 0 ? 'bg-blue-50 text-brand-electric' : 'bg-orange-50 text-brand-orange'} font-mono">Dif: ${k.dif >= 0 ? '+' : ''}${k.dif}</span>
                                    <span class="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-black border border-emerald-200 font-mono">${k.efectividad}% Ef.</span>
                                    <span class="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-black border border-slate-200 font-mono">Total <span class="text-brand-electric">${k.p}</span> | <span class="text-brand-orange">${k.n}</span></span>
                                </div>
                            </div>
                            <div class="text-[10px] text-slate-500">${dt || '<span class="italic text-slate-400">Sin jugadas registradas en este set</span>'}</div>
                        </div>`;
                });
            }

            const tbodySets = _('tablaSetsBody');
            if (tbodySets) {
                tbodySets.innerHTML = '';
                if (!Roster.length) {
                    tbodySets.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-slate-400 italic">Sin atletas en el roster.</td></tr>';
                } else {
                    Roster.forEach(p => {
                        let tr = document.createElement('tr');
                        tr.className = "border-b border-slate-100 hover:bg-slate-50/50";
                        
                        let htmlCols = `<td class="p-2.5 font-bold text-slate-900">#${p.num} ${p.name}</td>`;
                        let totalP = 0, totalN = 0;

                        for (let i = 0; i < 5; i++) {
                            let accionesSet = (i === HistorialSets.length) ? S : (HistorialSets[i] || []);
                            let setP = 0, setN = 0;
                            
                            accionesSet.forEach(ac => {
                                if (ac.playerKey === p.key) {
                                    if (N[ac.action] > 0) setP++; else setN++;
                                }
                            });

                            totalP += setP;
                            totalN += setN;
                            let setDif = setP - setN;

                            if (i > HistorialSets.length) {
                                htmlCols += `<td class="p-2.5 text-center text-slate-300">-</td>`;
                            } else {
                                htmlCols += `<td class="p-2.5 text-center font-mono">
                                    <span class="text-brand-electric font-bold">${setP}</span>/<span class="text-brand-orange font-bold">${setN}</span>
                                    <div class="text-[9px] ${setDif >= 0 ? 'text-blue-600' : 'text-orange-600'}">Dif: ${setDif >= 0 ? '+' : ''}${setDif}</div>
                                </td>`;
                            }
                        }

                        let totalDif = totalP - totalN;
                        htmlCols += `<td class="p-2.5 text-center font-black bg-slate-50/80 font-mono">
                            <span class="text-brand-electric">${totalP}</span>/<span class="text-brand-orange">${totalN}</span>
                            <div class="text-[9px] ${totalDif >= 0 ? 'text-blue-600' : 'text-orange-600'}">Dif: ${totalDif >= 0 ? '+' : ''}${totalDif}</div>
                        </td>`;

                        tr.innerHTML = htmlCols;
                        tbodySets.appendChild(tr);
                    });
                }
            }

            const c1El = _('c1');
            const c2El = _('c2');
            if (c1El && c2El) {
                const x1 = c1El.getContext('2d'), x2 = c2El.getContext('2d'), l = Object.values(O);
                let v1 = { p: [0,0,0,0,0,0], n: [0,0,0,0,0,0] }, v2 = { p: [0,0,0,0,0,0], n: [0,0,0,0,0,0] }, tp = 0, tn = 0;

                const keys = Object.keys(O);
                keys.forEach((k, idx) => {
                    let p = 0, n = 0, ap = 0, an = 0;
                    S.forEach(z => { 
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

                if (b) b.destroy();
                b = new Chart(x1, { type: 'bar', data: { labels: l, datasets: [{ label: 'Positivo (+)', data: v1.p, backgroundColor: P.b }, { label: 'Negativo (-)', data: v1.n, backgroundColor: P.o }] }, options: { ...K, plugins: { title: { display: true, text: `SET ACTUAL (Set #${HistorialSets.length + 1})` } } } });
                
                const locInput = _('equipoLocal');
                const rivInput = _('equipoRival');
                const loc = locInput ? locInput.value || 'Local' : 'Local';
                const riv = rivInput ? rivInput.value || 'Rival' : 'Rival';
                
                const sumEl = _('sum');
                if (sumEl) sumEl.innerHTML = `${loc} vs ${riv} — Sets jugados: <span class="text-brand-electric font-bold">${HistorialSets.length + 1}</span> | Positivos Totales: <span class="text-brand-electric font-bold">${tp}</span> | Negativos Totales: <span class="text-brand-orange font-bold">${tn}</span>`;
                
                if (a) a.destroy();
                a = new Chart(x2, { type: 'bar', data: { labels: l, datasets: [{ label: 'Positivo (+)', data: v2.p, backgroundColor: P.b }, { label: 'Negativo (-)', data: v2.n, backgroundColor: P.o }] }, options: { ...K, plugins: { title: { display: true, text: 'TOTAL PARTIDO ACUMULADO' } } } });
            }

            renderCuadroHonor();
        }

        function renderCuadroHonor() {
            const grid = _('cuadroHonorGrid');
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
                                <span class="font-mono ${k.dif >= 0 ? 'text-brand-electric' : 'text-brand-orange'}">Dif: ${k.dif >= 0 ? '+' : ''}${k.dif}</span>
                                <span class="font-mono text-slate-600">Total <span class="text-brand-electric font-bold">${k.p}</span> | <span class="text-brand-orange font-bold">${k.n}</span></span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        const btnAgNom = _('btnAgregarNomina');
        if (btnAgNom) {
            btnAgNom.onclick = () => {
                const idKey = _('selectNomina').value;
                if (!idKey) return;
                const atleta = L_Nomina.find(x => (x.cedulaIdentidad || x.id) == idKey);
                if (atleta && !Roster.some(x => x.key == idKey)) {
                    Roster.push({
                        key: idKey,
                        num: atleta.nroCamiseta || '0',
                        name: `${atleta.nombre} ${atleta.apellido || ''}`.trim()
                    });
                    guardarEstado();
                    renderRosterCards();
                    U();
                    mostrarToast('Atleta añadido al Roster');
                }
            };
        }

        const btnAgMan = _('btnAgregarManual');
        if (btnAgMan) {
            btnAgMan.onclick = () => {
                const num = _('manualNum').value.trim();
                const nom = _('manualNom').value.trim();
                if (!num || !nom) { alert("Ingresa número y nombre."); return; }

                const key = 'MANUAL_' + num + '_' + Date.now();
                Roster.push({ key: key, num: num, name: nom });

                _('manualNum').value = '';
                _('manualNom').value = '';

                guardarEstado();
                renderRosterCards();
                U();
                mostrarToast('Atleta invitado añadido');
            };
        }

        const btnDeshacer = _('btnDeshacer');
        if (btnDeshacer) {
            btnDeshacer.onclick = () => {
                if (!S.length && !M.length) {
                    alert("No hay jugadas registradas para deshacer.");
                    return;
                }

                if (confirm("¿Deseas eliminar la última jugada registrada por error?")) {
                    S.pop();
                    M.pop();
                    guardarEstado();
                    U();
                    mostrarToast("Última jugada eliminada");
                }
            };
        }

        const rsBtn = _('rs');
        if (rsBtn) {
            rsBtn.onclick = () => {
                if (HistorialSets.length >= 5) {
                    alert("Ya se han registrado los 5 sets reglamentarios del partido.");
                    return;
                }
                if (confirm(`¿Deseas culminar el Set #${HistorialSets.length + 1} y pasar al siguiente?`)) {
                    HistorialSets.push([...S]);
                    S = [];
                    guardarEstado();
                    U();
                    mostrarToast(`Set #${HistorialSets.length} guardado correctamente`);
                }
            };
        }

        const btnCulPart = _('btnCulminarPartido');
        if (btnCulPart) {
            btnCulPart.onclick = () => {
                if (confirm('¿Desea culminar el partido? Esto guardará el historial completo de sets, reseteará las acciones y conservará el roster.')) {
                    if (S.length > 0 && HistorialSets.length < 5) {
                        HistorialSets.push([...S]);
                    }
                    guardarEnHistorial();
                    S = [];
                    HistorialSets = [];
                    M = [];
                    guardarEstado();
                    U();
                    mostrarToast('Partido culminado y guardado en historial');
                }
            };
        }

        const raBtn = _('ra');
        if (raBtn) {
            raBtn.onclick = () => {
                if (confirm('¿Seguro que deseas ELIMINAR EL JUEGO? Se blanqueará el Roster, se borrarán las estadísticas y se reiniciarán los datos.')) {
                    localStorage.removeItem('vRoster_' + empresaID);
                    localStorage.removeItem('vS_' + empresaID);
                    localStorage.removeItem('vHistSets_' + empresaID);
                    localStorage.removeItem('vM_' + empresaID);
                    localStorage.removeItem('vLocal_' + empresaID);
                    localStorage.removeItem('vRival_' + empresaID);
                    Roster = []; S = []; HistorialSets = []; M = []; atletaSeleccionadoKey = null;
                    const locInput = _('equipoLocal');
                    const rivInput = _('equipoRival');
                    if (locInput) locInput.value = clubNombre;
                    if (rivInput) rivInput.value = 'Rival';
                    const badge = _('atletaSeleccionadoBadge');
                    if (badge) badge.classList.add('hidden');
                    renderRosterCards();
                    U();
                    mostrarToast('Juego eliminado y reiniciado');
                }
            };
        }

        const btnExpPdf = _('btnExportarPdf');
        if (btnExpPdf) {
            btnExpPdf.onclick = () => {
                window.print();
            };
        }

        async function init() {
            const hoy = new Date();
            const fechaDisplay = _('fechaJuegoDisplay');
            if (fechaDisplay) {
                fechaDisplay.textContent = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }

            const locInput = _('equipoLocal');
            const rivInput = _('equipoRival');
            if (locInput) locInput.value = localStorage.getItem('vLocal_' + empresaID) || clubNombre;
            if (rivInput) rivInput.value = localStorage.getItem('vRival_' + empresaID) || 'Rival';

            if (locInput) locInput.oninput = e => localStorage.setItem('vLocal_' + empresaID, e.target.value);
            if (rivInput) rivInput.oninput = e => localStorage.setItem('vRival_' + empresaID, e.target.value);

            try {
                const { data: atletas } = await supabase.from('atletas').select('*').order('nroCamiseta', { ascending: true });
                L_Nomina = atletas || [];
                poblarNominaSelect();
            } catch (err) {
                console.error("Error al cargar atletas:", err);
            }

            Roster = JSON.parse(localStorage.getItem('vRoster_' + empresaID) || '[]');
            S = JSON.parse(localStorage.getItem('vS_' + empresaID) || '[]');
            HistorialSets = JSON.parse(localStorage.getItem('vHistSets_' + empresaID) || '[]');
            M = JSON.parse(localStorage.getItem('vM_' + empresaID) || '[]');

            renderRosterCards();
            renderHistorial();
            U();
        }

        init();
    });
})();
