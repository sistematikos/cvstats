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
            
            // Estructura de tarjeta en dos líneas
            card.className = `relative p-2.5 rounded-2xl cursor-pointer flex flex-col items-center gap-1.5 card-atleta-item shadow-sm select-none touch-manipulation transition ${isSelected ? 'card-atleta-selected ring-2 ring-brand-electric bg-blue-50/80' : 'bg-white'}`;
            
            // Selección normal al tocar la tarjeta
            const handleSelect = (e) => {
                e.preventDefault();
                callbackSeleccionar(p.key, p.num, p.name);
            };
            card.onclick = handleSelect;
            card.ontouchend = handleSelect;

            // Contenido organizado en 2 líneas:
            // 1ª Línea: Número, Flecha de subir y Botón X de eliminar
            // 2ª Línea: Nombre completo centrado
            card.innerHTML = `
                <div class="flex items-center justify-between w-full px-1">
                    <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-brand-electric font-black text-xs shrink-0">#${p.num}</span>
                    <div class="flex items-center gap-1">
                        <button type="button" class="btn-subir w-6 h-6 flex items-center justify-center text-slate-400 hover:text-brand-electric text-xs bg-slate-100 rounded-lg shrink-0 cursor-pointer" title="Subir de puesto">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button type="button" class="btn-eliminar w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-600 text-sm shrink-0 cursor-pointer" title="Eliminar">&times;</button>
                    </div>
                </div>
                <div class="font-extrabold text-slate-900 text-xs text-center w-full px-1 break-words">${p.name}</div>
            `;

            // Evento para SUBIR al jugador de posición
            const btnSubir = card.querySelector('.btn-subir');
            btnSubir.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (index > 0) {
                    const tempOrden = Roster[index].orden;
                    Roster[index].orden = Roster[index - 1].orden;
                    Roster[index - 1].orden = tempOrden;
                    
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
