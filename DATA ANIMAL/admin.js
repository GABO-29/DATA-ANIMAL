const horarios = ["08:00 a.m.", "09:00 a.m.", "10:00 a.m.", "11:00 a.m.", "12:00 p.m.", "01:00 p.m.", "02:00 p.m.", "03:00 p.m.", "04:00 p.m.", "05:00 p.m.", "06:00 p.m.", "07:00 p.m."];

// Crea la cuadrícula de 12 horas x 7 días
function crearTabla() {
    const tbody = document.getElementById('tabla-body');
    if(!tbody) return;
    
    horarios.forEach((h, fIdx) => {
        let fila = `<tr><td style="color:var(--oro); font-weight:bold; font-size:0.7rem;">${h}</td>`;
        for (let cIdx = 0; cIdx < 7; cIdx++) {
            fila += `<td><input type="text" class="cell" 
                        data-fila="${fIdx}" data-col="${cIdx}" 
                        placeholder="..." onpaste="manejarPegado(event)"></td>`;
        }
        tbody.innerHTML += fila + "</tr>";
    });
}

// Función mágica para pegar desde Excel
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
            if (destino) destino.value = valor.trim();
        });
    });
}

// Envía los datos a Supabase
async function enviarDatos() {
    const fechaLunes = document.getElementById('fecha-lunes').value;
    const ruleta = document.getElementById('ruleta-admin').value;
    
    if (!fechaLunes) return alert("Por favor, selecciona la fecha del lunes.");

    const inputs = document.querySelectorAll('.cell');
    let registros = [];

    inputs.forEach(input => {
        if (input.value.trim() !== "") {
            // Calcular fecha sumando días al lunes
            let f = new Date(fechaLunes + "T00:00:00");
            f.setDate(f.getDate() + parseInt(input.dataset.col));
            
            let val = input.value.trim();
            let espacioIdx = val.indexOf(" ");
            
            registros.push({
                fecha: f.toISOString().split('T')[0],
                hora: horarios[input.dataset.fila],
                ruleta: ruleta,
                animal_numero: espacioIdx !== -1 ? val.substring(0, espacioIdx) : val,
                animal_nombre: espacioIdx !== -1 ? val.substring(espacioIdx + 1).toUpperCase() : "S/N"
            });
        }
    });

    if (registros.length === 0) return alert("No hay datos para guardar.");

    const { error } = await supabaseClient.from('resultados').insert(registros);
    if (error) alert("Error: " + error.message);
    else {
        alert(`¡Éxito! ${registros.length} resultados guardados en ${ruleta}.`);
        inputs.forEach(i => i.value = ""); // Limpiar tabla
    }
}

crearTabla();