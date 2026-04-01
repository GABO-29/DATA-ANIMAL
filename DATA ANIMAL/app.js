// app.js - SISTEMA DE ALTA PRECISIÓN (VERSIÓN BOLITAS RACING + EXTRACCIÓN DE PIRÁMIDE)
// ESTRATEGIAS: SINCRONÍA INTER-RULETAS + RACHA VIVA GLOBAL + FILTRO HORARIO

let diaOffset = 0; // 0 = Hoy, 1 = Mañana

function cambiarDia(nuevoOffset) {
    diaOffset = nuevoOffset;
    
    const btnHoy = document.getElementById('btn-hoy');
    const btnManana = document.getElementById('btn-manana');
    
    if (diaOffset === 1) {
        btnManana.style.background = "#ffcc00"; btnManana.style.color = "#000";
        btnHoy.style.background = "#141414"; btnHoy.style.color = "#ffcc00";
    } else {
        btnHoy.style.background = "#ffcc00"; btnHoy.style.color = "#000";
        btnManana.style.background = "#141414"; btnManana.style.color = "#ffcc00";
    }

    generarPiramide();
    obtenerEstadisticas(document.getElementById('filtro-ruleta').value);
}

function generarPiramide() {
    const fecha = new Date();
    if (diaOffset === 1) fecha.setDate(fecha.getDate() + 1);
    
    let base = String(fecha.getDate()).padStart(2,'0') + String(fecha.getMonth()+1).padStart(2,'0') + String(fecha.getFullYear());
    let filas = [base];
    let actual = base;
    
    while (actual.length > 1) {
        let n = "";
        for (let i=0; i<actual.length-1; i++) n += (parseInt(actual[i]) + parseInt(actual[i+1])) % 10;
        filas.push(n);
        actual = n;
    }

    const cont = document.getElementById('contenedor-piramide');
    if(cont) {
        // Renderizado de la pirámide clásica
        cont.innerHTML = filas.map(f => `<div style="letter-spacing:10px; margin-bottom:5px; font-weight:bold;">${f}</div>`).join('');
        
        // --- EXTRACCIÓN DE ANIMALES DE LA PIRÁMIDE (BOLITAS) ---
        // Tomamos los últimos 2 dígitos de las filas intermedias para detectar patrones
        const animalesExtraidos = [...new Set(filas.filter(f => f.length >= 2).map(f => f.slice(-2)))].slice(0, 4);
        
        const infoExtra = document.createElement('div');
        infoExtra.innerHTML = `
            <div style="margin-top:20px; padding-top:15px; border-top:1px solid #333; width:100%;">
                <span style="font-size:0.7rem; color:#888; display:block; margin-bottom:10px; font-weight:bold; text-transform:uppercase;">Animales detectados en Pirámide:</span>
                <div style="display:flex; justify-content:center; gap:12px;">
                    ${animalesExtraidos.map(num => `
                        <div style="background:#ffcc00; color:#000; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
                            ${num}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        cont.appendChild(infoExtra);
    }
}

