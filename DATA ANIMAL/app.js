// app.js - MOTOR DE PRECISIÓN ABSOLUTA

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

// ESTA FUNCIÓN ES EL "FILTRO" QUE EVITA EL ERROR DE LAS IMÁGENES
function obtenerPrioridadHora(horaStr) {
    if (!horaStr) return 0;
    
    // Normalizamos: pasamos a minúsculas, quitamos puntos, quitamos espacios y quitamos ceros a la izquierda
    // " 05:00 p.m. " -> "5:00pm"
    let limpia = horaStr.toLowerCase().replace(/\./g, '').replace(/\s/g, '');
    if (limpia.startsWith('0')) limpia = limpia.substring(1);

    const mapaOrden = {
        "8:00am": 1, "9:00am": 2, "10:00am": 3, "11:00am": 4,
        "12:00pm": 5, // Mediodía
        "1:00pm": 6, "2:00pm": 7, "3:00pm": 8, "4:00pm": 9,
        "5:00pm": 10, "6:00pm": 11, "7:00pm": 12
    };

    return mapaOrden[limpia] || 0;
}

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    listado.innerHTML = "<div class='loading'>Sincronizando reloj...</div>";
    
    try {
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta);

        if (error || !data || data.length < 2) {
            listado.innerHTML = "Esperando datos...";
            return;
        }

        // ORDENAMIENTO DE HIERRO
        data.sort((a, b) => {
            // 1. Comparar fechas (Texto ISO: 2026-03-30)
            if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
            
            // 2. Si es la misma fecha, usar nuestra jerarquía limpia
            return obtenerPrioridadHora(b.hora) - obtenerPrioridadHora(a.hora);
        });

        // Ahora 'data[0]' será SIEMPRE el sorteo más reciente cargado
        const ultimoResultado = data[0]; 
        const ahora = new Date();
        const diasSemana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
        const diaActualNombre = diasSemana[ahora.getDay()];

        // ANALISIS DE SECUENCIA
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

        // RENDERIZADO
        if(ganadorTxt) ganadorTxt.innerText = sugeridos[0] ? sugeridos[0][0] : "---";
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);
        
        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#222; padding:15px; border-radius:10px; border: 1px solid var(--oro);">
                <small style="color:var(--oro); font-weight:bold;">PRONÓSTICO SEGÚN RELOJ</small>
                <div style="font-size:1.8rem; font-weight:900; letter-spacing:5px;">
                    ${tripleta.length >= 3 ? tripleta.join(" - ") : "---"}
                </div>
            </div>
            <div style="font-size:0.8rem; color:#888; background:#111; padding:10px; border-radius:5px;">
                <strong>Último detectado:</strong> ${ultimoResultado.animal_numero} (${ultimoResultado.animal_nombre})<br>
                <strong>Sorteo de las:</strong> ${ultimoResultado.hora}<br>
                <strong>Día detectado:</strong> ${ultimoResultado.fecha === ahora.toISOString().split('T')[0] ? "HOY" : ultimoResultado.fecha}
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
        listado.innerHTML = "Error de sincronización.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});