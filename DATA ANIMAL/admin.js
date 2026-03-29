const horarios = ["08:00 a.m.", "09:00 a.m.", "10:00 a.m.", "11:00 a.m.", "12:00 p.m.", "01:00 p.m.", "02:00 p.m.", "03:00 p.m.", "04:00 p.m.", "05:00 p.m.", "06:00 p.m.", "07:00 p.m."];

function crearTabla() {
    const tbody = document.getElementById('tabla-body');
    horarios.forEach(h => {
        let fila = `<tr><td style="color:var(--oro); font-size:0.7rem;">${h}</td>`;
        for (let i=0; i<7; i++) fila += `<td><input type="text" class="cell" data-hora="${h}" data-dia="${i}"></td>`;
        tbody.innerHTML += fila + `</tr>`;
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
            let f = new Date(fechaBase);
            f.setDate(f.getDate() + parseInt(c.dataset.dia));
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
    else alert("¡Datos guardados con éxito!");
}
crearTabla();