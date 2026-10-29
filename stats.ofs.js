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
        let setResumenSeleccionado = 'ACTUAL'; 
        let setGraficaSeleccionado = 'ACTUAL'; 
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
        const P = { b: '#0055FF', o: '#FF5500' };
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
            // Módulo Resultados: Pestañas de resumen
            if (window.CVModuleResultados) {
                window.CVModuleResultados.renderResumenTabs(HistorialSets, setResumenSeleccionado, (nuevoSet) => {
                    setResumenSeleccionado = nuevoSet;
                    U();
                });
                window.CVModuleResultados.renderResumenAtletas(Roster, S, HistorialSets, setResumenSeleccionado, N);
                window.CVModuleResultados.renderTablaMatricial(Roster, S, HistorialSets, N);
            }

            // Módulo Gráficas: Pestañas y renderizado de gráficos
            if (window.CVModuleGraficas) {
                window.CVModuleGraficas.renderGraficaTabs(HistorialSets, setGraficaSeleccionado, (nuevoSet) => {
                    setGraficaSeleccionado = nuevoSet;
                    U();
                });
                let resGraficas = window.CVModuleGraficas.actualizarGraficas(S, HistorialSets, M, setGraficaSeleccionado, O, N, P, K, b, a);
                b = resGraficas.b;
                a = resGraficas.a;
            }

            // Módulo Cuadro de Honor
            if (window.CVModuleHonor) {
                window.CVModuleHonor.renderCuadroHonor(Roster, M, N);
            }
        }

        // ACCIONES DE ROSTER Y BOTONES
        if (window.CVModuleRoster) {
            window.CVModuleRoster.poblarNominaSelect(L_Nomina);
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
                    if (window.CVModuleRoster) {
                        window.CVModuleRoster.renderRosterCards(Roster, atletaSeleccionadoKey, (k, num, name) => {
                            if (window.CVModuleRoster) {
                                window.CVModuleRoster.seleccionarAtleta(k, num, name, (keySel) => { atletaSeleccionadoKey = keySel; });
                            }
                        }, (k) => { window.quitarDeRoster(k); });
                    }
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
                if (window.CVModuleRoster) {
                    window.CVModuleRoster.renderRosterCards(Roster, atletaSeleccionadoKey, (k, n, nm) => {
                        if (window.CVModuleRoster) {
                            window.CVModuleRoster.seleccionarAtleta(k, n, nm, (keySel) => { atletaSeleccionadoKey = keySel; });
                        }
                    }, (k) => { window.quitarDeRoster(k); });
                }
                U();
                mostrarToast('Atleta invitado añadido');
            };
        }

        window.quitarDeRoster = (key) => {
            Roster = Roster.filter(x => x.key !== key);
            if (atletaSeleccionadoKey === key) {
                atletaSeleccionadoKey = null;
                const badge = _('atletaSeleccionadoBadge');
                if (badge) badge.classList.add('hidden');
            }
            guardarEstado();
            if (window.CVModuleRoster) {
                window.CVModuleRoster.renderRosterCards(Roster, atletaSeleccionadoKey, (k, num, name) => {
                    if (window.CVModuleRoster) {
                        window.CVModuleRoster.seleccionarAtleta(k, num, name, (keySel) => { atletaSeleccionadoKey = keySel; });
                    }
                }, (k) => { window.quitarDeRoster(k); });
            }
            U();
        };

        window.registrarAccionDirecta = (accion) => {
            if (window.CVModuleAcciones) {
                window.CVModuleAcciones.registrarAccion(atletaSeleccionadoKey, accion, N, M, S, () => {
                    guardarEstado();
                    U();
                }, mostrarToast);
            }
        };

        const btnDeshacer = _('btnDeshacer');
        if (btnDeshacer) {
            btnDeshacer.onclick = () => {
                if (window.CVModuleAcciones) {
                    window.CVModuleAcciones.deshacerAccion(S, M, () => {
                        guardarEstado();
                        U();
                    }, mostrarToast);
                }
            };
        }

        const rsBtn = _('rs');
        if (rsBtn) {
            rsBtn.onclick = () => {
                if (window.CVModuleAcciones) {
                    window.CVModuleAcciones.culminarSet(HistorialSets, S, () => {
                        setResumenSeleccionado = 'ACTUAL';
                        setGraficaSeleccionado = 'ACTUAL';
                        guardarEstado();
                        U();
                    }, mostrarToast);
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
                    setResumenSeleccionado = 'ACTUAL';
                    setGraficaSeleccionado = 'ACTUAL';
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
                    setResumenSeleccionado = 'ACTUAL';
                    setGraficaSeleccionado = 'ACTUAL';
                    const locInput = _('equipoLocal');
                    const rivInput = _('equipoRival');
                    if (locInput) locInput.value = clubNombre;
                    if (rivInput) rivInput.value = 'Rival';
                    const badge = _('atletaSeleccionadoBadge');
                    if (badge) badge.classList.add('hidden');
                    
                    if (window.CVModuleRoster) {
                        window.CVModuleRoster.renderRosterCards(Roster, atletaSeleccionadoKey, () => {}, () => {});
                    }
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
                if (window.CVModuleRoster) {
                    window.CVModuleRoster.poblarNominaSelect(L_Nomina);
                }
            } catch (err) {
                console.error("Error al cargar atletas:", err);
            }

            Roster = JSON.parse(localStorage.getItem('vRoster_' + empresaID) || '[]');
            S = JSON.parse(localStorage.getItem('vS_' + empresaID) || '[]');
            HistorialSets = JSON.parse(localStorage.getItem('vHistSets_' + empresaID) || '[]');
            M = JSON.parse(localStorage.getItem('vM_' + empresaID) || '[]');

            if (window.CVModuleRoster) {
                window.CVModuleRoster.renderRosterCards(Roster, atletaSeleccionadoKey, (k, num, name) => {
                    if (window.CVModuleRoster) {
                        window.CVModuleRoster.seleccionarAtleta(k, num, name, (keySel) => { atletaSeleccionadoKey = keySel; });
                    }
                }, (k) => { window.quitarDeRoster(k); });
            }
            renderHistorial();
            U();
        }

        init();
    });
})();
