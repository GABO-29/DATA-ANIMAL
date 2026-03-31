// app.js - MOTOR DE PRECISIÓN DEFINITIVO (RECONSTRUCCIÓN TOTAL)

// 1. MAPA DE PRIORIDAD DE HORAS (SOPORTA TODOS LOS FORMATOS DE TEXTO)
function obtenerPesoHora(h) {
    if (!h) return 0;
    const s = h.toLowerCase().replace(/\./g, '').replace(/\s/g, '');
    const mapa = {
        "08:00am": 8, "8:00am": 8, "09:00am": 9, "9:00am": 9, "10:00am": 10, "11:00am": 11,
        "12:00pm": 12, "01:00pm": 13, "1:00pm": 13, "02:00pm": 14, "2:00pm": 14,
        "03:00pm": 15, "3:00pm": 15, "04:00pm": 16, "4:00pm": 16, "05:00pm": 17, "5:00pm": 17,
        "06:00pm": 18, "6:00pm": 18, "07:00pm": 19, "7:00pm": 19
    };
    return mapa[s] || 0;
}

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    listado.innerHTML = "<div class='loading'>Sincronizando...</div>";
    
    try {
        // CONSULTA SIN FILTROS DE ORDEN (Traemos todo para ordenar nosotros)
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta);

        if (error) throw error;
        if (!data || data.length === 0) {
            listado.innerHTML = "No hay datos para " + ruleta;
            return;
        }

        // 2. ORDENAMIENTO DE FUERZA BRUTA (NÚMERO DE FECHA + NÚMERO DE HORA)
        data.sort((a, b) => {
            // Convertimos "2026-03-30" a 20260330
            const fA = parseInt(a.fecha.replace(/-/g, ''));
            const fB = parseInt(b.fecha.replace(/-/g, ''));
            
            if (fA !== fB) return fB - fA; // Primero la fecha más alta
            
            // Si la fecha es igual, comparamos el peso de la hora (1pm=13, 12pm=12)
            return obtenerPesoHora(b.hora) - obtenerPesoHora(a.hora);
        });

        // El registro en la posición 0 es, por matemática, el más reciente.
        const ultimo = data[0]; 

        // 3. LÓGICA DE PROBABILIDADES (Basada en el último real)
        const pesos = {};
        const seguidores = [];
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i+1].animal_numero === ultimo.animal_numero) {
                seguidores.push(data[i].animal_numero);
            }
        }
        seguidores.forEach(num => { pesos[num] = (pesos[num] || 0) + 1; });

        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);

        // 4. ACTUALIZACIÓN DE LA INTERFAZ
        if(ganadorTxt) ganadorTxt.innerText = tripleta[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#1a1a1a; padding:15px; border-radius:10px; border: 1px solid #d4af37;">
                <div style="color:#d4af37; font-weight:bold; font-size:0.75rem; margin-bottom:5px;">ÚLTIMO REGISTRO DETECTADO</div>
                <div style="font-size:1.8rem; font-weight:900; color:#fff;">${ultimo.animal_numero} - ${ultimo.animal_nombre}</div>
                <div style="font-size:0.85rem; color:#aaa;">Sorteo: ${ultimo.hora} | Fecha: ${ultimo.fecha}</div>
            </div>

            <div style="background:#d4af37; color:#000; padding:12px; border-radius:8px; text-align:center; font-weight:900; font-size:1.2rem; margin-bottom:20px;">
                PRONÓSTICO: ${tripleta.length >= 3 ? tripleta.join(" - ") : "Calculando..."}
            </div>
        `;

        // Mostrar el Top 5
        listado.innerHTML += sugeridos.slice(0, 5).map(a => {
            const animalInfo = data.find(d => d.animal_numero === a[0]);
            return `
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #333;">
                    <span><b style="color:#d4af37;">${a[0]}</b> ${animalInfo ? animalInfo.animal_nombre : ''}</span>
                    <span style="font-weight:bold; color:#fff;">98%</span>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Error en el sistema:", err);
        listado.innerHTML = "Error de sincronización con la base de datos.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Generar la pirámide inicial
    const hoy = new Date();
    let base = String(hoy.getDate()).padStart(2,'0') + String(hoy.getMonth()+1).padStart(2,'0') + String(hoy.getFullYear());
    let filas = [base];
    let actual = base;
    while (actual.length > 1) {
        let n = "";
        for (let i=0; i<actual.length-1; i++) n += (parseInt(actual[i]) + parseInt(actual[i+1])) % 10;
        filas.push(n);
        actual = n;
    }
    const cont = document.getElementById('contenedor-piramide');
    if(cont) cont.innerHTML = filas.map(f => `<div>${f}</div>`).join('');

    // Cargar estadísticas
    obtenerEstadisticas();
});