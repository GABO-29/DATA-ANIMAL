// app.js - MOTOR POR DETECCIÓN DE TIEMPO REAL

function generarPiramide() {
    const hoy = new Date();
    let base = String(hoy.getDate()).padStart(2,'0') + String(hoy.getMonth()+1).padStart(2,'0') + String(hoy.getFullYear());
    let filas = [base];
    let actual = base;
    while (actual.length > 1) {
        let n = "";
        for (let i=0; i<actual.length-1; i++) n += (parseInt(actual[i]) + parseInt(actual[i+1])) % 10;
        filas.push(n);
        actual = n;
    }
    const cont = document.getElementById('contenedor-piramide');
    if(cont) cont.innerHTML = filas.map(f => `<div>${f}</div>`).join('');
}

// OPCIÓN 1: TRADUCTOR DE JERARQUÍA CON LIMPIEZA DE TEXTO
function obtenerPrioridadHora(horaStr) {
    if (!horaStr) return 0;
    
    // Limpiamos el texto: quitamos puntos, espacios y pasamos a minúsculas
    // Ejemplo: "12:00 p.m." -> "12:00pm"
    const horaLimpia = horaStr.toLowerCase().replace(/\./g, '').replace(/\s/g, '');

    const mapaOrden = {
        "08:00am": 1, "09:00am": 2, "10:00am": 3, "11:00am": 4,
        "12:00pm": 5, // MEDIODÍA
        "01:00pm": 6, "02:00pm": 7, "03:00pm": 8, "04:00pm": 9,
        "05:00pm": 10, "06:00pm": 11, "07:00pm": 12
    };

    return mapaOrden[horaLimpia] || 0;
}

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    listado.innerHTML = "<div class='loading'>Sincronizando con el reloj del servidor...</div>";
    
    try {
        // 1. OBTENER TODO EL HISTORIAL
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta);

        if (error || !data || data.length < 2) {
            listado.innerHTML = "Esperando carga de datos históricos...";
            return;
        }

        // --- APLICACIÓN DE JERARQUÍA MANUAL ---
        // Ordenamos primero por fecha y luego usamos nuestra función de prioridad
        data.sort((a, b) => {
            if (a.fecha > b.fecha) return -1;
            if (a.fecha < b.fecha) return 1;
            // Si la fecha es igual, comparamos los pesos numéricos (12pm=5, 1pm=6)
            return obtenerPrioridadHora(b.hora) - obtenerPrioridadHora(a.hora);
        });

        // 2. DETECTAR ÚLTIMO RESULTADO REAL
        const ahora = new Date();
        const ultimoResultado = data[0]; 

        const diasSemana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
        const diaActualNombre = diasSemana[ahora.getDay()];

        // --- LÓGICA DE SECUENCIA (PUNTUACIÓN POR "LLAMADO") ---
        const pesos = {};
        const seguidores = [];
        
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i+1].animal_numero === ultimoResultado.animal_numero) {
                seguidores.push(data[i].animal_numero);
            }
        }

        seguidores.forEach(num => { pesos[num] = (pesos[num] || 0) + 4; });
        
        data.filter(d => {
            const fD = new Date(d.fecha + "T00:00:00");
            return diasSemana[fD.getDay()] === diaActualNombre;
        }).forEach(d => { pesos[d.animal_numero] = (pesos[d.animal_numero] || 0) + 2; });

        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);

        // --- RENDERIZADO ---
        if(ganadorTxt) ganadorTxt.innerText = sugeridos[0] ? sugeridos[0][0] : "---";

        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);
        
        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#222; padding:15px; border-radius:10px; border: 1px solid var(--oro);">
                <small style="color:var(--oro); font-weight:bold;">PRONÓSTICO SEGÚN RELOJ</small>
                <div style="font-size:1.8rem; font-weight:900; letter-spacing:5px;">
                    ${tripleta.length >= 3 ? tripleta.join(" - ") : "Calculando..."}
                </div>
            </div>
            <div style="font-size:0.8rem; color:#888; background:#111; padding:10px; border-radius:5px;">
                <strong>Último detectado:</strong> ${ultimoResultado.animal_numero} (${ultimoResultado.animal_nombre})<br>
                <strong>Sorteo de las:</strong> ${ultimoResultado.hora}<br>
                <strong>Día:</strong> ${diaActualNombre}
            </div>
            <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
        `;

        listado.innerHTML += sugeridos.slice(0, 5).map(a => {
            const animal = data.find(d => d.animal_numero === a[0]);
            return `
                <div class="fila-stats" style="display:flex; justify-content:space-between; padding:5px 0;">
                    <span>${a[0]} ${animal ? animal.animal_nombre : ''}</span>
                    <span style="color:var(--oro)">${Math.min(Math.floor(a[1] * 12), 98)}%</span>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        listado.innerHTML = "Error al sincronizar datos.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});