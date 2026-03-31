// app.js - SISTEMA VIP CON PREVISIÓN Y CENTRADO TOTAL

let diaOffset = 0; // 0 = Hoy, 1 = Mañana

function cambiarDia(nuevoOffset) {
    diaOffset = nuevoOffset;
    
    // Actualizar estilo de botones
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
    if(cont) cont.innerHTML = filas.map(f => `<div style="text-align:center;">${f}</div>`).join('');
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
        const fechaConsulta = new Date();
        if (diaOffset === 1) fechaConsulta.setDate(fechaConsulta.getDate() + 1);
        
        const diaSemana = fechaConsulta.getDay();
        const nombresDias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

        // --- ESTRATEGIA A: DÍA DE LA SEMANA (HISTÓRICO) ---
        const resultadosMismoDia = todos.filter(d => {
            const f = new Date(d.fecha + 'T12:00:00');
            return f.getDay() === diaSemana;
        });
        const conteoDia = {};
        resultadosMismoDia.forEach(d => { conteoDia[d.animal_numero] = (conteoDia[d.animal_numero] || 0) + 1; });
        const basesDia = Object.entries(conteoDia).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);

        // --- ESTRATEGIA B: LA RACHA (ÚLTIMOS 150) ---
        const conteoRacha = {};
        todos.slice(0, 150).forEach(d => { conteoRacha[d.animal_numero] = (conteoRacha[d.animal_numero] || 0) + 1; });
        const basesRacha = Object.entries(conteoRacha).sort((a,b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);

        // --- ESTRATEGIA C: LOS FRÍOS ---
        const recientes = new Set(todos.slice(0, 100).map(d => d.animal_numero));
        const conteoGlobal = {};
        todos.forEach(d => { conteoGlobal[d.animal_numero] = (conteoGlobal[d.animal_numero] || 0) + 1; });
        const frios = Object.entries(conteoGlobal)
            .filter(x => !recientes.has(x[0]))
            .sort((a,b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);

        // --- RENDERIZADO DEL PANEL ---
        if(ganadorTxt) ganadorTxt.innerText = basesDia[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:15px; background: #000; border: 2px solid #ffcc00; padding:15px; border-radius:12px; text-align:center;">
                <div style="color:#ffcc00; font-weight:bold; font-size:0.7rem; text-transform:uppercase; margin-bottom:5px;">👑 TRIPLETA VIP ${nombresDias[diaSemana]}</div>
                <div style="font-size:1.8rem; font-weight:900; color:#fff; letter-spacing:5px;">
                    ${basesDia.slice(0,3).join(" | ")}
                </div>
                <div style="color:#666; font-size:0.55rem; margin-top:5px;">ANÁLISIS EXCLUSIVO POR HISTORIAL DE DÍA</div>
            </div>

            <div style="margin-bottom:12px; background: #d4af37; padding:12px; border-radius:10px; color:#000; text-align:center;">
                <div style="font-weight:bold; font-size:0.6rem; text-transform:uppercase;">Estrategia A: Especial ${nombresDias[diaSemana]}</div>
                <div style="font-size:1.6rem; font-weight:900; letter-spacing:5px;">${basesDia.slice(0,2).join(" - ")}</div>
            </div>

            <div style="margin-bottom:12px; background:#1a1a1a; padding:12px; border-radius:10px; border: 1px solid #00ff00; text-align:center;">
                <div style="color:#00ff00; font-weight:bold; font-size:0.6rem; text-transform:uppercase;">Estrategia B: Racha de la Semana</div>
                <div style="font-size:1.6rem; font-weight:bold; color:#fff; letter-spacing:5px;">${basesRacha.join(" - ")}</div>
            </div>

            <div style="margin-bottom:12px; background:#1a1a1a; padding:12px; border-radius:10px; border: 1px solid #ff4444; text-align:center;">
                <div style="color:#ff4444; font-weight:bold; font-size:0.6rem; text-transform:uppercase;">Estrategia C: Fríos Pendientes</div>
                <div style="font-size:1.6rem; font-weight:bold; color:#fff; letter-spacing:5px;">${frios.join(" - ")}</div>
            </div>
        `;

        await generarSeccionPollasSeis(diaSemana);

    } catch (err) { console.error(err); }
}

async function generarSeccionPollasSeis(diaSemana) {
    const cont = document.getElementById('seccion-pollas');
    if (!cont) return;

    try {
        const { data: global } = await supabaseClient.from('resultados').select('*').limit(1000);
        
        const analice = (h1, h2) => {
            const m = {};
            global.forEach(d => {
                const f = new Date(d.fecha + 'T12:00:00');
                if (f.getDay() === diaSemana) {
                    const h = d.hora.toLowerCase();
                    const n = parseInt(h.split(':')[0]);
                    const pm = h.includes('p.m');
                    const h24 = (pm && n !== 12) ? n + 12 : (!pm && n === 12 ? 0 : n);
                    if (h24 >= h1 && h24 <= h2) m[d.animal_numero] = (m[d.animal_numero] || 0) + 1;
                }
            });
            return Object.entries(m).sort((a,b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
        };

        const m6 = analice(9, 13);
        const t6 = analice(15, 19);

        cont.innerHTML = `
            <div style="margin-top:20px; background:#000; border: 2px solid #d4af37; padding:15px; border-radius:12px; text-align:center;">
                <h4 style="color:#d4af37; margin:0 0 12px 0; font-size:0.75rem; text-transform:uppercase; border-bottom:1px solid #222; padding-bottom:8px;">Polla de 6 (Historial del Día)</h4>
                
                <div style="margin-bottom:15px;">
                    <small style="color:#666; font-size:0.55rem; display:block; margin-bottom:5px;">MAÑANA (9AM - 1PM)</small>
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:5px;">
                        ${m6.map(n => `<div style="background:#222; color:#d4af37; font-size:0.8rem; padding:6px; border-radius:4px; font-weight:bold; border: 1px solid #333;">${n}</div>`).join('')}
                    </div>
                </div>

                <div>
                    <small style="color:#666; font-size:0.55rem; display:block; margin-bottom:5px;">TARDE (3PM - 7PM)</small>
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:5px;">
                        ${t6.map(n => `<div style="background:#222; color:#d4af37; font-size:0.8rem; padding:6px; border-radius:4px; font-weight:bold; border: 1px solid #333;">${n}</div>`).join('')}
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