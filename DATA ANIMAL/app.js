// app.js - VERSIÓN COMPLETA ANTI-ERRORES

function generarPiramide() {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = String(hoy.getFullYear());
    
    let base = dia + mes + anio;
    let filas = [base];
    
    while (base.length > 1) {
        let nuevaFila = "";
        for (let i = 0; i < base.length - 1; i++) {
            let suma = (parseInt(base[i]) + parseInt(base[i+1])) % 10;
            nuevaFila += suma;
        }
        filas.push(nuevaFila);
        base = nuevaFila;
    }
    
    const cont = document.getElementById('contenedor-piramide');
    if (cont) {
        cont.innerHTML = filas.map(f => `<div style="letter-spacing: 10px;">${f}</div>`).join('');
    }
}

async function obtenerEstadisticas(ruletaSeleccionada = "Lotto Activo") {
    const panel = document.getElementById('panel-inteligencia');
    const lista = document.getElementById('lista-frecuentes');
    
    if (panel) panel.innerHTML = "<p style='text-align:center;'>Buscando en la base de datos...</p>";
    
    try {
        // 1. Traemos TODOS los datos de Supabase sin filtros previos para evitar errores de caché
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            if (panel) panel.innerHTML = "La base de datos está totalmente vacía.";
            return;
        }

        // 2. FUNCIÓN MÁGICA DE LIMPIEZA: Quita espacios y pasa a minúsculas
        const limpiarParaComparar = (texto) => {
            return texto.toString().toLowerCase().replace(/\s+/g, '').trim();
        };

        const objetivo = limpiarParaComparar(ruletaSeleccionada);

        // 3. Filtrado manual ultra-seguro
        const dataFiltrada = data.filter(item => {
            return limpiarParaComparar(item.ruleta) === objetivo;
        });

        // Depuración: Esto te dirá en la consola del navegador cuántos encontró
        console.log("Ruleta buscada:", objetivo);
        console.log("Registros totales:", data.length);
        console.log("Registros encontrados para esta ruleta:", dataFiltrada.length);

        if (dataFiltrada.length === 0) {
            if (panel) panel.innerHTML = `<p style="color:#ffcc00; text-align:center;">No hay datos guardados para "${ruletaSeleccionada}".<br><small>Revisa que el nombre coincida en el Admin.</small></p>`;
            if (lista) lista.innerHTML = "";
            return;
        }

        // 4. --- PROCESAMIENTO DE ESTADÍSTICAS ---
        const conteo = {};
        dataFiltrada.forEach(d => {
            const key = `${d.animal_numero} ${d.animal_nombre}`.toUpperCase();
            conteo[key] = (conteo[key] || 0) + 1;
        });

        const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        const lider = ordenados[0][0];

        // Lógica de Tripleta (Correlación)
        const fechasLider = dataFiltrada
            .filter(d => `${d.animal_numero} ${d.animal_nombre}`.toUpperCase() === lider)
            .map(d => d.fecha);

        const companeros = {};
        dataFiltrada.forEach(d => {
            const idAnimal = d.animal_numero;
            if (fechasLider.includes(d.fecha) && idAnimal !== lider.split(" ")[0]) {
                companeros[idAnimal] = (companeros[idAnimal] || 0) + 1;
            }
        });
        
        const topCompaneros = Object.entries(companeros).sort((a,b) => b[1] - a[1]).slice(0, 2);
        const tripleta = [lider.split(" ")[0], ...topCompaneros.map(c => c[0])];

        // 5. --- RENDERIZADO ---
        if (panel) {
            panel.innerHTML = `
                <div class="destaque-tripleta">
                    <div style="font-size:0.7rem; font-weight:bold; text-transform:uppercase; opacity:0.8;">Análisis Predictivo</div>
                    <div class="numeros-tripleta">${tripleta.join(" - ")}</div>
                </div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <div class="mini-box">
                        <div style="font-size:0.6rem; color:var(--oro)">DATO MÁS FUERTE</div>
                        <div style="font-weight:bold;">${lider}</div>
                    </div>
                </div>
            `;
        }

        if (lista) {
            lista.innerHTML = ordenados.slice(0, 5).map(a => `
                <div class="fila-stats">
                    <span>${a[0]}</span>
                    <span style="color:var(--oro)">${a[1]} salidas</span>
                </div>
            `).join('');
        }

    } catch (err) {
        console.error("Error crítico en app.js:", err);
        if (panel) panel.innerHTML = `<p style="color:red">Error de conexión. Revisa Supabase.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas(); 
});