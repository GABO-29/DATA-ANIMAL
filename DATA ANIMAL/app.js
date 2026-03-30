async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const { data, error } = await supabaseClient
        .from('resultados')
        .select('*'); // Traemos todo para hacer cruces

    if (error || !data.length) return;

    // 1. FILTRAR POR RULETA ACTUAL
    const dataRuleta = data.filter(d => d.ruleta === ruleta);

    // 2. EL MÁS SALIDOR POR HORA (Análisis de Horario)
    const conteoHora = {};
    dataRuleta.forEach(item => {
        const key = `${item.hora} -> ${item.animal_numero} ${item.animal_nombre}`;
        conteoHora[key] = (conteoHora[key] || 0) + 1;
    });
    const mejorPorHora = Object.entries(conteoHora).sort((a,b) => b[1] - a[1])[0];

    // 3. LÓGICA DE TRIPLETAS (Los 3 más frecuentes de la ruleta)
    const conteoGeneral = {};
    dataRuleta.forEach(item => {
        const key = `${item.animal_numero} ${item.animal_nombre}`;
        conteoGeneral[key] = (conteoGeneral[key] || 0) + 1;
    });
    const top3 = Object.entries(conteoGeneral).sort((a,b) => b[1] - a[1]).slice(0,3);

    // 4. CRUCE INTER-RULETA (¿Qué sale en otras ruletas cuando aquí sale el líder?)
    const liderActual = top3[0][0];
    const fechasLider = dataRuleta.filter(d => `${d.animal_numero} ${d.animal_nombre}` === liderActual).map(d => d.fecha);
    
    // Buscamos qué salió en OTRAS ruletas esas mismas fechas
    const cruces = data.filter(d => d.ruleta !== ruleta && fechasLider.includes(d.fecha));
    const conteoCruce = {};
    cruces.forEach(c => {
        conteoCruce[c.animal_nombre] = (conteoCruce[c.animal_nombre] || 0) + 1;
    });
    const animalCruce = Object.entries(conteoCruce).sort((a,b) => b[1] - a[1])[0];

    // --- MOSTRAR EN PANTALLA ---
    
    // Sección Frecuentes (Ya la tienes)
    document.getElementById('lista-frecuentes').innerHTML = top3.map(a => `
        <div class="fila-stats"><span>${a[0]}</span><span>${a[1]} veces</span></div>
    `).join('');

    // Nueva Sección: Análisis VIP (Debes añadir estos IDs a tu index.html)
    const seccionVip = document.getElementById('analisis-vip');
    if(seccionVip) {
        seccionVip.innerHTML = `
            <div class="card">
                <h2>ANÁLISIS DE CRUCE</h2>
                <p>Cuando sale <b>${liderActual}</b>, en otras ruletas suele salir: 
                   <span style="color:var(--oro)">${animalCruce ? animalCruce[0] : 'S/N'}</span></p>
            </div>
            <div class="card destaque">
                <h2>TRIPLETA RECOMENDADA</h2>
                <div style="font-size:1.2rem; font-weight:bold;">
                    ${top3.map(t => t[0].split(" ")[0]).join(" - ")}
                </div>
            </div>
            <div class="card">
                <h2>EL DUEÑO DE LA HORA</h2>
                <p>A las <span style="color:var(--oro)">${mejorPorHora[0].split(" -> ")[0]}</span> 
                   el animal más fuerte es: <b>${mejorPorHora[0].split(" -> ")[1]}</b></p>
            </div>
        `;
    }
}