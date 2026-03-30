// app.js - Versión Final Corregida

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

async function obtenerEstadisticas(ruletaSeleccionada = "Lotto Activo") {
    const panel = document.getElementById('panel-inteligencia');
    const lista = document.getElementById('lista-frecuentes');
    if (panel) panel.innerHTML = "Buscando datos...";

    try {
        // Consultamos toda la tabla para evitar bloqueos de caché de Supabase
        const { data, error } = await supabaseClient.from('resultados').select('*');
        if (error) throw error;

        if (!data || data.length === 0) {
            if (panel) panel.innerHTML = "La base de datos está vacía.";
            return;
        }

        // FUNCIÓN DE LIMPIEZA: Quita todos los espacios y pasa a minúsculas
        const normalizar = (t) => t.toString().toLowerCase().replace(/\s+/g, '').trim();
        const objetivo = normalizar(ruletaSeleccionada);

        // Filtramos manualmente para asegurar coincidencia total
        const dataFiltrada = data.filter(d => normalizar(d.ruleta) === objetivo);

        if (dataFiltrada.length === 0) {
            if (panel) panel.innerHTML = `<p style="color:#ffcc00">No se encontraron datos para "${ruletaSeleccionada}".</p>`;
            if (lista) lista.innerHTML = "";
            return;
        }

        // --- CÁLCULO DE ANIMALES ---
        const conteo = {};
        dataFiltrada.forEach(d => {
            const nombre = `${d.animal_numero} ${d.animal_nombre}`.toUpperCase();
            conteo[nombre] = (conteo[nombre] || 0) + 1;
        });

        const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        const lider = ordenados[0][0];

        // --- CÁLCULO DE TRIPLETA ---
        const fechasLider = dataFiltrada.filter(d => `${d.animal_numero} ${d.animal_nombre}`.toUpperCase() === lider).map(d => d.fecha);
        const companeros = {};
        dataFiltrada.forEach(d => {
            if (fechasLider.includes(d.fecha) && d.animal_numero !== lider.split(" ")[0]) {
                companeros[d.animal_numero] = (companeros[d.animal_numero] || 0) + 1;
            }
        });
        const top2 = Object.entries(companeros).sort((a,b) => b[1] - a[1]).slice(0, 2);
        const tripleta = [lider.split(" ")[0], ...top2.map(c => c[0])];

        // --- MOSTRAR EN PANTALLA ---
        panel.innerHTML = `
            <div class="destaque-tripleta">
                <div style="font-size:0.7rem; font-weight:bold;">TRIPLETA SUGERIDA</div>
                <div class="numeros-tripleta">${tripleta.join(" - ")}</div>
            </div>
            <div class="mini-box" style="margin-top:15px;">
                <div style="font-size:0.6rem; color:var(--oro)">DATO FUERTE</div>
                <div style="font-weight:bold;">${lider}</div>
            </div>
        `;

        lista.innerHTML = ordenados.slice(0, 5).map(a => `
            <div class="fila-stats"><span>${a[0]}</span><span style="color:var(--oro)">${a[1]} salidas</span></div>
        `).join('');

    } catch (err) {
        console.error(err);
        if (panel) panel.innerHTML = "Error al leer Supabase.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});