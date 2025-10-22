// rangesModal.js
// Maneja el modal para agregar/editar múltiples rangos horarios por carga
export const rangesModal = (function(){
    let modalEl, listEl, addBtn, saveBtn, closeBtn, startSelect, endSelect;
    let currentResolve = null;
    // Crear el modal en runtime para evitar tocar mucho el HTML
    function buildModal() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
        <div class="modal fade" id="rangesModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Definir rangos horarios</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="d-flex gap-2 mb-2">
                  <select id="rangeStart" class="form-select form-select-sm"></select>
                  <select id="rangeEnd" class="form-select form-select-sm"></select>
                  <button id="addRangeBtn" class="btn btn-sm btn-primary">Añadir</button>
                </div>
                <ul id="rangesList" class="list-group small"></ul>
                <div class="form-text mt-2">Soporta rangos que crucen medianoche (ej. 22:00 - 06:00). Evita solapamientos.</div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" id="saveRangesBtn" class="btn btn-success">Guardar rangos</button>
              </div>
            </div>
          </div>
        </div>
        `;
        document.body.appendChild(wrapper);
        modalEl = document.getElementById('rangesModal');
        listEl = document.getElementById('rangesList');
        addBtn = document.getElementById('addRangeBtn');
        saveBtn = document.getElementById('saveRangesBtn');
        startSelect = document.getElementById('rangeStart');
        endSelect = document.getElementById('rangeEnd');
        populateHourSelects(startSelect, endSelect);
        addBtn.addEventListener('click', addRangeFromSelects);
        saveBtn.addEventListener('click', onSave);
        // keep bootstrap modal instance
    }

    function populateHourSelects(s,e,selectedStart,selectedEnd){
        s.innerHTML = '';
        e.innerHTML = '';
        for(let h=0; h<=24; h++){
            const label = h.toString().padStart(2,'0')+':00';
            const opt1 = document.createElement('option'); opt1.value = h; opt1.textContent = label;
            const opt2 = opt1.cloneNode(true);
            if (selectedStart !== undefined && selectedStart==h) opt1.selected = true;
            if (selectedEnd !== undefined && selectedEnd==h) opt2.selected = true;
            s.appendChild(opt1); e.appendChild(opt2);
        }
    }

    function normalizeRange(r){
        return { inicio: Number(r.inicio), fin: Number(r.fin) };
    }

    function rangesOverlap(a,b){
        // handle ranges that may wrap midnight
        function includes(r, t){
            if(r.inicio <= r.fin) return t >= r.inicio && t < r.fin;
            return t >= r.inicio || t < r.fin;
        }
        // sample approach: check if any endpoint of a is inside b or viceversa
        for(let t of [a.inicio, (a.fin-1+24)%24]) if(includes(b,t)) return true;
        for(let t of [b.inicio, (b.fin-1+24)%24]) if(includes(a,t)) return true;
        return false;
    }

    function addRangeFromSelects(){
        const inicio = Number(startSelect.value);
        const fin = Number(endSelect.value);
        if (isNaN(inicio) || isNaN(fin)) return;
        const newR = normalizeRange({inicio, fin});
        // validate not duplicate/overlap
        const existing = getCurrentRanges();
        for(const ex of existing){ if(rangesOverlap(ex,newR)){ alert('Rango se solapa con uno existente.'); return; } }
        existing.push(newR);
        renderList(existing);
    }

    function renderList(ranges){
        listEl.innerHTML = '';
        ranges.forEach((r, idx) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `<div>${formatRange(r)}</div><div class="btn-group btn-group-sm"><button data-idx="${idx}" class="btn btn-outline-secondary btn-edit">✏️</button><button data-idx="${idx}" class="btn btn-outline-danger btn-del">🗑</button></div>`;
            listEl.appendChild(li);
        });
        // attach handlers
        listEl.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', (ev)=>{
            const i = Number(ev.currentTarget.dataset.idx);
            const ranges = getCurrentRanges(); ranges.splice(i,1); renderList(ranges);
        }));
        listEl.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', (ev)=>{
            const i = Number(ev.currentTarget.dataset.idx);
            const ranges = getCurrentRanges(); const r = ranges[i];
            populateHourSelects(startSelect,endSelect,r.inicio,r.fin);
            ranges.splice(i,1); renderList(ranges);
        }));
    }

    function formatRange(r){
        const a = String(r.inicio).padStart(2,'0')+':00';
        const b = String(r.fin).padStart(2,'0')+':00';
        return `${a} - ${b}`;
    }

    function getCurrentRanges(){
        // read from list DOM
        const items = Array.from(listEl.querySelectorAll('.list-group-item'));
        if(items.length===0) return [];
        return items.map(li => {
            const txt = li.querySelector('div').textContent.trim();
            const parts = txt.split('-').map(s => s.trim());
            const inicio = Number(parts[0].split(':')[0]);
            const fin = Number(parts[1].split(':')[0]);
            return { inicio, fin };
        });
    }

    function open(initialRanges){
        if(!modalEl) buildModal();
        renderList([]);
        populateHourSelects(startSelect,endSelect);
        if(Array.isArray(initialRanges)){
            renderList(initialRanges.map(normalizeRange));
        }
        // show modal and return promise
        const bs = new bootstrap.Modal(modalEl, { backdrop:'static' });
        bs.show();
        return new Promise((resolve) => {
            currentResolve = resolve;
        });
    }

    function onSave(){
        const ranges = getCurrentRanges();
        // basic validation: at least one range
        if(ranges.length===0){ alert('Define al menos un rango.'); return; }
        // close modal
        const bs = bootstrap.Modal.getInstance(modalEl);
        bs.hide();
        if(currentResolve) currentResolve(ranges);
        currentResolve = null;
    }

    return { open };
})();

export default rangesModal;
