function generarPiramide() {
    const hoy = new Date();
    let base = String(hoy.getDate()).padStart(2,'0') + String(hoy.getMonth()+1).padStart(2,'0') + String(hoy.getFullYear());
    let filas = [base];
    while (base.length > 1) {
        let n = "";
        for (let i=0; i<base.length-1; i++) n += (parseInt(base[i]) + parseInt(base[i+1])) % 10;
        filas.push(n);
        base = n;
    }
    document.getElementById('contenedor-piramide').innerHTML = filas.map(f => `<div>${f}</div>`).join('');
}

async function obtenerEstadisticas(ruletaActiva = "Lotto Activo") {
    const panel = document.getElementById('panel-inteligencia');
    const { data, error } = await supabaseClient.from('resultados').select('*');

    if (error || !data.length) {
        panel.innerHTML = "<p style='text-align:center'>Esperando datos para analizar...</p>";
        return;
    }

    // 1. FILTRAR DATA
    const dataRuleta = data.filter(d => d.ruleta === ruletaActiva);
    if (!dataRuleta.length) return panel.innerHTML = "<p>Sin registros para esta ruleta.</p>";

    // 2. CONTEO GENERAL Y TRIPLETAS
    const conteo = {};
    dataRuleta.forEach(d => {
        const key = `${d.animal_numero} ${d.animal_nombre}`;
        conteo[key] = (conteo[key] || 0) + 1;
    });
    const ordenados = Object.entries(conteo).sort((a,b) => b[1] - a[1]);
    const top3 = ordenados.slice(0, 3);

    // 3. ANÁLISIS POR HORA (El dueño de la hora)
    const conteoHora = {};
    dataRuleta.forEach(d => {
        const keyHora = `${d.hora}#${d.animal_numero} ${d.animal_nombre}`;
        conteoHora[keyHora] = (conteoHora[keyHora] || 0) + 1;
    });
    const mejorHora = Object.entries(conteoHora).sort((a,b) => b[1] - a[1])[0];

    // 4. CRUCE INTER-RULETA (Lógica Pro)
    const lider = top3[0][0];
    const fechasDondeSalioLider = dataRuleta.filter(d => `${d.animal_numero} ${d.animal_nombre}` === lider).map(d => d.fecha);
    const otrosAnimales = data.filter(d => d.ruleta !== ruletaActiva && fechasDondeSalioLider.includes(d.fecha));
    
    const conteoCruce = {};
    otrosAnimales.forEach(a => { conteoCruce[a.animal_nombre] = (conteoCruce[a.animal_nombre] || 0) + 1; });
    const animalCruce = Object.entries(conteoCruce).sort((a,b) => b[1] - a[1])[0];

    // 5. RENDERIZAR PANEL
    panel.innerHTML = `
        <div class="grid-vip">
            <div class="mini-card">
                <span class="badge">CRUCE PRO</span>
                <p style="font-size:0.7rem; margin:5px 0;">Si sale ${lider.split(" ")[0]}, busca en otras:</p>
                <b style="color:var(--oro)">${animalCruce ? animalCruce[0] : 'ANÁLISIS...'}</b>
            </div>
            <div class="mini-card">
                <span class="badge">HORARIO TOP</span>
                <p style="font-size:0.7rem; margin:5px 0;">A las ${mejorHora[0].split("#")[0]}:</p>
                <b style="color:var(--oro)">${mejorHora[0].split("#")[1]}</b>
            </div>
        </div>

        <section class="card" style="margin-top:15px;">
            <h2>TRIPLETA CALIENTE DEL DÍA</h2>
            <div class="tripleta" style="text-align:center">
                ${top3.map(t => t[0].split(" ")[0]).join(" - ")}
            </div>
            <p style="font-size:0.6rem; text-align:center; margin-bottom:0; opacity:0.5;">ALTA PROBABILIDAD DE SALIDA CONJUNTA</p>
        </section>

        <section class="card">
            <h2>TOP 5 FRECUENCIA</h2>
            ${ordenados.slice(0,5).map(a => `
                <div class="fila-stats"><span>${a[0]}</span><span style="color:var(--oro)">${a[1]} veces</span></div>
            `).join('')}
        </section>
    `;

    document.getElementById('dato-ganador').innerText = lider;
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});