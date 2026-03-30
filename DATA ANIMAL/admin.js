const horarios = ["08:00 a.m.", "09:00 a.m.", "10:00 a.m.", "11:00 a.m.", "12:00 p.m.", "01:00 p.m.", "02:00 p.m.", "03:00 p.m.", "04:00 p.m.", "05:00 p.m.", "06:00 p.m.", "07:00 p.m."];

function crearTabla() {
    const tbody = document.getElementById('tabla-body');
    if (!tbody) return;
    tbody.innerHTML = ""; // Limpiar antes de crear
    horarios.forEach((h, filaIdx) => {
        let fila = `<tr><td style="color:var(--oro); font-weight:bold; font-size:0.75rem;">${h}</td>`;
        for (let colIdx = 0; colIdx < 7; colIdx++) {
            fila += `<td><input type="text" class="cell" placeholder="..." 
                        data-hora="${h}" data-fila="${filaIdx}" data-col="${colIdx}" 
                        onpaste="manejarPegado(event)"></td>`;
        }
        tbody.innerHTML += fila + `</tr>`;
    });
}

function manejarPegado(e) {
    e.preventDefault();
    const data = (e.clipboardData || window.clipboardData).getData('text');
    const filasExcel = data.split(/\r?\n/);
    const fInicio = parseInt(e.target.dataset.fila);
    const cInicio = parseInt(e.target.dataset.col);

    filasExcel.forEach((linea, i) => {
        const celdas = linea.split('\t');
        celdas.forEach((valor, j) => {
            const destino = document.querySelector(`.cell[data-fila="${fInicio + i}"][data-col="${cInicio + j}"]`);
            if (destino) destino.value = valor.trim();
        });
    });
}

async function enviarDatos() {
    const fechaLunes = document.getElementById('fecha-lunes').value;
    const selectRuleta = document.getElementById('ruleta-admin');
    const ruleta = selectRuleta ? selectRuleta.value.trim() : ""; 
    
    if (!fechaLunes) return alert("Por favor, selecciona la fecha del lunes de esta semana.");

    const inputs = document.querySelectorAll('.cell');
    let registros = [];

    inputs.forEach(input => {
        if (input.value.trim() !== "") {
            // Calculamos la fecha real sumando los días al lunes seleccionado
            let fechaReal = new Date(fechaLunes + "T00:00:00");
            fechaReal.setDate(fechaReal.getDate() + parseInt(input.dataset.col));
            
            let texto = input.value.trim();
            let espacioIdx = texto.indexOf(" ");
            
            // Separación de número y nombre (ej: "17 PAVO")
            let numOriginal = espacioIdx !== -1 ? texto.substring(0, espacioIdx) : texto;
            let nom = espacioIdx !== -1 ? texto.substring(espacioIdx + 1).toUpperCase() : "S/N";

            // APLICACIÓN DEL CAMBIO: Estandarizar número a 2 dígitos para que el Dashboard lo lea bien
            // Esto convierte "0" en "00", "5" en "05", etc.
            let numEstandar = numOriginal.padStart(2, '0');

            registros.push({
                fecha: fechaReal.toISOString().split('T')[0],
                hora: input.dataset.hora,
                ruleta: ruleta,
                animal_numero: numEstandar,
                animal_nombre: nom
            });
        }
    });

    if (registros.length === 0) return alert("No hay datos para guardar.");

    const btn = document.querySelector('.btn-save');
    const textoOriginalBtn = btn.innerText;
    btn.innerText = "GUARDANDO...";
    btn.disabled = true;

    const { error } = await supabaseClient.from('resultados').insert(registros);
    
    if (error) {
        alert("Error al guardar: " + error.message);
        btn.innerText = textoOriginalBtn;
        btn.disabled = false;
    } else {
        alert(`¡Éxito! Registrados ${registros.length} resultados en ${ruleta}.`);
        // Limpiamos los inputs después de guardar exitosamente
        inputs.forEach(i => i.value = "");
        btn.innerText = textoOriginalBtn;
        btn.disabled = false;
    }
}

// Iniciar la tabla al cargar el script
crearTabla();