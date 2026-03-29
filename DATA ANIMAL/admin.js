const horarios = ["08:00 a.m.", "09:00 a.m.", "10:00 a.m.", "11:00 a.m.", "12:00 p.m.", "01:00 p.m.", "02:00 p.m.", "03:00 p.m.", "04:00 p.m.", "05:00 p.m.", "06:00 p.m.", "07:00 p.m."];

function crearTabla() {
    const tbody = document.getElementById('tabla-body');
    horarios.forEach((h, filaIndex) => {
        let fila = `<tr><td style="color:var(--oro); font-size:0.7rem;">${h}</td>`;
        for (let colIndex = 0; colIndex < 7; colIndex++) {
            fila += `<td><input type="text" class="cell" 
                        data-hora="${h}" 
                        data-fila="${filaIndex}" 
                        data-col="${colIndex}" 
                        onpaste="manejarPegado(event)"></td>`;
        }
        tbody.innerHTML += fila + `</tr>`;
    });
}

function manejarPegado(e) {
    // Evitamos que el texto se pegue normal en una sola casilla
    e.preventDefault();

    // Obtenemos los datos del portapapeles
    const portapapeles = (e.clipboardData || window.clipboardData).getData('text');
    
    // Excel separa columnas con Tabuladores (\t) y filas con Saltos de Línea (\n)
    const filasExcel = portapapeles.split(/\r?\n/);
    
    // Identificamos desde qué celda empezaste a pegar
    const filaInicio = parseInt(e.target.dataset.fila);
    const colInicio = parseInt(e.target.dataset.col);

    filasExcel.forEach((contenidoFila, i) => {
        const columnas = contenidoFila.split('\t');
        columnas.forEach((valor, j) => {
            // Buscamos la casilla destino en la cuadrícula
            const inputDestino = document.querySelector(
                `.cell[data-fila="${filaInicio + i}"][data-col="${colInicio + j}"]`
            );
            if (inputDestino) {
                inputDestino.value = valor.trim();
            }
        });
    });
}

async function enviarDatos() {
    const fechaBase = document.getElementById('fecha-lunes').value;
    const ruleta = document.getElementById('ruleta-admin').value;
    if (!fechaBase) return alert("Selecciona el lunes.");

    const celdas = document.querySelectorAll('.cell');
    let registros = [];

    celdas.forEach(c => {
        if (c.value.trim()) {
            let f = new Date(fechaBase + "T00:00:00"); // Forzamos hora local
            f.setDate(f.getDate() + parseInt(c.dataset.col));
            
            let partes = c.value.split(" ");
            registros.push({
                fecha: f.toISOString().split('T')[0],
                hora: c.dataset.hora,
                ruleta: ruleta,
                animal_numero: partes[0],
                animal_nombre: partes.slice(1).join(" ").toUpperCase() || "S/N"
            });
        }
    });

    const { error } = await supabaseClient.from('resultados').insert(registros);
    if (error) alert("Error: " + error.message);
    else alert("¡Datos pegados y guardados con éxito!");
}

crearTabla();