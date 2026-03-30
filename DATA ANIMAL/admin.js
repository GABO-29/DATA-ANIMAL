const horarios = ["08:00 a.m.", "09:00 a.m.", "10:00 a.m.", "11:00 a.m.", "12:00 p.m.", "01:00 p.m.", "02:00 p.m.", "03:00 p.m.", "04:00 p.m.", "05:00 p.m.", "06:00 p.m.", "07:00 p.m."];

function crearTabla() {
    const tbody = document.getElementById('tabla-body');
    if(!tbody) return;
    tbody.innerHTML = "";
    horarios.forEach((h, fIdx) => {
        let fila = `<tr><td style="color:var(--oro); font-weight:bold; font-size:0.75rem; background:#111;">${h}</td>`;
        for (let cIdx = 0; cIdx < 7; cIdx++) {
            fila += `<td><input type="text" class="cell" data-fila="${fIdx}" data-col="${cIdx}" onpaste="manejarPegado(event)"></td>`;
        }
        tbody.innerHTML += fila + "</tr>";
    });
}

function manejarPegado(e) {
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData('text');
    const filasExcel = texto.split(/\r?\n/);
    const fIni = parseInt(e.target.dataset.fila);
    const cIni = parseInt(e.target.dataset.col);
    filasExcel.forEach((linea, i) => {
        const celdas = linea.split('\t');
        celdas.forEach((valor, j) => {
            const destino = document.querySelector(`.cell[data-fila="${fIni + i}"][data-col="${cIni + j}"]`);
            if (destino && valor.trim() !== "") destino.value = valor.trim().toUpperCase();
        });
    });
}

async function enviarDatos() {
    const fechaLunes = document.getElementById('fecha-lunes').value;
    const ruleta = document.getElementById('ruleta-admin').value;
    if (!fechaLunes) return alert("Selecciona la fecha del lunes.");

    const inputs = document.querySelectorAll('.cell');
    let registros = [];

    inputs.forEach(input => {
        if (input.value.trim() !== "") {
            let p = fechaLunes.split('-');
            let f = new Date(p[0], p[1]-1, p[2]);
            f.setDate(f.getDate() + parseInt(input.dataset.col));
            
            let val = input.value.trim();
            let num = val.split(" ")[0];
            let nom = val.includes(" ") ? val.substring(val.indexOf(" ")+1).toUpperCase() : "S/N";

            registros.push({
                fecha: f.toISOString().split('T')[0],
                hora: horarios[input.dataset.fila],
                ruleta: ruleta, 
                animal_numero: num,
                animal_nombre: nom
            });
        }
    });

    if (registros.length === 0) return alert("Escribe datos antes de guardar.");
    const btn = document.querySelector('.btn-save');
    btn.innerText = "GUARDANDO...";
    
    const { error } = await supabaseClient.from('resultados').insert(registros);
    if (error) {
        alert("Error: " + error.message);
        btn.innerText = "Guardar y Actualizar Dashboard";
    } else {
        alert("Datos guardados con éxito.");
        window.location.reload();
    }
}

document.addEventListener('DOMContentLoaded', crearTabla);