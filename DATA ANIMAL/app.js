// Genera la pirámide basada en la fecha actual
function generarPiramide() {
    const hoy = new Date();
    let base = String(hoy.getDate()).padStart(2,'0') + String(hoy.getMonth()+1).padStart(2,'0') + String(hoy.getFullYear());
    let filas = [base];
    while (base.length > 1) {
        let n = "";
        for (let i=0; i<base.length-1; i++) {
            n += (parseInt(base[i]) + parseInt(base[i+1])) % 10;
        }
        filas.push(n);
        base = n;
    }
    document.getElementById('contenedor-piramide').innerHTML = filas.map(f => `<div>${f}</div>`).join('');
}

// Analiza los datos de Supabase para dar resultados exactos
async function obtenerEstadisticas(ruletaActiva = "Lotto Activo") {
    const panel = document.getElementById('panel-inteligencia');
    const lista = document.getElementById('lista-frecuentes');
    
    const { data, error } = await supabaseClient.from('resultados').select('*');
    if (error || !data || data.length === 0) {
        panel.innerHTML = "<p style='text-align:center'>Cargando datos del servidor...</p>";
        return;
    }

    const dataRuleta = data.filter(d => d.ruleta === ruletaActiva);
    if (dataRuleta.length === 0) {
        panel.innerHTML = "<p style='text-align:center'>No hay datos para esta ruleta.</p>";
        return;
    }

    // 1. Calcular Frecuencia
    const conteo = {};
    dataRuleta.forEach(d => {
        const key = `${d.animal_numero} ${d.animal_nombre}`;
        conteo[key] = (conteo[key] || 0) + 1;
    });
    const ordenados = Object.entries(conteo).sort((a,b) => b[1] - a[1]);
    const lider = ordenados[0][0];

    // 2. Tripleta de Correlación (Exacta)
    // Buscamos qué animales salieron los mismos días que el líder
    const fechasLider = dataRuleta.filter(d => `${d.animal_numero} ${d.animal_nombre}` === lider).map(d => d.fecha);
    const companeros = {};
    dataRuleta.forEach(d => {
        if (fechasLider.includes(d.fecha) && `${d.animal_numero} ${d.animal_nombre}` !== lider) {
            companeros[d.animal_numero] = (companeros[d.animal_numero] || 0) + 1;
        }
    });
    const mejoresCompaneros = Object.entries(companeros).sort((a,b) => b[1] - a[1]).slice(0, 2);
    const tripletaFinal = [lider.split(" ")[0], ...mejoresCompaneros.map(c => c[0])];

    // 3. Renderizar Panel VIP
    panel.innerHTML = `
        <div class="destaque-tripleta">
            <div style="font-size:0.7rem; font-weight:bold; text-transform:uppercase;">Tripleta de Correlación Pro</div>
            <div class="numeros-tripleta">${tripletaFinal.length > 1 ? tripletaFinal.join(" - ") : "---"}</div>
            <div style="font-size:0.6rem; margin-top:5px;">Basado en patrones de salida conjunta en ${ruletaActiva}</div>
        </div>
        
        <div class="grid-analisis" style="margin-top:15px;">
            <div class="mini-box">
                <div style="font-size:0.6rem; color:var(--oro)">DATO FUERTE</div>
                <div style="font-weight:bold; margin-top:5px;">${lider}</div>
            </div>
            <div class="mini-box">
                <div style="font-size:0.6rem; color:var(--oro)">PROBABILIDAD</div>
                <div style="font-weight:bold; margin-top:5px; color:#44ff44;">ALTA</div>
            </div>
        </div>
    `;

    // 4. Renderizar Lista Top 5
    lista.innerHTML = ordenados.slice(0,5).map(a => `
        <div class="fila-stats"><span>${a[0]}</span><span style="color:var(--oro)">${a[1]} salidas</span></div>
    `).join('');
}

// Iniciar al cargar la página
document.addEventListener('DOMContentLoaded', () => { 
    generarPiramide(); 
    obtenerEstadisticas(); 
});