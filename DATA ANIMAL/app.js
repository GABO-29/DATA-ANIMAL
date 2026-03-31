// app.js - MOTOR DE INTELIGENCIA PREDICTIVA (Día Anterior + Bloques de Horario)

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    
    try {
        // Traemos los últimos 300 resultados para tener buena base de datos
        const { data: todos, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta)
            .order('id', { ascending: false })
            .limit(300);

        if (error || !todos || todos.length < 5) return;

        const ultimo = todos[0]; // El de hace minutos
        const fechaUltimo = ultimo.fecha;

        // 1. OBTENER EL ÚLTIMO DEL DÍA ANTERIOR
        // Filtramos todos los que NO sean de la fecha del último para hallar el cierre previo
        const dataDiaAnterior = todos.filter(d => d.fecha !== fechaUltimo);
        const cierreAnterior = dataDiaAnterior.length > 0 ? dataDiaAnterior[0] : null;

        // --- CÁLCULO DE PROBABILIDADES ---
        const pesos = {};

        // A. Lógica de Seguidores (¿Qué sale después de X?) -> Peso: 5
        for (let i = 0; i < todos.length - 1; i++) {
            if (todos[i+1].animal_numero === ultimo.animal_numero) {
                let num = todos[i].animal_numero;
                pesos[num] = (pesos[num] || 0) + 5;
            }
        }

        // B. Lógica del Cierre Anterior (Si el cierre ayer fue X, hoy suele salir Y) -> Peso: 3
        if (cierreAnterior) {
            todos.forEach((d, index) => {
                if (index < todos.length - 1 && todos[index+1].animal_numero === cierreAnterior.animal_numero) {
                    let num = d.animal_numero;
                    pesos[num] = (pesos[num] || 0) + 3;
                }
            });
        }

        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);

        // --- RENDERIZADO PRINCIPAL ---
        if(ganadorTxt) ganadorTxt.innerText = tripleta[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#1a1a1a; padding:15px; border-radius:10px; border: 2px solid #d4af37;">
                <div style="color:#d4af37; font-weight:bold; font-size:0.7rem;">PRÓXIMO SORTEO (PROYECCIÓN)</div>
                <div style="font-size:2rem; font-weight:900; letter-spacing:3px;">${tripleta.join(" - ")}</div>
                <small style="color:#666;">Basado en último: ${ultimo.animal_numero} y cierre anterior: ${cierreAnterior ? cierreAnterior.animal_numero : 'N/A'}</small>
            </div>
        `;

        // --- SECCIÓN DE QUINIELAS / POLLAS (BLOQUES HORARIOS) ---
        await generarSeccionPollas();

    } catch (err) { console.error(err); }
}

async function generarSeccionPollas() {
    const contenedorPollas = document.getElementById('seccion-pollas'); // Asegúrate de tener este ID en tu HTML
    if (!contenedorPollas) return;

    try {
        const { data: global } = await supabaseClient.from('resultados').select('*').limit(500);
        
        const filtrarBloque = (inicio, fin) => {
            const mapa = {};
            global.forEach(d => {
                const horaNum = parseInt(d.hora.split(':')[0]);
                const esPM = d.hora.toLowerCase().includes('p.m');
                const hora24 = (esPM && horaNum !== 12) ? horaNum + 12 : (!esPM && horaNum === 12 ? 0 : horaNum);
                
                if (hora24 >= inicio && hora24 <= fin) {
                    mapa[d.animal_numero] = (mapa[d.animal_numero] || 0) + 1;
                }
            });
            return Object.entries(mapa).sort((a,b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
        };

        const mañana = filtrarBloque(9, 13);
        const tarde = filtrarBloque(15, 19);

        contenedorPollas.innerHTML = `
            <div style="margin-top:20px; background:#111; padding:15px; border-radius:10px; border-top: 4px solid #d4af37;">
                <h4 style="color:#d4af37; margin-top:0;">DAtOS PARA POLLAS / QUINIELAS</h4>
                
                <div style="margin-bottom:15px;">
                    <div style="color:#fff; font-size:0.8rem; margin-bottom:5px;">☀️ BLOQUE MAÑANA (9AM - 1PM)</div>
                    <div style="background:#222; padding:8px; border-radius:5px; font-weight:bold; color:var(--oro); letter-spacing:2px;">
                        ${mañana.join(" - ")}
                    </div>
                </div>

                <div>
                    <div style="color:#fff; font-size:0.8rem; margin-bottom:5px;">🌙 BLOQUE TARDE (3PM - 7PM)</div>
                    <div style="background:#222; padding:8px; border-radius:5px; font-weight:bold; color:var(--oro); letter-spacing:2px;">
                        ${tarde.join(" - ")}
                    </div>
                </div>
            </div>
        `;
    } catch (e) { console.error(e); }
}