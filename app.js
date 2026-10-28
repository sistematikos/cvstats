import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const MASTER_SUPA_URL = "https://ajdimbptzoeqzrrioywt.supabase.co";
const MASTER_SUPA_KEY = "sb_publishable_aVydbrj88elb7XVq1yopFw_2U4MHgHv";

const supabaseMaster = createClient(MASTER_SUPA_URL, MASTER_SUPA_KEY);
const getHardwareID = () => btoa(navigator.userAgent + navigator.language);

// 1. Función de pegado automático desde el portapapeles para móviles
const btnPegar = document.getElementById('btnPegarPortapapeles');
if (btnPegar) {
    btnPegar.addEventListener('click', async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const textoCopiado = await navigator.clipboard.readText();
                document.getElementById('tokenInput').value = textoCopiado.trim();
                const statusDiv = document.getElementById('statusMsg');
                statusDiv.className = "text-xs font-bold text-emerald-600";
                statusDiv.innerText = "¡Código pegado con éxito!";
            } else {
                alert("Tu navegador no permite lectura automática. Mantén presionado el cuadro de texto.");
            }
        } catch (err) {
            alert("No se pudo acceder al portapapeles. Mantén presionado el recuadro para pegar tu código.");
        }
    });
}

// 2. Proceso de activación, verificación de dispositivos e instalación PWA
async function procesarActivacionEInstalacion() {
    const rawToken = document.getElementById('tokenInput').value.trim();
    const statusDiv = document.getElementById('statusMsg');
    if (!rawToken) return alert("Por favor, pega el código de licencia primero.");
    
    const btn = document.getElementById('btnActivarEInstalar');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verificando licencia...`;

    try {
        const data = JSON.parse(atob(rawToken));
        const hwID = getHardwareID();
        const activationId = data.clubId || data.activation_id;

        if (!activationId) {
            throw new Error("El token no contiene un ID de club válido.");
        }

        const { data: empresaData, error: empresaError } = await supabaseMaster
            .from('licencias')
            .select('*')
            .eq('id', activationId)
            .single();

        if (empresaError || !empresaData) {
            throw new Error("La empresa o licencia no se encuentra registrada en el sistema central.");
        }

        let equiposLicencia = Array.isArray(empresaData.equipos) ? empresaData.equipos : [];
        let limiteStr = empresaData.limite_dispositivos || data.limite || "3";
        let limiteLicencia = (limiteStr === "Ilimitado") ? 999 : (parseInt(limiteStr) || 3);

        if (!equiposLicencia.includes(hwID) && equiposLicencia.length >= limiteLicencia) {
            alert("Error: Se ha alcanzado el límite de dispositivos permitidos para esta licencia.");
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
            return;
        }

        if (!equiposLicencia.includes(hwID)) {
            equiposLicencia.push(hwID);
            await supabaseMaster
                .from('licencias')
                .update({ equipos: equiposLicencia })
                .eq('id', activationId);
        }

        localStorage.setItem('control_voley_supa_url', empresaData.supabase_url || data.supabaseUrl);
        localStorage.setItem('control_voley_supa_key', empresaData.supabase_key || data.supabaseKey);
        localStorage.setItem('control_voley_supa_bucket', empresaData.bucket || data.bucket || activationId);

        if (empresaData.nombre || data.clubNombre) {
            localStorage.setItem('control_voley_club_nombre', empresaData.nombre || data.clubNombre);
        }

        localStorage.setItem('youcontrol_empresa_id', activationId);
        localStorage.setItem('licencia_validada', 'true');

        if (window.deferredPrompt) {
            statusDiv.className = "text-xs font-bold text-amber-600";
            statusDiv.innerText = "Confirmando instalación de la App...";

            window.deferredPrompt.prompt();
            const userChoice = await window.deferredPrompt.userChoice;
            window.deferredPrompt = null;

            if (userChoice.outcome === 'accepted') {
                statusDiv.className = "text-xs font-bold text-emerald-600";
                statusDiv.innerText = "¡Aplicación instalada con éxito! Redirigiendo...";
                setTimeout(() => {
                    window.location.replace('index_stats.html');
                }, 500);
            } else {
                alert("Instalación obligatoria: Debes confirmar la instalación de la App para ingresar al módulo Stats.");
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
                statusDiv.className = "text-xs font-bold text-rose-600";
                statusDiv.innerText = "Instalación cancelada. Debes instalar la App para ingresar.";
            }
        } else if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            statusDiv.className = "text-xs font-bold text-emerald-600";
            statusDiv.innerText = "Licencia válida. Ingresando...";
            setTimeout(() => {
                window.location.replace('index_stats.html');
            }, 500);
        } else {
            alert("Para ingresar debes instalar esta aplicación. Usa la opción 'Añadir a la pantalla de inicio' o 'Instalar aplicación' desde el menú de tu navegador.");
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
            statusDiv.className = "text-xs font-bold text-rose-600";
            statusDiv.innerText = "Instala la app desde el menú de tu navegador para continuar.";
        }
        
    } catch (e) {
        console.error("Error al procesar activación:", e);
        alert("Código de licencia inválido o error en la conexión: " + e.message);
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
        statusDiv.innerText = "";
    }
}

const btnActivar = document.getElementById('btnActivarEInstalar');
if (btnActivar) {
    btnActivar.addEventListener('click', procesarActivacionEInstalacion);
}
