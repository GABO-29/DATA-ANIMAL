// app.js - MOTOR CON CORRECCIÓN DE JERARQUÍA HORARIA (24H)

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
    if(cont) cont.innerHTML = filas.map(f => `<div style="letter-spacing: 10px;">${f}</div>`).join('');
}

// Función auxiliar para convertir "06:00 p.m." a un número comparable (1800)
function horaANumero(horaStr) {
    if (!horaStr) return 0;
    let [tiempo, meridiano] = horaStr.split(' ');
    let [hh, mm] = tiempo.split(':').map(Number);
    
    if (meridiano === 'p.m.' && hh !== 12) hh += 12;
    if (meridiano === 'a.m.' && hh === 12) hh = 0;
    
    return hh * 100 + mm; // Ejemplo: "06:00 p.m." -> 1800, "12:00 p.m." -> 1200
}

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    if(listado) listado.innerHTML = "<div class='loading'>Sincronizando última hora...</div>";
    
    try {
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta);

        if (error || !data || data.length < 2) {
            if(listado) listado.innerHTML = "Sin datos suficientes.";
            return;
        }

        // --- CORRECCIÓN CRÍTICA: ORDENAMIENTO MANUAL POR REGLA DE 24H ---
        data.sort((a, b) => {
            // Primero comparamos la fecha (lo más reciente arriba)
            if (a.fecha > b.fecha) return -1;
            if (a.fecha < b.fecha) return 1;
            // Si la fecha es igual, comparamos la hora convertida a 24h
            return horaANumero(b.hora) - horaANumero(a.hora);
        });

        // Ahora data[0] es REALMENTE el último sorteo cargado
        const ultimoResultado = data[0];
        const hoy = new Date();
        const diasSemana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
        const diaActualNombre = diasSemana[hoy.getDay()];

        // Análisis de secuencias
        const pesos = {};
        const seguidores = [];
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i+1].animal_numero === ultimoResultado.animal_numero) {
                seguidores.push(data[i].animal_numero);
            }
        }

        seguidores.forEach(num => { pesos[num] = (pesos[num] || 0) + 4.0; });
        
        data.filter(d => {
            const fD = new Date(d.fecha + "T00:00:00");
            return diasSemana[fD.getDay()] === diaActualNombre;
        }).forEach(d => { pesos[d.animal_numero] = (pesos[d.animal_numero] || 0) + 2.0; });

        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);

        // Renderizado
        if(ganadorTxt) ganadorTxt.innerText = sugeridos[0] ? sugeridos[0][0] : "---";
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);
        
        if(listado) {
            listado.innerHTML = `
                <div style="margin-bottom:15px; background:#222; padding:15px; border-radius:10px; border-left: 5px solid var(--oro);">
                    <small style="color:var(--oro); font-weight:bold;">SISTEMA DE SECUENCIAS</small>
                    <div style="font-size:1.8rem; font-weight:900; letter-spacing:5px;">
                        ${tripleta.length >= 3 ? tripleta.join(" - ") : "---"}
                    </div>
                </div>
                <div style="font-size:0.75rem; color:#888; margin-bottom:15px;">
                    <strong>Último Sorteo Detectado:</strong> ${ultimoResultado.animal_numero} (${ultimoResultado.animal_nombre})<br>
                    <strong>Hora:</strong> ${ultimoResultado.hora} | <strong>Fecha:</strong> ${ultimoResultado.fecha}
                </div>
            `;

            listado.innerHTML += sugeridos.slice(0, 5).map(a => {
                const animal = data.find(d => d.animal_numero === a[0]);
                return `
                    <div class="fila-stats" style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #222;">
                        <span>${a[0]} ${animal ? animal.animal_nombre : ''}</span>
                        <span style="color:var(--oro); font-weight:bold;">${Math.min(Math.floor(a[1] * 12), 99)}%</span>
                    </div>
                `;
            }).join('');
        }

    } catch (err) {
        console.error(err);
        if(listado) listado.innerHTML = "Error de sincronización.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});