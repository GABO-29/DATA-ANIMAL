// app.js - SISTEMA DE ALTA PRECISIÓN (TRIPLETA FIJA + POLLAS REACTIVAS)
// VERSIÓN: ESTRATEGIA DE BLOQUES DISPARADOS POR HORARIO REAL

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

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    
    try {
        // Traemos 3000 registros para tener suficiente peso estadístico histórico
        const { data: todos, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .order('id', { ascending: false })
            .limit(3000);

        if (error || !todos || todos.length < 20) return;

        // 1. FILTRAR POR RULETA ACTUAL PARA LA TRIPLETA Y FIJOS
        const datosRuleta = todos.filter(d => d.ruleta === ruleta);
        const ultimo = datosRuleta[0];
        
        const fechaAnalisis = new Date();
        if (diaOffset === 1) fechaAnalisis.setDate(fechaAnalisis.getDate() + 1);
        const diaSemanaAnalisis = fechaAnalisis.getDay();
        const nombresDias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

        // --- ESTRATEGIA 1: TRIPLETA GANADORA DEL DÍA (FIJA) ---
        // Basada en los animales que más salen este día de la semana en esta ruleta
        const resultadosDia = datosRuleta.filter(d => {
            const f = new Date(d.fecha + 'T12:00:00');
            return f.getDay() === diaSemanaAnalisis;
        });
        
        const conteoDia = {};
        resultadosDia.forEach(d => { conteoDia[d.animal_numero] = (conteoDia[d.animal_numero] || 0) + 1; });
        const favoritosDia = Object.entries(conteoDia).sort((a,b) => b[1] - a[1]).map(x => x[0]);

        let tripletaVip = [];
        tripletaVip.push(favoritosDia[0] || "05");
        tripletaVip.push(favoritosDia.find(n => !tripletaVip.includes(n)) || "14");
        tripletaVip.push(favoritosDia.find(n => !tripletaVip.includes(n)) || "22");

        // --- ESTRATEGIA 2: FIJOS PRÓXIMO SORTEO (CRUCE MAESTRO) ---
        // Cruce: Ruleta + Día + Animal que salió
        const mapaCruce = {};
        for (let i = 0; i < datosRuleta.length - 1; i++) {
            if (datosRuleta[i+1].animal_numero === ultimo.animal_numero) {
                const fHist = new Date(datosRuleta[i+1].fecha + 'T12:00:00');
                if (fHist.getDay() === diaSemanaAnalisis) {
                    mapaCruce[datosRuleta[i].animal_numero] = (mapaCruce[datosRuleta[i].animal_numero] || 0) + 1;
                }
            }
        }
        let fijosProximos = Object.entries(mapaCruce)
            .filter(x => x[0] !== ultimo.animal_numero)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 2)
            .map(x => x[0]);

        // Relleno si no hay suficiente historia
        if (fijosProximos.length < 2) {
            fijosProximos = favoritosDia.filter(n => n !== ultimo.animal_numero).slice(1, 3);
        }

        // --- RENDERIZADO DEL DASHBOARD ---
        if(ganadorTxt) ganadorTxt.innerText = tripletaVip[0];

        listado.innerHTML = `
            <div style="margin-bottom:15px; background: linear-gradient(145deg, #111, #000); border: 2px solid #00ff00; padding:15px; border-radius:12px; text-align:center; box-shadow: 0 0 15px rgba(0,255,0,0.2);">
                <div style="color:#00ff00; font-weight:bold; font-size:0.7rem; text-transform:uppercase; margin-bottom:5px;">🔥 FIJOS PRÓXIMO SORTEO</div>
                <div style="font-size:2.5rem; font-weight:900; color:#fff; letter-spacing:10px;">
                    ${fijosProximos.join(" - ")}
                </div>
                <div style="color:#666; font-size:0.55rem; margin-top:5px;">${ruleta.toUpperCase()} | TRAS EL RESULTADO ${ultimo.animal_numero}</div>
            </div>

            <div style="margin-bottom:15px; background: #000; border: 2px solid #ffcc00; padding:15px; border-radius:12px; text-align:center;">
                <div style="color:#ffcc00; font-weight:bold; font-size:0.7rem; text-transform:uppercase; margin-bottom:5px;">👑 TRIPLETA GANADORA (TODO EL DÍA)</div>
                <div style="font-size:2.2rem; font-weight:900; color:#fff; letter-spacing:5px;">
                    ${tripletaVip.join(" | ")}
                </div>
                <div style="color:#666; font-size:0.55rem; margin-top:5px;">${nombresDias[diaSemanaAnalisis]} - ALTA PROBABILIDAD DE 8AM A 7PM</div>
            </div>
        `;

        // Llamamos a las pollas reactivas enviando toda la data global
        await generarSeccionPollasSeis(todos, diaSemanaAnalisis);

    } catch (err) { console.error(err); }
}

