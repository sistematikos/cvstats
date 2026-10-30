(async function () {
    import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(async ({ createClient }) => {

        const _ = id => document.getElementById(id);
        
        // Búsqueda flexible de la empresa para evitar fallos en móviles
        const empresaID = (localStorage.getItem('youcontrol_empresa_id') || localStorage.getItem('control_voley_empresa_id') || '').trim();
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
        let Roster = JSON.parse(localStorage.getItem('vRoster_' + empresaID) || localStorage.getItem('vRoster_') || '[]');
        let S = JSON.parse(localStorage.getItem('vS_' + empresaID) || localStorage.getItem('vS_') || '[]');
        let HistorialSets = JSON.parse(localStorage.getItem('vHistSets_' + empresaID) || localStorage.getItem('vHistSets_') || '[]');
        let M = JSON.parse(localStorage.getItem('vM_' + empresaID) || localStorage.getItem('vM_') || '[]');
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

        const O = { Servicio: 'Servicio', Ataque: 'Ataque', Bloqueo: 'Bloqueo', Recepción: 'Recepción', Defensa: 'Defensa', Armada: 'Armada' };
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
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center gap-2">
                        <div class="cursor-pointer flex-1" onclick="window.cargarPartidoHistorial(${h.id})">
                            <span class="font-black text-slate-900 hover:text-brand-electric transition">${h.enfrentamiento}</span>
                            <div class="text-[10px] text-slate-500">Fecha: ${h.fecha} — Sets jugados: ${h.sets?.length || 0} (Acciones: ${h.accionesTotales || 0})</div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button onclick="window.cargarPartidoHistorial(${h.id})" class="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-electric font-bold rounded-lg border border-brand-electric/20 cursor-pointer" title="Cargar / Ver Partido">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="window.eliminarPartidoHistorial(${h.id})" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg border border-rose-200 cursor-pointer" title="Eliminar del Historial">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        window.cargarPartidoHistorial = (idPartido) => {
            let historial = JSON.parse(localStorage.getItem('vHistorial_' + empresaID) || '[]');
            const partido = historial.find(x => x.id === idPartido);
            if (!partido) return;

            if (confirm(`¿Deseas cargar el partido "${partido.enfrentamiento}" del ${partido.fecha} para visualizar sus estadísticas actuales?`)) {
                HistorialSets = partido.sets ? [...partido.sets] : [];
                M = partido.datos ? [...partido.datos] : [];
                S = []; 
                
                guardarEstado();
                actualizarInterfazGeneral();
                mostrarToast('Partido cargado desde el historial');
            }
        };

        window.eliminarPartidoHistorial = (idPartido) => {
            if (confirm('¿Estás seguro de eliminar este partido del historial del club?')) {
                let historial = JSON.parse(localStorage.getItem('vHistorial_' + empresaID) || '[]');
                historial = historial.filter(x => x.id !== idPartido);
                localStorage.setItem('vHistorial_' + empresaID, JSON.stringify(historial));
                
                renderHistorial();
                mostrarToast('Partido eliminado del historial');
            }
        };

        function actualizarInterfazGeneral() {
            if (window.CVModuleRoster) {
                window.CVModuleRoster.renderRosterCards(Roster, atletaSeleccionadoKey, (k, num, name) => {
                    atletaSeleccionadoKey = k;
                    const badge = _('atletaSeleccionadoBadge');
                    const nombreSel = _('nombreAtletaSel');
                    if (badge) badge.classList.remove('hidden');
                    if (nombreSel) nombreSel.textContent = `#${num} ${name}`;
                    actualizarInterfazGeneral();
                }, (k) => {
                    Roster = Roster.filter(x => x.key !== k);
                    if (atletaSeleccionadoKey === k) {
                        atletaSeleccionadoKey = null;
                        const badge = _('atletaSeleccionadoBadge');
                        if (badge) badge.classList.add('hidden');
                    }
                    guardarEstado();
                    actualizarInterfazGeneral();
                });
            }

            if (window.CVModuleResultados) {
                window.CVModuleResultados.renderResumenTabs(HistorialSets, setResumenSeleccionado, (nuevoSet) => {
                    setResumenSeleccionado = nuevoSet;
                    actualizarInterfazGeneral();
                });
                window.CVModuleResultados.renderResumenAtletas(Roster, S, HistorialSets, setResumenSeleccionado, N);
                window.CVModuleResultados.renderTablaMatricial(Roster, S, HistorialSets, N);
            }

            if (window.CVModuleGraficas) {
                window.CVModuleGraficas.renderGraficaTabs(HistorialSets, setGraficaSeleccionado, (nuevoSet) => {
                    setGraficaSeleccionado = nuevoSet;
                    actualizarInterfazGeneral();
                });
                let resGraficas = window.CVModuleGraficas.actualizarGraficas(S, HistorialSets, M, setGraficaSeleccionado, O, N, P, K, b, a);
                b = resGraficas.b;
                a = resGraficas.a;
            }

            if (window.CVModuleHonor) {
                window.CVModuleHonor.renderCuadroHonor(Roster, M, N);
            }
        }

        window.registrarAccionDirecta = (accion) => {
            if (window.CVModuleAcciones) {
                window.CVModuleAcciones.registrarAccion(atletaSeleccionadoKey, accion, N, M, S, () => {
                    guardarEstado();
                    actualizarInterfazGeneral();
                }, mostrarToast);
            }
        };

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
                actualizarInterfazGeneral();
                mostrarToast('Atleta añadido al Roster');
            };
        }

        const btnDeshacer = _('btnDeshacer');
        if (btnDeshacer) {
            btnDeshacer.onclick = () => {
                if (window.CVModuleAcciones) {
                    window.CVModuleAcciones.deshacerAccion(S, M, () => {
                        guardarEstado();
                        actualizarInterfazGeneral();
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
                        actualizarInterfazGeneral();
                    }, mostrarToast);
                }
            };
        }

        const btnCulPart = _('btnCulminarPartido');
        if (btnCulPart) {
            btnCulPart.onclick = async () => {
                if (window.CVModuleAcciones) {
                    await window.CVModuleAcciones.culminarPartido(supabase, empresaID, clubNombre, S, HistorialSets, M, () => {
                        setResumenSeleccionado = 'ACTUAL';
                        setGraficaSeleccionado = 'ACTUAL';
                        guardarEstado();
                        renderHistorial();
                        actualizarInterfazGeneral();
                    }, mostrarToast);
                }
            };
        }

        const raBtn = _('ra');
        if (raBtn) {
            raBtn.onclick = () => {
                if (confirm('¿Seguro que deseas ELIMINAR EL JUEGO Y REINICIAR?')) {
                    localStorage.removeItem('vRoster_' + empresaID);
                    localStorage.removeItem('vS_' + empresaID);
                    localStorage.removeItem('vHistSets_' + empresaID);
                    localStorage.removeItem('vM_' + empresaID);
                    Roster = []; S = []; HistorialSets = []; M = []; atletaSeleccionadoKey = null;
                    setResumenSeleccionado = 'ACTUAL';
                    setGraficaSeleccionado = 'ACTUAL';
                    const badge = _('atletaSeleccionadoBadge');
                    if (badge) badge.classList.add('hidden');
                    actualizarInterfazGeneral();
                    mostrarToast('Juego reiniciado');
                }
            };
        }

        // BOTÓN EXPORTAR / REPORTE PDF REAL PARA MÓVILES Y PC
        const btnExpPdf = _('btnExportarPdf');
        if (btnExpPdf) {
            const generarPdfMovil = (e) => {
                e.preventDefault();
                mostrarToast('Generando PDF...');

                // Seleccionamos el contenedor principal o los bloques limpios de reporte
                const local = _('equipoLocal')?.value || 'Local';
                const rival = _('equipoRival')?.value || 'Rival';
                const nombreArchivo = `Reporte_${local}_vs_${rival}.pdf`.replace(/\s+/g, '_');

                // Opciones de configuración para que salga estético y ordenado
                const opciones = {
                    margin:       5,
                    filename:     nombreArchivo,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                // Creamos un contenedor temporal clonando solo lo que debe ir en el reporte
                const elementoReporte = document.createElement('div');
                elementoReporte.style.padding = '15px';
                elementoReporte.style.background = '#ffffff';
                elementoReporte.style.color = '#000000';
                elementoReporte.style.fontFamily = "'Plus Jakarta Sans', sans-serif";

                // Añadimos título del enfrentamiento
                elementoReporte.innerHTML = `
                    <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0055FF; padding-bottom: 10px;">
                        <h2 style="font-size: 18px; font-weight: 900; color: #030B1E; margin: 0;">CONTROL VOLEY PRO - REPORTE OFICIAL</h2>
                        <p style="font-size: 14px; font-weight: 700; color: #0055FF; margin: 5px 0 0 0;">${local} vs ${rival}</p>
                    </div>
                `;

                // Recogemos los bloques de estadísticas, tabla matricial, gráficas y honor del DOM actual
                // (Buscamos las tarjetas glass-card que están visibles)
                const tarjetas = document.querySelectorAll('.glass-card');
                tarjetas.forEach((card, idx) => {
                    // Excluimos las que tengan elementos de roster o acciones táctiles para que el PDF salga limpio
                    if (!card.id.includes('bloqueRoster') && !card.id.includes('bloqueAcciones') && !card.id.includes('bloqueHistorial')) {
                        const clon = card.cloneNode(true);
                        // Limpiamos botones o pestañas interactivas que no deban salir impresas
                        clon.querySelectorAll('button, .no-print').forEach(el => el.remove());
                        elementoReporte.appendChild(clon);
                    }
                });

                // Ejecutamos la generación y descarga del PDF real
                html2pdf().from(elementoReporte).set(opciones).save().then(() => {
                    mostrarToast('¡PDF guardado con éxito!');
                }).catch(err => {
                    console.error("Error al generar PDF:", err);
                    // Fallback a impresión nativa si ocurre algún percance
                    window.print();
                });
            };

            btnExpPdf.addEventListener('click', generarPdfMovil);
            btnExpPdf.addEventListener('touchend', generarPdfMovil);
        }

        // NUEVO BOTÓN: FORZAR ACTUALIZACIÓN Y BORRAR CACHÉ MÓVIL
        const btnActualizarApp = _('btnForzarActualizacion');
        if (btnActualizarApp) {
            const forzarReload = async (e) => {
                e.preventDefault();
                if (confirm('¿Deseas buscar e instalar la versión más reciente del sistema?')) {
                    try {
                        if ('serviceWorker' in navigator) {
                            const registrations = await navigator.serviceWorker.getRegistrations();
                            for (let registration of registrations) {
                                await registration.unregister();
                            }
                        }
                        if ('caches' in window) {
                            const cacheNames = await caches.keys();
                            for (let name of cacheNames) {
                                await caches.delete(name);
                            }
                        }
                        mostrarToast('Actualizando sistema...');
                        setTimeout(() => {
                            window.location.reload(true);
                        }, 800);
                    } catch (err) {
                        window.location.reload(true);
                    }
                }
            };
            btnActualizarApp.addEventListener('click', forzarReload);
            btnActualizarApp.addEventListener('touchend', forzarReload);
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

            actualizarInterfazGeneral();
            renderHistorial();
        }

        init();
    });
})();
