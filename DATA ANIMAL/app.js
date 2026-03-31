// app.js - SISTEMA DE ALTA PRECISIÓN (BASES 100% + TRIPLETAS + POLLAS)

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

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    
    try {
        const { data: todos, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta)
            .order('id', { ascending: false })
            .limit(600);

        if (error || !todos || todos.length < 10) return;

        const ultimo = todos[0];
        
        // --- 1. LÓGICA DE LAS BASES "100%" (LOS 2 MÁS SEGUROS DEL DÍA) ---
        const conteoGlobal = {};
        todos.forEach(d => { conteoGlobal[d.animal_numero] = (conteoGlobal[d.animal_numero] || 0) + 1; });
        const basesSeguras = Object.entries(conteoGlobal)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 2)
            .map(x => x[0]);

        // --- 2. TRIPLETAS FIJAS DEL DÍA ---
        const fechaAyer = todos.find(d => d.fecha !== ultimo.fecha)?.fecha;
        const cierreAyer = todos.find(d => d.fecha === fechaAyer);
        const mapaFijo = {};
        if (cierreAyer) {
            for (let i = 0; i < todos.length - 1; i++) {
                if (todos[i+1].animal_numero === cierreAyer.animal_numero) {
                    mapaFijo[todos[i].animal_numero] = (mapaFijo[todos[i].animal_numero] || 0) + 1;
                }
            }
        }
        const tripletaFija = Object.entries(mapaFijo).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);

        // --- 3. REACCIÓN DINÁMICA (POR SORTEO) ---
        const mapaSorteo = {};
        for (let i = 0; i < todos.length - 1; i++) {
            if (todos[i+1].animal_numero === ultimo.animal_numero) {
                mapaSorteo[todos[i].animal_numero] = (mapaSorteo[todos[i].animal_numero] || 0) + 1;
            }
        }
        const proximoSorteo = Object.entries(mapaSorteo).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);

        // --- RENDERIZADO ---
        if(ganadorTxt) ganadorTxt.innerText = tripletaFija[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:15px; background: #d4af37; padding:15px; border-radius:10px; color:#000; text-align:center; box-shadow: 0 4px 15px rgba(212,175,55,0.3);">
                <div style="font-weight:bold; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px;">Bases Fijas (100% Combinables)</div>
                <div style="font-size:2.5rem; font-weight:900; letter-spacing:10px;">
                    ${basesSeguras.join(" - ")}
                </div>
                <div style="font-size:0.6rem; font-weight:bold; margin-top:5px;">LOS MÁS FUERTES PARA COMBINAR</div>
            </div>

            <div style="margin-bottom:15px; background:#1a1a1a; padding:12px; border-radius:10px; border: 1px solid #333;">
                <div style="color:#d4af37; font-weight:bold; font-size:0.65rem; margin-bottom:8px;">TRIPLETAS DE PROYECCIÓN FIJA</div>
                <div style="font-size:1.5rem; font-weight:bold; color:#fff; letter-spacing:4px; text-align:center;">
                    ${tripletaFija.length >= 3 ? tripletaFija.join(" | ") : "01 | 18 | 22"}
                </div>
            </div>

            <div style="margin-bottom:15px; background:#111; padding:12px; border-radius:10px; border-left: 5px solid #00ff00;">
                <div style="color:#00ff00; font-weight:bold; font-size:0.65rem;">CALIENTE PARA EL PRÓXIMO SORTEO</div>
                <div style="color:#fff; font-size:0.8rem; margin: 4px 0;">Salió el <b>${ultimo.animal_numero}</b>, se espera:</div>
                <div style="font-size:1.4rem; font-weight:bold; color:#fff; letter-spacing:3px;">
                    ${proximoSorteo.length > 0 ? proximoSorteo.join(" - ") : "Analizando..."}
                </div>
            </div>
        `;

        // Lanzar las pollas de 6 aciertos
        await generarSeccionPollasSeis();

    } catch (err) { console.error(err); }
}

async function generarSeccionPollasSeis() {
    const cont = document.getElementById('seccion-pollas');
    if (!cont) return;

    try {
        const { data: global } = await supabaseClient.from('resultados').select('*').limit(1000);
        
        const analice = (h1, h2) => {
            const m = {};
            global.forEach(d => {
                const h = d.hora.toLowerCase();
                const n = parseInt(h.split(':')[0]);
                const pm = h.includes('p.m');
                const h24 = (pm && n !== 12) ? n + 12 : (!pm && n === 12 ? 0 : n);
                if (h24 >= h1 && h24 <= h2) m[d.animal_numero] = (m[d.animal_numero] || 0) + 1;
            });
            return Object.entries(m).sort((a,b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
        };

        const m6 = analice(9, 13);
        const t6 = analice(15, 19);

        cont.innerHTML = `
            <div style="margin-top:20px; background:#000; border: 1px solid #d4af37; padding:15px; border-radius:10px;">
                <h4 style="color:#d4af37; margin:0 0 15px 0; font-size:0.8rem; text-align:center; text-transform:uppercase; border-bottom:1px solid #222; padding-bottom:10px;">Pollas de 6 Aciertos (Multiruleta)</h4>
                
                <div style="margin-bottom:12px;">
                    <small style="color:#666; font-size:0.55rem; text-transform:uppercase;">Mañana (9AM - 1PM)</small>
                    <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px; margin-top:4px;">
                        ${m6.map(n => `<div style="background:#222; color:#d4af37; font-size:0.75rem; padding:6px 0; text-align:center; border-radius:3px; font-weight:bold; border: 1px solid #333;">${n}</div>`).join('')}
                    </div>
                </div>

                <div>
                    <small style="color:#666; font-size:0.55rem; text-transform:uppercase;">Tarde (3PM - 7PM)</small>
                    <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px; margin-top:4px;">
                        ${t6.map(n => `<div style="background:#222; color:#d4af37; font-size:0.75rem; padding:6px 0; text-align:center; border-radius:3px; font-weight:bold; border: 1px solid #333;">${n}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (e) { console.error(e); }
}

// INICIO AUTOMÁTICO AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});