// Generador de Pirámide
function generarPiramide() {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = String(hoy.getFullYear());
    let base = dia + mes + anio;
    let filas = [base];
    while (base.length > 1) {
        let nueva = "";
        for (let i = 0; i < base.length - 1; i++) {
            nueva += (parseInt(base[i]) + parseInt(base[i+1])) % 10;
        }
        filas.push(nueva);
        base = nueva;
    }
    const cont = document.getElementById('contenedor-piramide');
    if (cont) cont.innerHTML = filas.map(f => `<div style="letter-spacing:10px;">${f}</div>`).join('');
}

// Función Maestra con Filtro Inteligente
async function obtenerEstadisticas(ruletaSeleccionada = "Lotto Activo") {
    const panel = document.getElementById('panel-inteligencia');
    const lista = document.getElementById('lista-frecuentes');
    
    if (panel) panel.innerHTML = "Analizando datos...";
    
    try {
        const { data, error } = await supabaseClient.from('resultados').select('*');
        if (error) throw error;

        if (!data || data.length === 0) {
            if (panel) panel.innerHTML = "Base de datos vacía.";
            return;
        }

        // NORMALIZACIÓN: Quitamos espacios y pasamos a minúsculas
        const limpiar = (t) => t.toString().toLowerCase().replace(/\s+/g, '').trim();
        const objetivo = limpiar(ruletaSeleccionada);

        // Filtrado manual para asegurar que coincidan Admin y Dashboard
        const dataFiltrada = data.filter(d => limpiar(d.ruleta) === objetivo);

        if (dataFiltrada.length === 0) {
            if (panel) panel.innerHTML = `<p style="color:#ffcc00">Sin datos para "${ruletaSeleccionada}".</p>`;
            if (lista) lista.innerHTML = "";
            return;
        }

        // --- ESTADÍSTICAS ---
        const conteo = {};
        dataFiltrada.forEach(d => {
            const animal = `${d.animal_numero} ${d.animal_nombre}`.toUpperCase();
            conteo[animal] = (conteo[animal] || 0) + 1;
        });
        const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        const lider = ordenados[0][0];

        const fechasLider = dataFiltrada.filter(d => `${d.animal_numero} ${d.animal_nombre}`.toUpperCase() === lider).map(d => d.fecha);
        const companeros = {};
        dataFiltrada.forEach(d => {
            if (fechasLider.includes(d.fecha) && d.animal_numero !== lider.split(" ")[0]) {
                companeros[d.animal_numero] = (companeros[d.animal_numero] || 0) + 1;
            }
        });
        const top2 = Object.entries(companeros).sort((a,b) => b[1] - a[1]).slice(0, 2);
        const tripleta = [lider.split(" ")[0], ...top2.map(c => c[0])];

        // --- RENDERIZADO ---
        panel.innerHTML = `
            <div class="destaque-tripleta">
                <div style="font-size:0.7rem; font-weight:bold;">TRIPLETA RECOMENDADA</div>
                <div class="numeros-tripleta">${tripleta.join(" - ")}</div>
            </div>
            <div class="mini-box" style="margin-top:15px;">
                <div style="font-size:0.6rem; color:var(--oro)">DATO FUERTE</div>
                <div style="font-weight:bold;">${lider}</div>
            </div>`;
        
        lista.innerHTML = ordenados.slice(0, 5).map(a => `
            <div class="fila-stats"><span>${a[0]}</span><span>${a[1]} veces</span></div>
        `).join('');

    } catch (err) {
        if (panel) panel.innerHTML = "Error al conectar con la nube.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});