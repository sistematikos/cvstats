// stats.acc.ofs.js
window.CVModuleAcciones = (function() {
    function registrarAccion(atletaSeleccionadoKey, accion, N, M, S, callbackActualizar, mostrarToast) {
        if (!atletaSeleccionadoKey) {
            alert("Por favor selecciona un atleta del roster primero (Paso 1).");
            return false;
        }

        let l = { playerKey: atletaSeleccionadoKey, action: accion };
        M.push(l);
        S.push(l);
        callbackActualizar();
        mostrarToast(`Registrado: ${accion}`);
        return true;
    }

    function deshacerAccion(S, M, callbackActualizar, mostrarToast) {
        if (!S.length && !M.length) {
            alert("No hay jugadas registradas para deshacer.");
            return;
        }

        if (confirm("¿Deseas eliminar la última jugada registrada por error?")) {
            S.pop();
            M.pop();
            callbackActualizar();
            mostrarToast("Última jugada eliminada");
        }
    }

    function culminarSet(HistorialSets, S, callbackActualizar, mostrarToast) {
        if (HistorialSets.length >= 5) {
            alert("Ya se han registrado los 5 sets reglamentarios del partido.");
            return false;
        }
        if (confirm(`¿Deseas culminar el Set #${HistorialSets.length + 1} y pasar al siguiente?`)) {
            HistorialSets.push([...S]);
            S.length = 0; // Limpiar set actual
            callbackActualizar();
            mostrarToast(`Set #${HistorialSets.length} guardado correctamente`);
            return true;
        }
        return false;
    }

    async function culminarPartido(supabase, empresaID, clubNombre, S, HistorialSets, M, callbackActualizar, mostrarToast) {
        if (confirm('¿Deseas culminar el partido y guardar en el historial del club?')) {
            if (S.length > 0 && HistorialSets.length < 5) {
                HistorialSets.push([...S]);
            }

            const loc = document.getElementById('equipoLocal')?.value || clubNombre;
            const riv = document.getElementById('equipoRival')?.value || 'Rival';
            const fechaActual = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const nuevoPartido = {
                empresa_id: empresaID,
                fecha: fechaActual,
                enfrentamiento: `${loc} vs ${riv}`,
                acciones_totales: M.length,
                datos: M,
                sets: HistorialSets
            };

            // 1. Guardar localmente como respaldo (máximo 7)
            let historialLocal = JSON.parse(localStorage.getItem('vHistorial_' + empresaID) || '[]');
            historialLocal.unshift(nuevoPartido);
            if (historialLocal.length > 7) historialLocal.pop();
            localStorage.setItem('vHistorial_' + empresaID, JSON.stringify(historialLocal));

            // 2. Intentar guardar en Supabase (si existe la tabla de historial)
            try {
                if (supabase) {
                    // Opcional: Asegurarnos de cumplir el límite de 7 en Supabase eliminando los excedentes más antiguos si fuera necesario
                    await supabase.from('historial_partidos').insert([nuevoPartido]);
                }
            } catch (err) {
                console.error("Aviso: No se pudo sincronizar con Supabase, guardado localmente.", err);
            }

            // Reiniciar variables del partido actual
            S.length = 0;
            HistorialSets.length = 0;
            M.length = 0;
            
            localStorage.removeItem('vS_' + empresaID);
            localStorage.removeItem('vHistSets_' + empresaID);
            localStorage.removeItem('vM_' + empresaID);

            callbackActualizar();
            mostrarToast('Partido culminado y guardado en el historial');
            return true;
        }
        return false;
    }

    return {
        registrarAccion,
        deshacerAccion,
        culminarSet,
        culminarPartido
    };
})();
