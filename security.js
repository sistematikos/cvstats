// ==========================================
// CONTROL VOLEY - ESCUDO DE SEGURIDAD Y BLOQUEO
// ==========================================

// 1. Bloqueo de atajos de teclado para Inspección (F12, Ctrl+Shift+I, Ctrl+U, etc.)
document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 69)) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
        e.preventDefault();
        return false;
    }
});

// 2. Bloqueo total del Clic Derecho
document.addEventListener('contextmenu', event => {
    event.preventDefault();
    return false;
});

// 3. Validación de sesión activa complementaria (Excluyendo el index.html de activación)
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    // Si estamos en la raíz o en el index.html principal, no aplicamos el bloqueo de sesión para permitir la activación
    if (path.endsWith('/') || path.endsWith('index.html')) {
        return;
    }

    const empresaID = localStorage.getItem('youcontrol_empresa_id');
    const supaUrl = localStorage.getItem('control_voley_supa_url');
    
    if (!empresaID || !supaUrl) {
        window.location.href = 'index.html';
    }
});
