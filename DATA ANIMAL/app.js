// app.js - MOTOR DE PRECISIÓN POR VALOR NUMÉRICO ABSOLUTO

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

// 1. CONVERTIR TODO A UN ÚNICO NÚMERO COMPARABLE (Ej: 202603301020)
function generarIDTemporal(fechaStr, horaStr) {
    if (!fechaStr || !horaStr) return 0;

    // Convertimos "2026-03-30" -> 20260330
    const fechaLimpia = fechaStr.replace(/-/g, '');

    // Normalizamos la hora para obtener minutos
    const h = horaStr.toLowerCase().replace(/\./g, '').replace(/\s/g, '');
    const mapaMinutos = {
        "08:00am": "0480", "09:00am": "0540", "10:00am": "0600", "11:00am": "0660",
        "12:00pm": "0720", "01:00pm": "0780", "02:00pm": "0840", "03:00pm": "0900",
        "04:00pm": "0960", "05:00pm": "1020", "06:00pm": "1080", "07:00pm": "1140",
        "8:00am": "0480", "9:00am": "0540", "1:00pm": "0780", "2:00pm": "0840", "3:00pm": "0900",
        "4:00pm": "0960", "5:00pm": "1020", "6:00pm": "1080", "7:00pm": "1140"
    };

    const minutos = mapaMinutos[h] || "0000";
    
    // Retornamos un número largo: AñoMesDiaMinutos (Ej: 202603301020)
    return parseInt(fechaLimpia + minutos);
}

async function obtenerEstadisticas(ruleta = "Lotto Activo") {
    const listado = document.getElementById('lista-frecuentes');
    const ganadorTxt = document.getElementById('dato-ganador');
    listado.innerHTML = "<div class='loading'>Sincronizando...</div>";
    
    try {
        const { data, error } = await supabaseClient
            .from('resultados')
            .select('*')
            .eq('ruleta', ruleta);

        if (error || !data || data.length < 2) {
            listado.innerHTML = "Sin datos suficientes.";
            return;
        }

        // 2. ORDENAMIENTO POR NÚMERO LISO (EL MÁS GRANDE ES EL ÚLTIMO)
        const dataConID = data.map(item => ({
            ...item,
            idTemporal: generarIDTemporal(item.fecha, item.hora)
        }));

        dataConID.sort((a, b) => b.idTemporal - a.idTemporal);

        // El primero es el último resultado subido
        const ultimo = dataConID[0]; 

        // 3. ANÁLISIS DE PROBABILIDADES
        const pesos = {};
        const seguidores = [];
        for (let i = 0; i < dataConID.length - 1; i++) {
            if (dataConID[i+1].animal_numero === ultimo.animal_numero) {
                seguidores.push(dataConID[i].animal_numero);
            }
        }

        seguidores.forEach(num => { pesos[num] = (pesos[num] || 0) + 5; });

        const sugeridos = Object.entries(pesos).sort((a,b) => b[1] - a[1]);
        const tripleta = sugeridos.slice(0, 3).map(s => s[0]);

        // 4. RENDERIZADO (MOSTRANDO LA VERIFICACIÓN)
        if(ganadorTxt) ganadorTxt.innerText = tripleta[0] || "---";

        listado.innerHTML = `
            <div style="margin-bottom:15px; background:#222; padding:15px; border-radius:10px; border: 2px solid var(--oro);">
                <div style="color:var(--oro); font-weight:bold; font-size:0.7rem;">ULTIMO RESULTADO DETECTADO</div>
                <div style="font-size:1.8rem; font-weight:900;">${ultimo.animal_numero} - ${ultimo.animal_nombre}</div>
                <div style="font-size:0.8rem; color:#888;">Sorteo: ${ultimo.hora} | Fecha: ${ultimo.fecha}</div>
            </div>

            <div style="background:var(--oro); color:#000; padding:10px; border-radius:5px; text-align:center; font-weight:900; margin-bottom:15px;">
                TRIPLETA: ${tripleta.length >= 3 ? tripleta.join(" - ") : "---"}
            </div>
            <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
        `;

        listado.innerHTML += sugeridos.slice(0, 5).map(a => {
            const anim = dataConID.find(d => d.animal_numero === a[0]);
            return `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #222;">
                    <span><b>${a[0]}</b> ${anim ? anim.animal_nombre : ''}</span>
                    <span style="color:var(--oro); font-weight:bold;">${Math.min(a[1] * 10, 99)}%</span>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        listado.innerHTML = "Error de red.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generarPiramide();
    obtenerEstadisticas();
});