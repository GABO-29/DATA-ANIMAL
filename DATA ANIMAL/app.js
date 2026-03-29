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

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    listado.innerHTML = "Analizando...";
    
    const { data, error } = await supabaseClient
        .from('resultados')
        .select('animal_nombre, animal_numero')
        .eq('ruleta', ruleta);

    if (error || !data.length) {
        listado.innerHTML = "Sin datos registrados.";
        document.getElementById('dato-ganador').innerText = "---";
        return;
    }

    const conteo = {};
    data.forEach(item => {
        const key = `${item.animal_numero} ${item.animal_nombre}`;
        conteo[key] = (conteo[key] || 0) + 1;
    });

    const top = Object.entries(conteo).sort((a,b) => b[1] - a[1]).slice(0,5);
    
    listado.innerHTML = top.map(a => `
        <div class="fila-stats">
            <span>${a[0]}</span>
            <span style="color:var(--oro)">${a[1]} VECES</span>
        </div>
    `).join('');

    document.getElementById('dato-ganador').innerText = top[0][0].split(" ")[0];
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});