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
    const cont = document.getElementById('contenedor-piramide');
    if(cont) cont.innerHTML = filas.map(f => `<div>${f}</div>`).join('');
}

async function obtenerEstadisticas(ruletaSeleccionada = "Lotto Activo") {
    const panel = document.getElementById('panel-inteligencia');
    const lista = document.getElementById('lista-frecuentes');
    
    // Traemos todos los datos de una vez para poder hacer comparaciones
    const { data, error } = await supabaseClient.from('resultados').select('*');
    
    if (error) {
        panel.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        panel.innerHTML = "<p style='text-align:center'>No hay datos en la base de datos.</p>";
        return;
    }

    // FILTRO INTELIGENTE (Ignora mayúsculas/minúsculas y espacios)
    const dataFiltrada = data.filter(d => 
        d.ruleta.trim().toLowerCase() === ruletaSeleccionada.trim().toLowerCase()
    );

    if (dataFiltrada.length === 0) {
        panel.innerHTML = `<p style='text-align:center'>Sin datos para ${ruletaSeleccionada}.</p>`;
        lista.innerHTML = "";
        return;
    }

    // 1. Conteo de Animales
    const conteo = {};
    dataFiltrada.forEach(d => {
        const nombreCompleto = `${d.animal_numero} ${d.animal_nombre}`;
        conteo[nombreCompleto] = (conteo[nombreCompleto] || 0) + 1;
    });

    const ordenados = Object.entries(conteo).sort((a,b) => b[1] - a[1]);
    const animalLider = ordenados[0][0];

    // 2. Cálculo de Tripleta por Correlación
    const fechasLider = dataFiltrada
        .filter(d => `${d.animal_numero} ${d.animal_nombre}` === animalLider)
        .map(d => d.fecha);

    const companerosConteo = {};
    dataFiltrada.forEach(d => {
        const idAnimal = d.animal_numero;
        if (fechasLider.includes(d.fecha) && idAnimal !== animalLider.split(" ")[0]) {
            companerosConteo[idAnimal] = (companerosConteo[idAnimal] || 0) + 1;
        }
    });

    const topCompaneros = Object.entries(companerosConteo)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 2);

    const tripleta = [animalLider.split(" ")[0]];
    topCompaneros.forEach(c => tripleta.push(c[0]));

    // 3. Mostrar Resultados
    panel.innerHTML = `
        <div class="destaque-tripleta">
            <div style="font-size:0.7rem; font-weight:bold; text-transform:uppercase;">Tripleta Sugerida</div>
            <div class="numeros-tripleta">${tripleta.join(" - ")}</div>
        </div>
        <div style="display:flex; gap:10px; margin-top:15px;">
            <div class="mini-box">
                <div style="font-size:0.6rem; color:var(--oro)">DATO FUERTE</div>
                <div style="font-weight:bold;">${animalLider}</div>
            </div>
            <div class="mini-box">
                <div style="font-size:0.6rem; color:var(--oro)">SALIDAS</div>
                <div style="font-weight:bold;">${ordenados[0][1]}</div>
            </div>
        </div>
    `;

    lista.innerHTML = ordenados.slice(0,5).map(a => `
        <div class="fila-stats">
            <span>${a[0]}</span>
            <span style="color:var(--oro)">${a[1]} veces</span>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});