const horarios = ["08:00 a.m.", "09:00 a.m.", "10:00 a.m.", "11:00 a.m.", "12:00 p.m.", "01:00 p.m.", "02:00 p.m.", "03:00 p.m.", "04:00 p.m.", "05:00 p.m.", "06:00 p.m.", "07:00 p.m."];

function crearTabla() {
    const tbody = document.getElementById('tabla-body');
    horarios.forEach((h, fIdx) => {
        let fila = `<tr><td style="color:var(--oro); font-size:0.7rem;">${h}</td>`;
        for (let cIdx = 0; cIdx < 7; cIdx++) {
            fila += `<td><input type="text" class="cell" data-fila="${fIdx}" data-col="${cIdx}" data-hora="${h}" onpaste="manejarPegado(event)"></td>`;
        }
        tbody.innerHTML += fila + "</tr>";
    });
}

function manejarPegado(e) {
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData('text');
    const filas = texto.split(/\r?\n/);
    const fIni = parseInt(e.target.dataset.fila);
    const cIni = parseInt(e.target.dataset.col);

    filas.forEach((linea, i) => {
        const celdas = linea.split('\t');
        celdas.forEach((val, j) => {
            const dest = document.querySelector(`.cell[data-fila="${fIni+i}"][data-col="${cIni+j}"]`);
            if (dest) dest.value = val.trim();
        });
    });
}

async function enviarDatos() {
    const lunes = document.getElementById('fecha-lunes').value;
    const ruleta = document.getElementById('ruleta-admin').value;
    if (!lunes) return alert("Selecciona el lunes.");

    const inputs = document.querySelectorAll('.cell');
    let registros = [];

    inputs.forEach(i => {
        if (i.value.trim()) {
            let f = new Date(lunes + "T00:00:00");
            f.setDate(f.getDate() + parseInt(i.dataset.col));
            let val = i.value.trim();
            registros.push({
                fecha: f.toISOString().split('T')[0],
                hora: i.dataset.hora,
                ruleta: ruleta,
                animal_numero: val.split(" ")[0],
                animal_nombre: val.split(" ").slice(1).join(" ").toUpperCase() || "S/N"
            });
        }
    });

    const { error } = await supabaseClient.from('resultados').insert(registros);
    if (error) alert("Error: " + error.message);
    else alert("¡Data Animal Actualizada!");
}
crearTabla();