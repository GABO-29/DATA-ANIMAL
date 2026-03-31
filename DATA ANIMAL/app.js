// app.js - MOTOR DE PRECISIÓN MATEMÁTICA (ANTI-ERROR DE FECHA)

function generarPiramide() {
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
}

// 1. CONVERTIR TODO A MINUTOS PARA COMPARAR NÚMEROS, NO TEXTO
function calcularPuntajeAbsoluto(fechaStr, horaStr) {
    if (!fechaStr || !horaStr) return 0;

    // Convertimos fecha "2026-03-30" a milisegundos
    const baseFecha = new Date(fechaStr + "T00:00:00").getTime();

    // Convertimos hora a minutos adicionales
    const limpia = horaStr.toLowerCase().replace(/\./g, '').replace(/\s/g, '');
    const mapaMinutos = {
        "08:00am": 480, "09:00am": 540, "10:00am": 600, "11:00am": 660,
        "12:00pm": 720, "01:00pm": 780, "02:00pm": 840, "03:00pm": 900,
        "04:00pm": 960, "05:00pm": 1020, "06:00pm": 1080, "07:00pm": 1140,
        "8:00am": 480, "9:00am": 540, "1:00pm": 780, "2:00pm": 840, "3:00pm": 900,
        "4:00pm": 960, "5:00pm": 1020, "6:00pm": 1080, "7:00pm": 1140
    };

    const minutosExtra = mapaMinutos[limpia] || 0;
    return baseFecha + (minutosExtra * 60000); // Retorna timestamp exacto
}

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    listado.innerHTML = "<div class='loading'>Sincronizando con precisión...</div>";
    
    try {
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta);

        if (error || !data || data.length < 2) {
            listado.innerHTML = "No hay datos suficientes.";
            return;
        }

        // 2. ORDENAMIENTO POR VALOR NUMÉRICO (EL NÚMERO MÁS GRANDE ES EL MÁS NUEVO)
        const dataConPuntaje = data.map(item => ({
            ...item,
            puntaje: calcularPuntajeAbsoluto(item.fecha, item.hora)
        }));

        dataConPuntaje.sort((a, b) => b.puntaje - a.puntaje);

        // El primero de la lista es el último real
        const ultimoResultado = dataConPuntaje[0]; 
        
        // --- LÓGICA DE PROBABILIDAD ---
        const pesos = {};
        const seguidores = [];
        
        // Buscamos en el historial original qué salió después de este animal
        for (let i = 0; i < dataConPuntaje.length - 1; i++) {
            if (dataConPuntaje[i+1].animal_numero === ultimoResultado.animal_numero) {
                seguidores.push(dataConPuntaje[i].animal_numero);
            }
        }

        seguidores.forEach(num => { pesos[num] = (pesos[num] || 0) + 5; });

        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);

        // 3. RENDERIZADO
        if(ganadorTxt) ganadorTxt.innerText = tripleta[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#222; padding:15px; border-radius:10px; border: 2px solid var(--oro);">
                <div style="color:var(--oro); font-weight:bold; font-size:0.7rem;">SISTEMA DE DETECCIÓN ACTIVO</div>
                <div style="font-size:1.8rem; font-weight:900;">${tripleta.length >= 3 ? tripleta.join(" - ") : "---"}</div>
            </div>
            <div style="font-size:0.8rem; color:#fff; background:#d4af3733; padding:10px; border-radius:5px; border-left:4px solid var(--oro);">
                <strong>ÚLTIMO REGISTRADO:</strong> ${ultimoResultado.animal_numero} (${ultimoResultado.animal_nombre})<br>
                <strong>HORA:</strong> ${ultimoResultado.hora}<br>
                <strong>FECHA:</strong> ${ultimoResultado.fecha}
            </div>
            <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
        `;

        listado.innerHTML += sugeridos.slice(0, 5).map(a => {
            const anim = dataConPuntaje.find(d => d.animal_numero === a[0]);
            return `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #222;">
                    <span><b>${a[0]}</b> ${anim ? anim.animal_nombre : ''}</span>
                    <span style="color:var(--oro); font-weight:bold;">${Math.min(a[1] * 10, 99)}%</span>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        listado.innerHTML = "Error crítico de conexión.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});