// utils.js
// Utilidades generales y helpers para la app

export function mostrarAlerta(mensaje, tipo = "info", tiempo = 2600) {
    const div = document.createElement('div');
    div.className = 'custom-alert ' + (tipo || 'info');
    div.innerHTML = `<div class="icon">${tipo === 'success' ? '✅' : tipo === 'error' ? '⚠️' : 'ℹ️'}</div>
                 <div style="flex:1">${mensaje}</div>`;
    document.body.appendChild(div);
    requestAnimationFrame(() => div.classList.add('show'));
    setTimeout(() => {
        div.classList.remove('show');
        setTimeout(() => div.remove(), 300);
    }, tiempo);
}

export function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}