const horarios = [
    "08:00 a.m.", "09:00 a.m.", "10:00 a.m.", "11:00 a.m.", 
    "12:00 p.m.", "01:00 p.m.", "02:00 p.m.", "03:00 p.m.",
    "04:00 p.m.", "05:00 p.m.", "06:00 p.m.", "07:00 p.m."
];

function inicializarTabla() {
    const cuerpo = document.getElementById('cuerpo-tabla');
    cuerpo.innerHTML = ""; // Limpiar antes de generar
    horarios.forEach(hora => {
        let fila = `<tr><td style="font-weight:bold; color:#ffcc00;">${hora}</td>`;
        for (let i = 0; i < 7; i++) {
            fila += `<td><input type="text" class="input-celda" data-hora="${hora}" data-dia="${i}" placeholder="Ej: 11 GATO"></td>`;
        }
        fila += `</tr>`;
        cuerpo.innerHTML += fila;
    });
}

async function guardarSemana() {
    const inputs = document.querySelectorAll('.input-celda');
    const fechaInicioStr = document.getElementById('fecha-inicio').value;
    const ruleta = document.getElementById('ruleta-select').value;
    
    if(!fechaInicioStr) return alert("Por favor, selecciona la fecha del Lunes.");

    let datosASubir = [];

    inputs.forEach(input => {
        const valor = input.value.trim();
        if (valor !== "") {
            // Calculamos la fecha real de la celda
            const fechaPartes = fechaInicioStr.split('-');
            let fechaSorteo = new Date(fechaPartes[0], fechaPartes[1] - 1, fechaPartes[2]);
            fechaSorteo.setDate(fechaSorteo.getDate() + parseInt(input.dataset.dia));
            
            // Lógica para separar: "11 GATO" -> numero: 11, nombre: GATO
            let partes = valor.split(" ");
            let num = partes[0];
            let nombre = partes.slice(1).join(" ").toUpperCase();

            datosASubir.push({
                fecha: fechaSorteo.toISOString().split('T')[0],
                hora: input.dataset.hora,
                ruleta: ruleta,
                animal_nombre: nombre || "SIN NOMBRE",
                animal_numero: num
            });
        }
    });

    if(datosASubir.length === 0) return alert("No hay datos para guardar.");

    console.log("Subiendo datos a DATA ANIMAL...", datosASubir);

    const { data, error } = await supabaseClient
        .from('resultados')
        .insert(datosASubir);

    if (error) {
        console.error(error);
        alert("Error: " + error.message);
    } else {
        alert("¡Éxito! Se han guardado " + datosASubir.length + " sorteos en DATA ANIMAL.");
        // Opcional: limpiar tabla tras guardar
        inputs.forEach(i => i.value = "");
    }
}

document.addEventListener('DOMContentLoaded', inicializarTabla);