async function obtenerEstadisticas(ruletaActual = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    
    try {
        const { data: globalData, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .order('id', { ascending: false })
            .limit(2000);

        if (error || !globalData || globalData.length < 50) return;

        const todos = globalData.filter(d => d.ruleta === ruletaActual);
        const ultimo = todos[0];
        
        const fechaAnalisis = new Date();
        if (diaOffset === 1) fechaAnalisis.setDate(fechaAnalisis.getDate() + 1);
        const diaSemanaAnalisis = fechaAnalisis.getDay();
        const nombresDias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

        // --- ESTRATEGIA B: BASES MAESTRAS (GLOBAL) ---
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 3);
        const conteoVivosGlobal = {};
        globalData.forEach(d => {
            if (new Date(d.fecha) >= fechaLimite) {
                conteoVivosGlobal[d.animal_numero] = (conteoVivosGlobal[d.animal_numero] || 0) + 1;
            }
        });
        const rachaVivaGlobal = Object.entries(conteoVivosGlobal)
            .sort((a,b) => b[1] - a[1])
            .map(x => x[0]);

        if(ganadorTxt) ganadorTxt.innerText = rachaVivaGlobal[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:12px; background:#1a1a1a; padding:15px; border-radius:10px; border: 2px solid #00ff00; text-align:center;">
                <div style="color:#00ff00; font-weight:bold; font-size:0.7rem; text-transform:uppercase;">🚀 ESTRATEGIA B: BASES MAESTRAS</div>
                <div style="display:flex; justify-content:center; gap:15px; margin: 10px 0;">
                    <div style="background:#000; color:#fff; width:55px; height:55px; border-radius:50%; border:2px solid #00ff00; display:flex; align-items:center; justify-content:center; font-size:1.6rem; font-weight:900;">${rachaVivaGlobal[0]}</div>
                    <div style="background:#000; color:#fff; width:55px; height:55px; border-radius:50%; border:2px solid #00ff00; display:flex; align-items:center; justify-content:center; font-size:1.6rem; font-weight:900;">${rachaVivaGlobal[1]}</div>
                </div>
                <div style="color:#00ff00; font-size:0.55rem;">TENDENCIA GLOBAL - PARA TODAS LAS RULETAS</div>
            </div>
        `;

        await generarSeccionPollasSeis(diaSemanaAnalisis, globalData, ruletaActual);

    } catch (err) { console.error(err); }
}

async function generarSeccionPollasSeis(diaSemana, globalData, ruletaActual) {
    const cont = document.getElementById('seccion-pollas');
    if (!cont) return;

    // --- BLOQUEO DE SEGURIDAD ESTRICTO POR RESULTADO REAL ---
    // Usamos la fecha actual en formato local YYYY-MM-DD para comparar con la DB
    const ahora = new Date();
    const hoyStr = ahora.getFullYear() + "-" + String(ahora.getMonth() + 1).padStart(2, '0') + "-" + String(ahora.getDate()).padStart(2, '0');
    
    const resultadosHoyRuleta = globalData.filter(d => d.fecha === hoyStr && d.ruleta === ruletaActual);
    
    // Verificamos si ya existen los sorteos de apertura de cada bloque
    const tieneManana = resultadosHoyRuleta.some(d => d.hora.includes('9:00'));
    const tieneTarde = resultadosHoyRuleta.some(d => d.hora.includes('3:00'));

    const analice = (h1, h2) => {
        const m = {};
        globalData.forEach(d => {
            const f = new Date(d.fecha + 'T12:00:00');
            if (f.getDay() === diaSemana) {
                const h = d.hora.toLowerCase();
                const n = parseInt(h.split(':')[0]);
                const pm = h.includes('p.m');
                const h24 = (pm && n !== 12) ? n + 12 : (!pm && n === 12 ? 0 : n);
                if (h24 >= h1 && h24 <= h2) {
                    m[d.animal_numero] = (m[d.animal_numero] || 0) + 1;
                }
            }
        });
        return Object.entries(m).sort((a,b) => b[1] - a[1]).map(x => x[0]);
    };

    const m6 = analice(9, 13).slice(0, 6);
    const t6 = analice(15, 19).filter(n => !m6.includes(n)).slice(0, 6);

    const renderBolitasLineales = (lista, activo, titulo) => {
        let visual = "";
        // Bloqueo: Si es hoy (offset 0) y no hay resultado, muestra mensaje de espera
        if (!activo && diaOffset === 0) {
            visual = `<div style="color:#ff4444; font-style:italic; font-size:0.75rem; padding:15px; background:#111; border-radius:8px; border:1px dashed #444;">ESPERANDO RESULTADO DE LAS ${titulo.includes('MAÑANA') ? '9AM' : '3PM'}...</div>`;
        } else {
            // Renderizado en una sola línea (bolitas grises/oscuras estilo racing)
            visual = `
                <div style="display:flex; justify-content:space-between; gap:5px; width:100%;">
                    ${lista.map(n => `
                        <div style="background:#222; color:#ffcc00; width:15%; aspect-ratio:1/1; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:0.9rem; border:1px solid #444; box-shadow: inset 0 0 8px rgba(0,0,0,0.8);">
                            ${n}
                        </div>
                    `).join('')}
                </div>`;
        }
        return `
            <div style="margin-bottom:25px; width:100%;">
                <div style="color:#00ff00; font-size:0.6rem; font-weight:bold; text-transform:uppercase; margin-bottom:10px;">${titulo}</div>
                ${visual}
            </div>
        `;
    };

    cont.innerHTML = `
        <div style="margin-top:20px; background:#000; border: 2px solid #ffcc00; padding:20px; border-radius:15px; text-align:center;">
            <h4 style="color:#ffcc00; margin:0 0 20px 0; font-size:0.9rem; text-transform:uppercase; font-weight:900; letter-spacing:1px;">🔥 POLLA DE 6 (TENDENCIA BLOQUEADA)</h4>
            
            ${renderBolitasLineales(m6, tieneManana, "🎯 BLOQUE MAÑANA (9AM - 1PM)")}
            ${renderBolitasLineales(t6, tieneTarde, "🎯 BLOQUE TARDE (3PM - 7PM)")}
            
            <div style="margin-top:10px; color:#444; font-size:0.5rem; text-transform:uppercase; letter-spacing:1px;">Estrategia: Frecuencia Horaria + Repique Global</div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});