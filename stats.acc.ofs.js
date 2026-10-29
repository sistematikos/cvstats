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
            S.length = 0; // limpiar set actual
            callbackActualizar();
            mostrarToast(`Set #${HistorialSets.length} guardado correctamente`);
            return true;
        }
        return false;
    }

    return {
        registrarAccion,
        deshacerAccion,
        culminarSet
    };
})();
