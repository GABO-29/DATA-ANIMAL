const horarios = ["08:00 a.m.", "09:00 a.m.", "10:00 a.m.", "11:00 a.m.", "12:00 p.m.", "01:00 p.m.", "02:00 p.m.", "03:00 p.m.", "04:00 p.m.", "05:00 p.m.", "06:00 p.m.", "07:00 p.m."];

function crearTabla() {
    const tbody = document.getElementById('tabla-body');
    if(!tbody) return;
    
    tbody.innerHTML = "";
    horarios.forEach((h, fIdx) => {
        let fila = `<tr><td style="color:var(--oro); font-weight:bold; font-size:0.75rem; background:#111;">${h}</td>`;
        for (let cIdx = 0; cIdx < 7; cIdx++) {
            fila += `<td><input type="text" class="cell" 
                        data-fila="${fIdx}" data-col="${cIdx}" 
                        placeholder="..." onpaste="manejarPegado(event)"></td>`;
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
            if (destino && valor.trim() !== "") {
                destino.value = valor.trim().toUpperCase();
            }
        });
    });
}

async function enviarDatos() {
    const fechaLunes = document.getElementById('fecha-lunes').value;
    const ruletaOriginal = document.getElementById('ruleta-admin').value;
    
    if (!fechaLunes) return alert("¡Atención! Selecciona la fecha del lunes primero.");

    const inputs = document.querySelectorAll('.cell');
    let registros = [];

    inputs.forEach(input => {
        if (input.value.trim() !== "") {
            // Ajuste de fecha para evitar desfases
            let partes = fechaLunes.split('-');
            let f = new Date(partes[0], partes[1] - 1, partes[2]);
            f.setDate(f.getDate() + parseInt(input.dataset.col));
            
            let val = input.value.trim();
            let espacioIdx = val.indexOf(" ");
            
            let num = espacioIdx !== -1 ? val.substring(0, espacioIdx) : val;
            let nom = espacioIdx !== -1 ? val.substring(espacioIdx + 1).toUpperCase() : "S/N";

            registros.push({
                fecha: f.toISOString().split('T')[0],
                hora: horarios[input.dataset.fila],
                ruleta: ruletaOriginal, // Coincide con el texto del <option>
                animal_numero: num,
                animal_nombre: nom
            });
        }
    });

    if (registros.length === 0) return alert("No hay datos escritos en la tabla.");

    const btn = document.querySelector('.btn-save');
    btn.disabled = true;
    btn.innerText = "GUARDANDO EN LA NUBE...";

    const { error } = await supabaseClient.from('resultados').insert(registros);
    
    if (error) {
        alert("Error de conexión: " + error.message);
        btn.disabled = false;
        btn.innerText = "Guardar y Actualizar Dashboard";
    } else {
        alert(`¡Éxito! Se guardaron ${registros.length} resultados para ${ruletaOriginal}.`);
        window.location.reload();
    }
}

document.addEventListener('DOMContentLoaded', crearTabla);