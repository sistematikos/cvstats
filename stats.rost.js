// stats.rost.ofs.js
window.CVModuleRoster = (function() {
    function poblarNominaSelect(L_Nomina) {
        // Mantenido por compatibilidad
    }

    function renderRosterCards(Roster, atletaSeleccionadoKey, callbackSeleccionar, callbackQuitar, callbackMoverPosicion) {
        const container = document.getElementById('rosterCardsGrid');
        const countRoster = document.getElementById('countRoster');
        if (countRoster) countRoster.textContent = Roster.length;

        if (!container) return;

        // Altura vertical amplia para ver más atletas
        container.className = "grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-1 pt-2";

        if (!Roster.length) {
            container.innerHTML = '<div class="col-span-full text-center py-4 text-xs text-slate-400 italic">No hay atletas en el roster del partido.</div>';
            return;
        }

        container.innerHTML = '';

        Roster.forEach((p, index) => {
            const card = document.createElement('div');
            const isSelected = (atletaSeleccionadoKey === p.key);
            
            card.className = `relative p-2.5 rounded-2xl cursor-pointer flex flex-col items-center gap-1.5 card-atleta-item shadow-sm select-none touch-manipulation transition ${isSelected ? 'card-atleta-selected ring-2 ring-brand-electric bg-blue-50/80' : 'bg-white'}`;
            
            const handleSelect = (e) => {
                e.preventDefault();
                callbackSeleccionar(p.key, p.num, p.name);
            };
            card.onclick = handleSelect;
            card.ontouchend = handleSelect;

            card.innerHTML = `
                <div class="grid grid-cols-3 items-center w-full px-1">
                    <div class="flex justify-start">
                        <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-brand-electric font-black text-xs shrink-0">#${p.num}</span>
                    </div>
                    <div class="flex justify-center">
                        <button type="button" class="btn-subir w-6 h-6 flex items-center justify-center text-slate-400 hover:text-brand-electric text-xs bg-slate-100 rounded-lg shrink-0 cursor-pointer" title="Subir al inicio">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                    </div>
                    <div class="flex justify-end">
                        <button type="button" class="btn-eliminar w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-600 text-sm shrink-0 cursor-pointer" title="Eliminar">&times;</button>
                    </div>
                </div>
                <div class="font-extrabold text-slate-900 text-xs text-center w-full px-1 break-words">${p.name}</div>
            `;

            // Evento para SUBIR al jugador de posición de manera directa en el arreglo
            const btnSubir = card.querySelector('.btn-subir');
            const handleSubir = (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                if (index > 0) {
                    // Extraemos al atleta y lo movemos una posición hacia arriba (o directamente al inicio si prefieres)
                    const atletaMovido = Roster.splice(index, 1)[0];
                    Roster.splice(index - 1, 0, atletaMovido);
                    
                    // Si el archivo coordinador provee un callback para guardar, lo ejecutamos, si no, re-renderizamos
                    if (typeof callbackMoverPosicion === 'function') {
                        callbackMoverPosicion(Roster);
                    } else {
                        renderRosterCards(Roster, atletaSeleccionadoKey, callbackSeleccionar, callbackQuitar, callbackMoverPosicion);
                    }
                }
            };
            btnSubir.onclick = handleSubir;
            btnSubir.ontouchend = handleSubir;

            // Evento para eliminar con confirmación
            const btnX = card.querySelector('.btn-eliminar');
            const handleEliminar = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (confirm(`¿Deseas eliminar al atleta #${p.num} ${p.name} del roster?`)) {
                    callbackQuitar(p.key);
                }
            };
            btnX.onclick = handleEliminar;
            btnX.ontouchend = handleEliminar;

            container.appendChild(card);
        });
    }

    return {
        poblarNominaSelect,
        renderRosterCards
    };
})();
