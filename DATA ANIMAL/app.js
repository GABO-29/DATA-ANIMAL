// app.js - MOTOR DE INTELIGENCIA PROACTIVA (VERSIÓN CORREGIDA)

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
    listado.innerHTML = "<div class='loading'>Escaneando secuencias históricas...</div>";
    
    try {
        // 1. OBTENER HISTORIAL CON DOBLE ORDENAMIENTO ESTRICTO
        // Ordenamos por fecha DESC y luego por hora DESC para que data[0] sea el último sorteo real
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta)
            .order('fecha', { ascending: false })
            .order('hora', { ascending: false });

        if (error || !data || data.length < 2) {
            listado.innerHTML = "Historial insuficiente para análisis avanzado.";
            if(ganadorTxt) ganadorTxt.innerText = "---";
            return;
        }

        const hoy = new Date();
        const diasSemana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
        const diaActualNombre = diasSemana[hoy.getDay()];
        const horaActual = hoy.getHours();

        // --- EL ÚLTIMO RESULTADO REAL ---
        // Al estar ordenado DESC, el índice 0 es el último que salió (Ej: el 18 que mencionaste)
        const ultimoResultado = data[0];

        // --- LÓGICA 1: FILTRO POR DÍA DE LA SEMANA ---
        const historialDia = data.filter(d => {
            const fechaD = new Date(d.fecha + "T00:00:00");
            return diasSemana[fechaD.getDay()] === diaActualNombre;
        });

        // --- LÓGICA 2: FILTRO POR CERCANÍA DE HORA ---
        const historialHora = data.filter(d => {
            const hSorteo = parseInt(d.hora.split(":")[0]);
            // Ajuste para formato p.m.
            let horaNum = hSorteo;
            if(d.hora.toLowerCase().includes("p.m.") && hSorteo !== 12) horaNum += 12;
            if(d.hora.toLowerCase().includes("a.m.") && hSorteo === 12) horaNum = 0;
            
            return Math.abs(horaNum - horaActual) <= 2;
        });

        // --- LÓGICA 3: ANÁLISIS DE SECUENCIA (EL "LLAMADO") ---
        // Buscamos qué salió DESPUÉS del último resultado en el pasado
        const animalesSeguidores = [];
        for (let i = 0; i < data.length - 1; i++) {
            // Si el animal que salió ANTES en el tiempo (i+1) es el mismo que el actual...
            // el animal que salió DESPUÉS (i) es el seguidor.
            if (data[i+1].animal_numero === ultimoResultado.animal_numero) {
                animalesSeguidores.push(data[i].animal_numero);
            }
        }

        // --- PROCESAMIENTO FINAL (PONDERACIÓN) ---
        const pesos = {};
        
        // Peso por salir el mismo día (1.5)
        historialDia.forEach(d => { pesos[d.animal_numero] = (pesos[d.animal_numero] || 0) + 1.5; });
        
        // Peso por salir a horas similares (2.0)
        historialHora.forEach(d => { pesos[d.animal_numero] = (pesos[d.animal_numero] || 0) + 2.0; });
        
        // Peso por ser seguidor histórico (3.5) - Subimos el peso para que mande la secuencia
        animalesSeguidores.forEach(num => { pesos[num] = (pesos[num] || 0) + 3.5; });

        // Ordenar resultados por Probabilidad
        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);

        // --- RENDERIZADO DE RESULTADOS ---
        
        // 1. El Fijo del Día
        if(ganadorTxt) ganadorTxt.innerText = sugeridos[0] ? sugeridos[0][0] : "---";

        // 2. Tripleta de Oro
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);
        
        // 3. Mostrar Panel
        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#222; padding:15px; border-radius:8px; border-left:4px solid var(--oro)">
                <small style="color:var(--oro); font-weight:bold; text-transform:uppercase;">Tripleta Sugerida</small>
                <div style="font-size:1.8rem; font-weight:900; letter-spacing:5px; margin-top:5px;">${tripleta.length > 0 ? tripleta.join(" - ") : "00 - 00 - 00"}</div>
            </div>
            <p style="font-size:0.75rem; color:#aaa; margin-bottom:15px; line-height:1.4;">
                <span style="color:var(--oro)">Analizando:</span> Día ${diaActualNombre}<br>
                <span style="color:var(--oro)">Secuencia tras el:</span> ${ultimoResultado.animal_numero} ${ultimoResultado.animal_nombre}
            </p>
        `;

        listado.innerHTML += sugeridos.slice(0, 5).map(a => {
            // Buscamos el nombre del animal en la data para mostrarlo
            const animalData = data.find(d => d.animal_numero === a[0]);
            const nombre = animalData ? animalData.animal_nombre : "ANIMAL";
            const porcentaje = Math.min(Math.floor(a[1] * 12), 99); // Cálculo visual de probabilidad

            return `
                <div class="fila-stats" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #222;">
                    <span style="font-weight:bold;">${a[0]} ${nombre}</span>
                    <span style="color:var(--oro); font-weight:bold;">${porcentaje}%</span>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        listado.innerHTML = "Error en el motor de probabilidad.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});