async function generarSeccionPollasSeis(todos, diaSemana) {
    const cont = document.getElementById('seccion-pollas');
    if (!cont) return;

    // Obtener fecha de hoy para validar si el sorteo disparador ya ocurrió
    const hoyStr = new Date().toISOString().split('T')[0];

    // Buscamos resultados de las 8:00 AM y 2:00 PM cargados HOY
    const sorteo8am = todos.find(d => d.fecha === hoyStr && (d.hora.includes('8:00') || d.hora.includes('08:00')));
    const sorteo2pm = todos.find(d => d.fecha === hoyStr && (d.hora.includes('2:00') || d.hora.includes('14:00')));

    const analiceHorario = (h1, h2) => {
        const m = {};
        // Filtramos por día de la semana y rango de horas cruzando las 3 ruletas
        todos.forEach(d => {
            const f = new Date(d.fecha + 'T12:00:00');
            if (f.getDay() === diaSemana) {
                const hStr = d.hora.toLowerCase();
                const n = parseInt(hStr.split(':')[0]);
                const pm = hStr.includes('p.m');
                const h24 = (pm && n !== 12) ? n + 12 : (!pm && n === 12 ? 0 : n);
                
                if (h24 >= h1 && h24 <= h2) {
                    m[d.animal_numero] = (m[d.animal_numero] || 0) + 1;
                }
            }
        });
        return Object.entries(m).sort((a,b) => b[1] - a[1]).map(x => x[0]);
    };

    let htmlPollas = `
        <div style="margin-top:20px; background:#000; border: 2px solid #d4af37; padding:15px; border-radius:12px; text-align:center;">
            <h4 style="color:#d4af37; margin:0 0 12px 0; font-size:0.8rem; text-transform:uppercase; border-bottom:1px solid #222; padding-bottom:8px;">Pollas Especiales (Combinado Global)</h4>
    `;

    // BLOQUE MAÑANA (Reactivo a las 8:00 AM)
    if (sorteo8am || diaOffset === 1) {
        const m6 = analiceHorario(9, 13).slice(0, 6);
        htmlPollas += `
            <div style="margin-bottom:15px;">
                <small style="color:#00ff00; font-size:0.55rem; text-transform:uppercase; display:block; margin-bottom:5px;">POLLA MAÑANA (9AM - 1PM)</small>
                <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px;">
                    ${m6.map(n => `<div style="background:#222; color:#fff; font-size:0.75rem; padding:8px 0; border-radius:4px; font-weight:bold; border: 1px solid #00ff00;">${n}</div>`).join('')}
                </div>
                ${sorteo8am ? `<small style="color:#666; font-size:0.45rem;">Disparada por el resultado ${sorteo8am.animal_numero} de las 8am</small>` : ''}
            </div>
        `;
    } else {
        htmlPollas += `
            <div style="margin-bottom:15px; border: 1px dashed #444; padding: 15px; border-radius: 8px;">
                <small style="color:#888; font-size:0.6rem; text-transform:uppercase;">Esperando sorteo de las 8:00 AM para activar Polla Mañana</small>
            </div>
        `;
    }

    // BLOQUE TARDE (Reactivo a las 2:00 PM)
    if (sorteo2pm || diaOffset === 1) {
        const t6 = analiceHorario(15, 19).slice(0, 6);
        htmlPollas += `
            <div>
                <small style="color:#ffcc00; font-size:0.55rem; text-transform:uppercase; display:block; margin-bottom:5px;">POLLA TARDE (3PM - 7PM)</small>
                <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px;">
                    ${t6.map(n => `<div style="background:#222; color:#fff; font-size:0.75rem; padding:8px 0; border-radius:4px; font-weight:bold; border: 1px solid #ffcc00;">${n}</div>`).join('')}
                </div>
                ${sorteo2pm ? `<small style="color:#666; font-size:0.45rem;">Disparada por el resultado ${sorteo2pm.animal_numero} de las 2pm</small>` : ''}
            </div>
        `;
    } else {
        htmlPollas += `
            <div style="border: 1px dashed #444; padding: 15px; border-radius: 8px;">
                <small style="color:#888; font-size:0.6rem; text-transform:uppercase;">Esperando sorteo de las 2:00 PM para activar Polla Tarde</small>
            </div>
        `;
    }

    htmlPollas += `</div>`;
    cont.innerHTML = htmlPollas;
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});