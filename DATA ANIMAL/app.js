// Generador de Pirámide basada en la fecha actual
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

// Función Maestra de Estadísticas
async function obtenerEstadisticas(ruletaSeleccionada = "Lotto Activo") {
    const panel = document.getElementById('panel-inteligencia');
    const lista = document.getElementById('lista-frecuentes');
    
    if (panel) panel.innerHTML = "Analizando base de datos...";
    
    try {
        // Consultamos TODO para evitar errores de cache de Supabase
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            if (panel) panel.innerHTML = "Base de datos vacía.";
            return;
        }

        // NORMALIZACIÓN: Quitamos espacios y pasamos a minúsculas para comparar
        const limpiar = (txt) => txt.toString().toLowerCase().replace(/\s+/g, '').trim();
        const objetivo = limpiar(ruletaSeleccionada);

        const dataFiltrada = data.filter(d => limpiar(d.ruleta) === objetivo);

        if (dataFiltrada.length === 0) {
            if (panel) panel.innerHTML = `<p style="color:#ffcc00">Sin datos registrados para ${ruletaSeleccionada}.</p>`;
            if (lista) lista.innerHTML = "";
            return;
        }

        // --- CÁLCULO DE FRECUENCIAS ---
        const conteo = {};
        dataFiltrada.forEach(d => {
            const key = `${d.animal_numero} ${d.animal_nombre}`.toUpperCase();
            conteo[key] = (conteo[key] || 0) + 1;
        });

        const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        const lider = ordenados[0][0];

        // --- CÁLCULO DE TRIPLETA (Basada en el animal que más sale) ---
        const fechasLider = dataFiltrada
            .filter(d => `${d.animal_numero} ${d.animal_nombre}`.toUpperCase() === lider)
            .map(d => d.fecha);

        const companeros = {};
        dataFiltrada.forEach(d => {
            if (fechasLider.includes(d.fecha) && `${d.animal_numero} ${d.animal_nombre}`.toUpperCase() !== lider) {
                companeros[d.animal_numero] = (companeros[d.animal_numero] || 0) + 1;
            }
        });
        
        const topCompaneros = Object.entries(companeros).sort((a,b) => b[1] - a[1]).slice(0, 2);
        const tripleta = [lider.split(" ")[0]];
        topCompaneros.forEach(c => tripleta.push(c[0]));

        // --- RENDERIZADO EN PANTALLA ---
        if (panel) {
            panel.innerHTML = `
                <div class="destaque-tripleta">
                    <div style="font-size:0.7rem; font-weight:bold;">TRIPLETA RECOMENDADA</div>
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
                    <span style="color:var(--oro)">${a[1]} veces</span>
                </div>
            `).join('');
        }

    } catch (err) {
        console.error(err);
        if (panel) panel.innerHTML = `<p style="color:red">Error de conexión con la nube.</p>`;
    }
}

// Carga Inicial
document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas(); // Carga Lotto Activo por defecto
});