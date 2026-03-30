// app.js - MOTOR DE INTELIGENCIA PROACTIVA

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
        // 1. Obtener TODO el historial de esa ruleta
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta)
            .order('fecha', { ascending: false });

        if (error || !data || data.length < 5) {
            listado.innerHTML = "Historial insuficiente para análisis avanzado.";
            return;
        }

        const hoy = new Date();
        const diasSemana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
        const diaActualNombre = diasSemana[hoy.getDay()];
        const horaActual = hoy.getHours();

        // --- LÓGICA 1: FILTRO POR DÍA DE LA SEMANA ---
        // Buscamos qué animales salen más los días como hoy
        const historialDia = data.filter(d => {
            const fechaD = new Date(d.fecha + "T00:00:00");
            return diasSemana[fechaD.getDay()] === diaActualNombre;
        });

        // --- LÓGICA 2: FILTRO POR CERCANÍA DE HORA ---
        // Analiza sorteos realizados en un rango de +/- 2 horas a la actual
        const historialHora = data.filter(d => {
            const hSorteo = parseInt(d.hora.split(":")[0]);
            return Math.abs(hSorteo - horaActual) <= 2;
        });

        // --- LÓGICA 3: ANÁLISIS DE SECUENCIA (EL "LLAMADO") ---
        // Miramos el último animal que salió y vemos qué salió después de él en el pasado
        const ultimoResultado = data[0];
        const animalesSeguidores = [];
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i+1].animal_numero === ultimoResultado.animal_numero) {
                animalesSeguidores.push(data[i].animal_numero);
            }
        }

        // --- PROCESAMIENTO FINAL (PONDERACIÓN) ---
        const pesos = {};
        
        // Dar puntos por salir el mismo día de la semana
        historialDia.forEach(d => { pesos[d.animal_numero] = (pesos[d.animal_numero] || 0) + 1.5; });
        
        // Dar puntos por salir a esta hora
        historialHora.forEach(d => { pesos[d.animal_numero] = (pesos[d.animal_numero] || 0) + 2; });
        
        // Dar puntos extra si es un seguidor histórico del último resultado
        animalesSeguidores.forEach(num => { pesos[num] = (pesos[num] || 0) + 3; });

        // Ordenar resultados por "Probabilidad"
        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);

        // --- RENDERIZADO DE RESULTADOS ---
        
        // 1. El Fijo del Día (El que tiene más peso acumulado)
        ganadorTxt.innerText = sugeridos[0] ? sugeridos[0][0] : "---";

        // 2. Tripleta de Oro (Los 3 con mejor secuencia y contexto)
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);
        
        // 3. Mostrar el Top 5 con su nivel de confianza
        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#222; padding:10px; border-radius:8px; border-left:4px solid var(--oro)">
                <small style="color:var(--oro)">TRIPLETA RECOMENDADA</small>
                <div style="font-size:1.5rem; font-weight:bold; letter-spacing:3px;">${tripleta.join(" - ")}</div>
            </div>
            <p style="font-size:0.7rem; color:var(--gris)">Análisis basado en: Día ${diaActualNombre} + Hora Actual + Secuencia tras el ${ultimoResultado.animal_numero}</p>
        `;

        listado.innerHTML += sugeridos.slice(0, 5).map(a => {
            const animalData = data.find(d => d.animal_numero === a[0]);
            return `
                <div class="fila-stats">
                    <span>${a[0]} ${animalData ? animalData.animal_nombre : ''}</span>
                    <span style="color:var(--oro)">${Math.floor(a[1] * 10)}% Prob.</span>
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