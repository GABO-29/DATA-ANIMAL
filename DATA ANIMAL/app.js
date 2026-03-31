// app.js - SISTEMA DE ALTA PRECISIÓN COMPARATIVO (DÍA vs RACHA vs FRÍOS)

let diaOffset = 0; // 0 = Hoy, 1 = Mañana

function cambiarDia(nuevoOffset) {
    diaOffset = nuevoOffset;
    
    // Actualizar estilo visual de los botones
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
    if (diaOffset === 1) fecha.setDate(fecha.getDate() + 1); // Adelantar si es mañana
    
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
    if(cont) cont.innerHTML = filas.map(f => `<div>${f}</div>`).join('');
}

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    
    try {
        const { data: todos, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta)
            .order('id', { ascending: false })
            .limit(1000);

        if (error || !todos || todos.length < 20) return;

        const ultimo = todos[0];
        const fechaAnalisis = new Date();
        if (diaOffset === 1) fechaAnalisis.setDate(fechaAnalisis.getDate() + 1);
        
        const diaSemanaAnalisis = fechaAnalisis.getDay();
        const nombresDias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

        // --- ESTRATEGIA 1: DÍA DE LA SEMANA (HISTÓRICO) ---
        const resultadosMismoDia = todos.filter(d => {
            const f = new Date(d.fecha + 'T12:00:00');
            return f.getDay() === diaSemanaAnalisis;
        });
        const conteoDia = {};
        resultadosMismoDia.forEach(d => { conteoDia[d.animal_numero] = (conteoDia[d.animal_numero] || 0) + 1; });
        const basesDia = Object.entries(conteoDia).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);

        // --- ESTRATEGIA 2: LA RACHA (ÚLTIMOS 150 SORTEOS) ---
        const ultimosSorteos = todos.slice(0, 150);
        const conteoRacha = {};
        ultimosSorteos.forEach(d => { conteoRacha[d.animal_numero] = (conteoRacha[d.animal_numero] || 0) + 1; });
        const basesRacha = Object.entries(conteoRacha).sort((a,b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);

        // --- ESTRATEGIA 3: LOS "FRÍOS" ---
        const recientes = new Set(todos.slice(0, 100).map(d => d.animal_numero));
        const conteoGlobal = {};
        todos.forEach(d => { conteoGlobal[d.animal_numero] = (conteoGlobal[d.animal_numero] || 0) + 1; });
        const frios = Object.entries(conteoGlobal)
            .filter(x => !recientes.has(x[0]))
            .sort((a,b) => b[1] - a[1])
            .slice(0, 2)
            .map(x => x[0]);

        // --- LÓGICA DE REACCIÓN DINÁMICA (CALIENTE PRÓXIMO) ---
        const mapaSorteo = {};
        for (let i = 0; i < todos.length - 1; i++) {
            if (todos[i+1].animal_numero === ultimo.animal_numero) {
                mapaSorteo[todos[i].animal_numero] = (mapaSorteo[todos[i].animal_numero] || 0) + 1;
            }
        }
        let proximoSorteo = Object.entries(mapaSorteo).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
        if (proximoSorteo.length === 0) {
            proximoSorteo = Object.entries(conteoGlobal).sort((a,b) => b[1] - a[1]).slice(2, 5).map(x => x[0]);
        }

        // --- RENDERIZADO DEL PANEL COMPARATIVO (CON CENTRADO) ---
        if(ganadorTxt) ganadorTxt.innerText = basesDia[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:15px; background: #000; border: 2px solid #ffcc00; padding:15px; border-radius:12px; text-align:center;">
                <div style="color:#ffcc00; font-weight:bold; font-size:0.7rem; text-transform:uppercase; margin-bottom:5px;">👑 TRIPLETA VIP ${nombresDias[diaSemanaAnalisis]}</div>
                <div style="font-size:1.8rem; font-weight:900; color:#fff; letter-spacing:5px;">
                    ${basesDia.length >= 3 ? basesDia.join(" | ") : "05 | 14 | 22"}
                </div>
                <div style="color:#666; font-size:0.55rem; margin-top:5px;">LOS MÁS REPETIDOS LOS DÍAS ${nombresDias[diaSemanaAnalisis]}</div>
            </div>

            <div style="margin-bottom:12px; background: #d4af37; padding:15px; border-radius:10px; color:#000; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-align:center;">
                <div style="font-weight:bold; font-size:0.6rem; text-transform:uppercase; letter-spacing:1px;">Estrategia A: Especial ${nombresDias[diaSemanaAnalisis]}</div>
                <div style="font-size:2rem; font-weight:900; letter-spacing:8px;">
                    ${basesDia.slice(0,2).join(" - ")}
                </div>
            </div>

            <div style="margin-bottom:12px; background:#1a1a1a; padding:12px; border-radius:10px; border: 1px solid #00ff00; text-align:center;">
                <div style="color:#00ff00; font-weight:bold; font-size:0.6rem; text-transform:uppercase;">Estrategia B: Racha Últimos Sorteos</div>
                <div style="font-size:1.6rem; font-weight:bold; color:#fff; letter-spacing:5px;">
                    ${basesRacha.join(" - ")}
                </div>
            </div>

            <div style="margin-bottom:12px; background:#1a1a1a; padding:12px; border-radius:10px; border: 1px solid #ff4444; text-align:center;">
                <div style="color:#ff4444; font-weight:bold; font-size:0.6rem; text-transform:uppercase;">Estrategia C: Animales Fríos (Pendientes)</div>
                <div style="font-size:1.6rem; font-weight:bold; color:#fff; letter-spacing:5px;">
                    ${frios.length > 0 ? frios.join(" - ") : "00 - 36"}
                </div>
            </div>

            <div style="margin-bottom:12px; background:#111; padding:12px; border-radius:10px; border-left: 5px solid #00ff00; text-align:center;">
                <div style="color:#00ff00; font-weight:bold; font-size:0.65rem;">CALIENTE PARA EL PRÓXIMO SORTEO</div>
                <div style="color:#fff; font-size:0.8rem; margin: 4px 0;">Salió el <b>${ultimo.animal_numero}</b>, se espera:</div>
                <div style="font-size:1.4rem; font-weight:bold; color:#fff; letter-spacing:3px;">
                    ${proximoSorteo.join(" - ")}
                </div>
            </div>

            <div style="background:#000; padding:12px; border-radius:10px; border: 1px solid #d4af37; text-align:center;">
                <div style="color:#d4af37; font-weight:bold; font-size:0.6rem; text-transform:uppercase; margin-bottom:5px;">Tripleta Maestra (A + B + C)</div>
                <div style="font-size:1.5rem; font-weight:900; color:#fff; letter-spacing:4px;">
                    ${basesDia[0] || '01'} | ${basesRacha[0] || '18'} | ${frios[0] || '25'}
                </div>
            </div>
        `;

        await generarSeccionPollasSeis(diaSemanaAnalisis);

    } catch (err) { console.error(err); }
}

async function generarSeccionPollasSeis(diaSemana) {
    const cont = document.getElementById('seccion-pollas');
    if (!cont) return;

    try {
        const { data: global, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .order('id', { ascending: false })
            .limit(1000);

        if (error || !global) return;
        
        const analice = (h1, h2) => {
            const m = {};
            global.forEach(d => {
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
            return Object.entries(m).sort((a,b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
        };

        const m6 = analice(9, 13);
        const t6 = analice(15, 19);

        cont.innerHTML = `
            <div style="margin-top:20px; background:#000; border: 2px solid #d4af37; padding:15px; border-radius:12px; text-align:center;">
                <h4 style="color:#d4af37; margin:0 0 12px 0; font-size:0.8rem; text-transform:uppercase; border-bottom:1px solid #222; padding-bottom:8px;">Polla de 6 (Basada en ${diaOffset === 1 ? 'Mañana' : 'Hoy'})</h4>
                
                <div style="margin-bottom:15px;">
                    <small style="color:#666; font-size:0.55rem; text-transform:uppercase; display:block; margin-bottom:5px;">Bloque Mañana (9AM - 1PM)</small>
                    <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px;">
                        ${m6.map(n => `<div style="background:#222; color:#d4af37; font-size:0.75rem; padding:8px 0; border-radius:4px; font-weight:bold; border: 1px solid #333;">${n}</div>`).join('')}
                    </div>
                </div>

                <div>
                    <small style="color:#666; font-size:0.55rem; text-transform:uppercase; display:block; margin-bottom:5px;">Bloque Tarde (3PM - 7PM)</small>
                    <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px;">
                        ${t6.map(n => `<div style="background:#222; color:#d4af37; font-size:0.75rem; padding:8px 0; border-radius:4px; font-weight:bold; border: 1px solid #333;">${n}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});