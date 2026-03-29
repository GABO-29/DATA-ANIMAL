// --- LÓGICA DE LA PIRÁMIDE ---
function calcularPiramide() {
    const hoy = new Date();
    document.getElementById('fecha-actual').innerText = hoy.toLocaleDateString();
    
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = String(hoy.getFullYear());
    
    let base = dia + mes + anio; // Ejemplo: 29032026
    let niveles = [base];

    while (base.length > 1) {
        let nuevoNivel = "";
        for (let i = 0; i < base.length - 1; i++) {
            let suma = parseInt(base[i]) + parseInt(base[i+1]);
            nuevoNivel += suma % 10;
        }
        niveles.push(nuevoNivel);
        base = nuevoNivel;
    }

    const contenedor = document.getElementById('contenedor-piramide');
    contenedor.innerHTML = niveles.map(n => `<div>${n}</div>`).join('');
}

// --- LÓGICA DE ESTADÍSTICAS (SUPABASE) ---
async function obtenerEstadisticas() {
    // Pedimos todos los resultados a Supabase
    const { data, error } = await supabaseClient
        .from('resultados')
        .select('animal_nombre, animal_numero');

    if (error) {
        console.error("Error cargando datos:", error);
        return;
    }

    // Contamos cuántas veces aparece cada animal
    const conteo = {};
    data.forEach(item => {
        const clave = `${item.animal_numero} ${item.animal_nombre}`;
        conteo[clave] = (conteo[clave] || 0) + 1;
    });

    // Ordenamos de mayor a menor
    const ordenados = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Tomamos el Top 5

    // Mostramos en pantalla
    const listaDiv = document.getElementById('lista-frecuentes');
    listaDiv.innerHTML = ordenados.map(a => `
        <div style="display:flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #333;">
            <span>${a[0]}</span>
            <span style="color:#ffcc00; font-weight:bold;">${a[1]} salidas</span>
        </div>
    `).join('');

    // El "Dato Ganador" es el número 1 de la lista
    if(ordenados.length > 0) {
        document.getElementById('dato-ganador').innerText = ordenados[0][0];
    }
}

// Ejecutar todo al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    calcularPiramide();
    obtenerEstadisticas();
});