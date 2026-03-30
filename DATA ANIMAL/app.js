// app.js completo y sin recortes
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
    
    // Limpieza previa
    if (panel) panel.innerHTML = "Analizando base de datos...";
    
    try {
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            if (panel) panel.innerHTML = "Base de datos vacía. Carga datos en el Admin.";
            return;
        }

        // Filtro ultra-flexible para evitar errores de mayúsculas o espacios
        const dataFiltrada = data.filter(d => 
            d.ruleta.replace(/\s/g, '').toLowerCase() === ruletaSeleccionada.replace(/\s/g, '').toLowerCase()
        );

        if (dataFiltrada.length === 0) {
            if (panel) panel.innerHTML = `<p style="color:#ffcc00">Sin datos para ${ruletaSeleccionada}.</p>`;
            if (lista) lista.innerHTML = "";
            return;
        }

        // --- PROCESAMIENTO DE ESTADÍSTICAS ---
        const conteo = {};
        dataFiltrada.forEach(d => {
            const key = `${d.animal_numero} ${d.animal_nombre}`.toUpperCase();
            conteo[key] = (conteo[key] || 0) + 1;
        });

        const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        const lider = ordenados[0][0];

        // Tripleta basada en correlación real
        const fechasLider = dataFiltrada.filter(d => `${d.animal_numero} ${d.animal_nombre}`.toUpperCase() === lider).map(d => d.fecha);
        const companeros = {};
        dataFiltrada.forEach(d => {
            if (fechasLider.includes(d.fecha) && `${d.animal_numero} ${d.animal_nombre}`.toUpperCase() !== lider) {
                companeros[d.animal_numero] = (companeros[d.animal_numero] || 0) + 1;
            }
        });
        
        const topCompaneros = Object.entries(companeros).sort((a,b) => b[1] - a[1]).slice(0, 2);
        const tripleta = [lider.split(" ")[0], ...topCompaneros.map(c => c[0])];

        // --- RENDERIZADO ---
        if (panel) {
            panel.innerHTML = `
                <div class="destaque-tripleta">
                    <div style="font-size:0.7rem; font-weight:bold;">TRIPLETA RECOMENDADA</div>
                    <div class="numeros-tripleta">${tripleta.join(" - ")}</div>
                </div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <div class="mini-box">
                        <div style="font-size:0.6rem; color:var(--oro)">DATO FUERTE</div>
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
        console.error(err);
        if (panel) panel.innerHTML = `<p style="color:red">Error de conexión. Revisa la consola.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});