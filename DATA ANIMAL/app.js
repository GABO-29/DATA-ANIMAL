// app.js - MOTOR PREDICTIVO CON SALTO DE DÍA AUTOMÁTICO

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
            .limit(400);

        if (error || !todos || todos.length < 5) return;

        const ultimo = todos[0];
        
        // 1. LÓGICA DE SALTO DE DÍA AUTOMÁTICO
        // Si el último sorteo fue a las 7pm, el sistema se prepara para el día siguiente
        const esCierre = ultimo.hora.includes("07:00 p.m.");
        let tituloSeccion = esCierre ? "PROYECCIÓN PARA MAÑANA" : "MEJOR PROYECCIÓN DEL DÍA";

        // 2. IDENTIFICAR CIERRE ANTERIOR PARA LA ESTRATEGIA
        const fechaReferencia = ultimo.fecha;
        const dataHistorica = todos.filter(d => d.fecha !== fechaReferencia);
        const cierreAnterior = dataHistorica.length > 0 ? dataHistorica[0] : null;

        // 3. CÁLCULO DE PROBABILIDADES (PROYECCIÓN)
        const pesos = {};
        
        // A. Por Repetición de Secuencia (Peso: 6)
        for (let i = 0; i < todos.length - 1; i++) {
            if (todos[i+1].animal_numero === ultimo.animal_numero) {
                let num = todos[i].animal_numero;
                pesos[num] = (pesos[num] || 0) + 6;
            }
        }

        // B. Por Cierre de Día Anterior (Peso: 4)
        if (cierreAnterior) {
            todos.forEach((d, idx) => {
                if (idx < todos.length - 1 && todos[idx+1].animal_numero === cierreAnterior.animal_numero) {
                    pesos[d.animal_numero] = (pesos[d.animal_numero] || 0) + 4;
                }
            });
        }

        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);

        // --- RENDERIZADO DE PROYECCIONES ---
        if(ganadorTxt) ganadorTxt.innerText = tripleta[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#1a1a1a; padding:15px; border-radius:10px; border: 2px solid #d4af37;">
                <div style="color:#d4af37; font-weight:bold; font-size:0.75rem;">${tituloSeccion}</div>
                <div style="font-size:2rem; font-weight:900; letter-spacing:3px; color:#fff;">${tripleta.join(" - ")}</div>
                <div style="font-size:0.7rem; color:#888; margin-top:5px;">
                    Basado en: ${ultimo.animal_numero} (${ultimo.hora}) ${esCierre ? ' -> Salto a Mañana activo' : ''}
                </div>
            </div>
        `;

        // 4. TOP 5 DEL DÍA (LO QUE YA HACÍAS)
        listado.innerHTML += `<div style="font-size:0.8rem; color:var(--oro); margin-bottom:10px; font-weight:bold;">TOP PROBABILIDADES:</div>`;
        listado.innerHTML += sugeridos.slice(0, 5).map(a => {
            const anim = todos.find(d => d.animal_numero === a[0]);
            return `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #222;">
                    <span><b style="color:#d4af37;">${a[0]}</b> ${anim ? anim.animal_nombre : ''}</span>
                    <span style="font-weight:bold; color:#fff;">${Math.min(a[1] * 8, 99)}%</span>
                </div>
            `;
        }).join('');

        // 5. GENERAR QUINIELAS GLOBAL
        await generarSeccionPollas();

    } catch (err) { console.error(err); }
}

async function generarSeccionPollas() {
    const contenedorPollas = document.getElementById('seccion-pollas');
    if (!contenedorPollas) return;

    try {
        const { data: global } = await supabaseClient.from('resultados').select('*').limit(600);
        
        const filtrarBloque = (inicio, fin) => {
            const mapa = {};
            global.forEach(d => {
                const h = d.hora.toLowerCase();
                const horaNum = parseInt(h.split(':')[0]);
                const esPM = h.includes('p.m');
                const h24 = (esPM && horaNum !== 12) ? horaNum + 12 : (!esPM && horaNum === 12 ? 0 : horaNum);
                
                if (h24 >= inicio && h24 <= fin) {
                    mapa[d.animal_numero] = (mapa[d.animal_numero] || 0) + 1;
                }
            });
            return Object.entries(mapa).sort((a,b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
        };

        const mañana = filtrarBloque(8, 13);
        const tarde = filtrarBloque(15, 19);

        contenedorPollas.innerHTML = `
            <div style="margin-top:20px; background:#111; padding:15px; border-radius:10px; border: 1px solid #333;">
                <h4 style="color:#d4af37; margin: 0 0 15px 0; font-size:0.9rem; text-align:center;">DATOS PARA POLLAS (GLOBAL)</h4>
                
                <div style="margin-bottom:15px;">
                    <div style="color:#aaa; font-size:0.7rem; margin-bottom:5px;">☀️ BLOQUE 09:00 AM - 01:00 PM</div>
                    <div style="background:#222; padding:10px; border-radius:5px; font-weight:bold; color:#d4af37; text-align:center; letter-spacing:1px;">
                        ${mañana.join(" - ")}
                    </div>
                </div>

                <div>
                    <div style="color:#aaa; font-size:0.7rem; margin-bottom:5px;">🌙 BLOQUE 03:00 PM - 07:00 PM</div>
                    <div style="background:#222; padding:10px; border-radius:5px; font-weight:bold; color:#d4af37; text-align:center; letter-spacing:1px;">
                        ${tarde.join(" - ")}
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