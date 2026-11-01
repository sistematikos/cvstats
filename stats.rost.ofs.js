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

        if (!Roster.length) {
            container.innerHTML = '<div class="col-span-full text-center py-4 text-xs text-slate-400 italic">No hay atletas en el roster del partido.</div>';
            return;
        }

        container.innerHTML = '';

        // Aseguramos que tengan la propiedad de orden o posición si no la tienen
        Roster.forEach((p, idx) => {
            if (p.orden === undefined) p.orden = idx;
        });

        // Ordenamos el roster según su posición actual
        Roster.sort((a, b) => a.orden - b.orden);

        Roster.forEach((p, index) => {
            const card = document.createElement('div');
            const isSelected = (atletaSeleccionadoKey === p.key);
            
            card.className = `relative px-3 py-2.5 rounded-2xl cursor-pointer flex items-center gap-2 card-atleta-item shadow-sm select-none touch-manipulation transition ${isSelected ? 'card-atleta-selected ring-2 ring-brand-electric bg-blue-50/80' : 'bg-white'}`;
            
            // Selección normal al tocar la tarjeta
            const handleSelect = (e) => {
                e.preventDefault();
                callbackSeleccionar(p.key, p.num, p.name);
            };
            card.onclick = handleSelect;
            card.ontouchend = handleSelect;

            // Contenido de la tarjeta con botones de desplazamiento rápido (Subir / Bajar / Eliminar)
            card.innerHTML = `
                <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-brand-electric font-black text-xs shrink-0">#${p.num}</span>
                <div class="font-extrabold text-slate-900 text-xs truncate w-full">${p.name}</div>
                
                <!-- Botón para subir de posición rápidamente hacia arriba -->
                <button type="button" class="btn-subir w-6 h-6 flex items-center justify-center text-slate-400 hover:text-brand-electric text-xs bg-slate-100 rounded-lg shrink-0" title="Subir de puesto">
                    <i class="fas fa-arrow-up"></i>
                </button>
                
                <!-- Botón de eliminar -->
                <button type="button" class="btn-eliminar w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-600 text-sm shrink-0" title="Eliminar">&times;</button>
            `;

            // Evento para SUBIR al jugador de posición (llevarlo hacia arriba en la lista)
            const btnSubir = card.querySelector('.btn-subir');
            btnSubir.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (index > 0) {
                    // Intercambiamos el orden con el jugador de arriba
                    const tempOrden = Roster[index].orden;
                    Roster[index].orden = Roster[index - 1].orden;
                    Roster[index - 1].orden = tempOrden;
                    
                    // Re-renderizamos para actualizar la vista de inmediato
                    renderRosterCards(Roster, atletaSeleccionadoKey, callbackSeleccionar, callbackQuitar, callbackMoverPosicion);
                }
            };

            // Evento para eliminar con confirmación
            const btnX = card.querySelector('.btn-eliminar');
            btnX.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (confirm(`¿Deseas eliminar al atleta #${p.num} ${p.name} del roster?`)) {
                    callbackQuitar(p.key);
                }
            };

            container.appendChild(card);
        });
    }

    return {
        poblarNominaSelect,
        renderRosterCards
    };
})();
