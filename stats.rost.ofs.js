// stats.rost.ofs.js
window.CVModuleRoster = (function() {
    function poblarNominaSelect(L_Nomina) {
        const select = document.getElementById('selectNomina');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione de Nómina...</option>';
        L_Nomina.forEach(p => {
            let o = document.createElement('option');
            o.value = p.cedulaIdentidad || p.id;
            o.textContent = `#${p.nroCamiseta || '0'} ${p.nombre} ${p.apellido || ''}`;
            select.appendChild(o);
        });
    }

    function renderRosterCards(Roster, atletaSeleccionadoKey, callbackSeleccionar, callbackQuitar) {
        const container = document.getElementById('rosterCardsGrid');
        const countRoster = document.getElementById('countRoster');
        if (countRoster) countRoster.textContent = Roster.length;

        if (!container) return;

        if (!Roster.length) {
            container.innerHTML = '<div class="col-span-full text-center py-4 text-xs text-slate-400 italic">No hay atletas en el roster del partido.</div>';
            const badge = document.getElementById('atletaSeleccionadoBadge');
            if (badge) badge.classList.add('hidden');
            return;
        }

        container.innerHTML = '';
        Roster.forEach(p => {
            const card = document.createElement('div');
            const isSelected = (atletaSeleccionadoKey === p.key);
            
            card.className = `relative p-2.5 rounded-2xl cursor-pointer flex items-center gap-2 card-atleta-item shadow-sm ${isSelected ? 'card-atleta-selected' : ''}`;
            card.onclick = () => callbackSeleccionar(p.key, p.num, p.name);

            card.innerHTML = `
                <button type="button" class="absolute top-1 right-2 text-slate-300 hover:text-rose-600 font-bold text-xs z-10" onclick="event.stopPropagation();">&times;</button>
                <span class="px-2 py-0.5 rounded-lg bg-blue-50 text-brand-electric font-black text-xs border border-blue-100 shrink-0">#${p.num}</span>
                <div class="font-extrabold text-slate-900 text-xs truncate w-full">${p.name}</div>
            `;
            
            // Asignar evento de quitar
            const btnX = card.querySelector('button');
            btnX.onclick = (e) => {
                e.stopPropagation();
                callbackQuitar(p.key);
            };

            container.appendChild(card);
        });
    }

    function seleccionarAtleta(key, num, name, callbackUpdate) {
        const badge = document.getElementById('atletaSeleccionadoBadge');
        const nombreSel = document.getElementById('nombreAtletaSel');
        if (badge) badge.classList.remove('hidden');
        if (nombreSel) nombreSel.textContent = `#${num} ${name}`;
        if (callbackUpdate) callbackUpdate(key);
    }

    return {
        poblarNominaSelect,
        renderRosterCards,
        seleccionarAtleta
    };
})();
