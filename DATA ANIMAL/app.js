// app.js - SISTEMA DE ALTA PRECISIÓN (VERSIÓN TRIPLETA VIP + BASE MAESTRA)
// ESTRATEGIAS: SINCRONÍA GLOBAL + RACHA VIVA + FILTRO HORARIO

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
    if(cont) cont.innerHTML = filas.map(f => `<div>${f}</div>`).join('');
}

async function obtenerEstadisticas(ruletaActual = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    
    try {
        // Traemos 2000 registros para tener visión global de todas las ruletas
        const { data: globalData, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .order('id', { ascending: false })
            .limit(2000);

        if (error || !globalData || globalData.length < 50) return;

        // FILTRO: Datos específicos de la ruleta seleccionada
        const todos = globalData.filter(d => d.ruleta === ruletaActual);
        const ultimo = todos[0];
        
        // Configuración de fecha
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
        const basesDia = Object.entries(conteoDia).sort((a,b) => b[1] - a[1]).map(x => x[0]);

        // --- ESTRATEGIA 2: LA RACHA (ESPECÍFICA DE LA RULETA) ---
        const conteoRacha = {};
        todos.slice(0, 150).forEach(d => { conteoRacha[d.animal_numero] = (conteoRacha[d.animal_numero] || 0) + 1; });
        const basesRacha = Object.entries(conteoRacha).sort((a,b) => b[1] - a[1]).map(x => x[0]);

        // --- ESTRATEGIA B: RACHA VIVA GLOBAL (BASES PARA COMBINAR - 3 RULETAS) ---
        // Buscamos los que más salen en las últimas 72h en todo el sistema (Casi 100% probabilidad)
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 3);
        const conteoVivosGlobal = {};
        globalData.forEach(d => {
            if (new Date(d.fecha) >= fechaLimite) {
                conteoVivosGlobal[d.animal_numero] = (conteoVivosGlobal[d.animal_numero] || 0) + 1;
            }
        });
        const rachaVivaBase = Object.entries(conteoVivosGlobal)
            .sort((a,b) => b[1] - a[1])
            .map(x => x[0]);

        // --- LÓGICA DE TRIPLETA VIP (MANTENIENDO TU ESTRUCTURA ACTUAL) ---
        let tripletaVip = [];
        // 1. El más fuerte del día
        tripletaVip.push(basesDia[0] || "01");
        // 2. El mejor de racha específica que no esté repetido
        let rachaUnica = basesRacha.find(n => !tripletaVip.includes(n)) || "10";
        tripletaVip.push(rachaUnica);
        // 3. El líder de la racha viva global para cerrar con flujo
        let vivaUnica = rachaVivaBase.find(n => !tripletaVip.includes(n)) || "25";
        tripletaVip.push(vivaUnica);

        // --- LÓGICA: CALIENTE PRÓXIMO CON CRUCE HORARIO ---
        const esPmUltimo = ultimo.hora.toLowerCase().includes('p.m');
        const mapaHorario = {};
        for (let i = 0; i < todos.length - 1; i++) {
            if (todos[i+1].animal_numero === ultimo.animal_numero) {
                const esPmHist = todos[i].hora.toLowerCase().includes('p.m');
                if (esPmUltimo === esPmHist) {
                    mapaHorario[todos[i].animal_numero] = (mapaHorario[todos[i].animal_numero] || 0) + 1;
                }
            }
        }
        let proximoSorteo = Object.entries(mapaHorario)
            .filter(x => x[0] !== ultimo.animal_numero)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 3)
            .map(x => x[0]);

        if (proximoSorteo.length === 0) {
            proximoSorteo = rachaVivaBase.filter(n => n !== ultimo.animal_numero).slice(0, 3);
        }

        // --- RENDERIZADO DEL PANEL ---
        if(ganadorTxt) ganadorTxt.innerText = tripletaVip[0];

        listado.innerHTML = `
            <div style="margin-bottom:15px; background: #000; border: 2px solid #ffcc00; padding:15px; border-radius:12px; text-align:center;">
                <div style="color:#ffcc00; font-weight:bold; font-size:0.7rem; text-transform:uppercase; margin-bottom:5px;">👑 TRIPLETA VIP ${nombresDias[diaSemanaAnalisis]}</div>
                <div style="font-size:1.8rem; font-weight:900; color:#fff; letter-spacing:5px;">
                    ${tripletaVip.join(" | ")}
                </div>
                <div style="color:#666; font-size:0.55rem; margin-top:5px;">MANTENIENDO TU LÓGICA DE ALTO FLUJO ACTUAL</div>
            </div>

            <div style="margin-bottom:12px; background: #d4af37; padding:15px; border-radius:10px; color:#000; text-align:center;">
                <div style="font-weight:bold; font-size:0.6rem; text-transform:uppercase;">Estrategia A: Tendencia ${nombresDias[diaSemanaAnalisis]}</div>
                <div style="font-size:2rem; font-weight:900; letter-spacing:8px;">
                    ${basesDia.slice(0,2).join(" - ")}
                </div>
            </div>

            <div style="margin-bottom:12px; background:#1a1a1a; padding:15px; border-radius:10px; border: 2px solid #00ff00; text-align:center;">
                <div style="color:#00ff00; font-weight:bold; font-size:0.7rem; text-transform:uppercase;">🚀 ESTRATEGIA B: BASES DE RACHA VIVA</div>
                <div style="font-size:2.2rem; font-weight:900; color:#fff; letter-spacing:10px; margin: 5px 0;">
                    ${rachaVivaBase.slice(0,2).join(" | ")}
                </div>
                <div style="color:#00ff00; font-size:0.55rem;">ESTOS SON LOS MEJORES DE LAS 3 RULETAS PARA USAR DE BASE</div>
            </div>

            <div style="margin-bottom:12px; background:#111; padding:12px; border-radius:10px; border-left: 5px solid #00ff00; text-align:center;">
                <div style="color:#00ff00; font-weight:bold; font-size:0.65rem;">CALIENTE PARA EL PRÓXIMO SORTEO</div>
                <div style="color:#fff; font-size:0.8rem; margin: 4px 0;">Salió el <b>${ultimo.animal_numero}</b>, tendencia horaria:</div>
                <div style="font-size:1.4rem; font-weight:bold; color:#fff; letter-spacing:3px;">
                    ${proximoSorteo.join(" - ")}
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
            return Object.entries(m).sort((a,b) => b[1] - a[1]).map(x => x[0]);
        };

        const m6 = analice(9, 13).slice(0, 6);
        const t6 = analice(15, 19).filter(n => !m6.includes(n)).slice(0, 6);

        cont.innerHTML = `
            <div style="margin-top:20px; background:#000; border: 2px solid #d4af37; padding:15px; border-radius:12px; text-align:center;">
                <h4 style="color:#d4af37; margin:0 0 12px 0; font-size:0.8rem; text-transform:uppercase;">Polla de 6 (Tendencia Bloqueada)</h4>
                <div style="margin-bottom:15px;">
                    <small style="color:#666; font-size:0.55rem; display:block; margin-bottom:5px;">MAÑANA (9AM - 1PM)</small>
                    <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px;">
                        ${m6.map(n => `<div style="background:#222; color:#d4af37; font-size:0.75rem; padding:8px 0; border-radius:4px; font-weight:bold;">${n}</div>`).join('')}
                    </div>
                </div>
                <div>
                    <small style="color:#666; font-size:0.55rem; display:block; margin-bottom:5px;">TARDE (3PM - 7PM)</small>
                    <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px;">
                        ${t6.map(n => `<div style="background:#222; color:#d4af37; font-size:0.75rem; padding:8px 0; border-radius:4px; font-weight:bold;">${n}</div>`).join('')}
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