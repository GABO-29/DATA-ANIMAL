function generarPiramide() {
    const hoy = new Date();
    const base = String(hoy.getDate()).padStart(2, '0') + String(hoy.getMonth() + 1).padStart(2, '0') + String(hoy.getFullYear());
    let filas = [base];
    let actual = base;
    while (actual.length > 1) {
        let nueva = "";
        for (let i = 0; i < actual.length - 1; i++) {
            nueva += (parseInt(actual[i]) + parseInt(actual[i+1])) % 10;
        }
        filas.push(nueva);
        actual = nueva;
    }
    const cont = document.getElementById('contenedor-piramide');
    if (cont) cont.innerHTML = filas.map(f => `<div>${f}</div>`).join('');
}

async function obtenerEstadisticas(ruletaSeleccionada = "Lotto Activo") {
    const panel = document.getElementById('panel-inteligencia');
    const lista = document.getElementById('lista-frecuentes');
    if (panel) panel.innerHTML = "Analizando...";

    try {
        const { data, error } = await supabaseClient.from('resultados').select('*');
        if (error) throw error;

        // NORMALIZACIÓN PARA COMPARAR (Quita espacios y tildes)
        const limpiar = (txt) => txt.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').trim();
        const objetivo = limpiar(ruletaSeleccionada);

        const filtrados = data.filter(d => limpiar(d.ruleta) === objetivo);

        if (filtrados.length === 0) {
            panel.innerHTML = `<p style="color:#ffcc00">No hay datos para ${ruletaSeleccionada}</p>`;
            lista.innerHTML = "";
            return;
        }

        const conteo = {};
        filtrados.forEach(d => {
            const animal = `${d.animal_numero} ${d.animal_nombre}`.toUpperCase();
            conteo[animal] = (conteo[animal] || 0) + 1;
        });

        const orden = Object.entries(conteo).sort((a,b) => b[1] - a[1]);
        const lider = orden[0][0];

        panel.innerHTML = `
            <div style="background:#ffcc00; color:#000; padding:15px; border-radius:10px; font-weight:900; text-align:center;">
                TRIPLETA: ${lider.split(' ')[0]} - 00 - 15
            </div>
            <p style="text-align:center; margin-top:10px;">DATO FUERTE: ${lider}</p>
        `;

        lista.innerHTML = orden.slice(0, 5).map(a => `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #222; padding:5px;">
                <span>${a[0]}</span><span>${a[1]} salidas</span>
            </div>
        `).join('');

    } catch (e) { panel.innerHTML = "Error de conexión."; }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});