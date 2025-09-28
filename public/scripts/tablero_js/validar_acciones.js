// action_validator.js
// Validaciones y verificaciones de estado para las acciones del juego

/**
 * Determina si el jugador tiene acciones pendientes sin resolver
 * @param {Object} jugador - El jugador actual
 * @param {Object} casilla - La casilla actual
 * @returns {boolean} True si tiene acciones pendientes
 */
export function tienePendientes(jugador, casilla) {
  console.log("🔍 tienePendientes - jugador:", jugador?.nombre, "casilla:", casilla?.name, "tipo:", casilla?.type);
  
  if (!jugador || !casilla) return false;
  if (jugador.accionResuelta) {
    console.log("❌ accion ya resuelta");
    return false;
  }

  // PROPIEDAD / RAILROAD → solo pendiente si tiene dueño distinto
  if (casilla.type === "property" || casilla.type === "railroad") {
    console.log("🏠 Es propiedad/railroad - ownerId:", casilla.ownerId, "jugador.id:", jugador.id);
    if (!casilla.ownerId) {
      console.log("❌ Sin dueño");
      return false;
    }
    if (casilla.ownerId === jugador.id) {
      console.log("❌ Es del jugador actual");
      return false;
    }
    console.log("✅ Tiene dueño diferente - debe pagar renta");
    return true;
  }

  return false;
}

/**
 * Verifica si la casilla requiere una acción obligatoria
 * @param {Object} casilla - La casilla a verificar
 * @param {Object} propietario - El propietario de la casilla (si existe)
 * @param {Object} jugadorActual - El jugador en turno
 * @returns {boolean} True si la acción es obligatoria
 */
export function esAccionObligatoria(casilla, propietario, jugadorActual) {
  if (!casilla) return false;
  
  if (casilla.type === "tax" && casilla.action && typeof casilla.action.money === "number") {
    return casilla.action.money < 0;
  }
  
  if (casilla.type === "chance" || casilla.type === "community_chest") return true;
  
  if ((casilla.type === "property" || casilla.type === "railroad") && propietario && propietario.id !== jugadorActual.id) {
    return true;
  }
  
  return false;
}

/**
 * Verifica si el jugador está en condiciones de cambiar turno
 * @param {Object} jugador - El jugador actual
 * @param {Object} casilla - La casilla actual
 * @param {boolean} haMovido - Si el jugador se ha movido en este turno
 * @returns {Object} Resultado de la validación { puedepasar: boolean, razon: string }
 */
export function puedeFinalizarTurno(jugador, casilla, haMovido) {
  // Si el jugador está en la cárcel, verificar si ya usó su turno
  if (jugador.enCarcel) {
    if (!haMovido) {
      return { 
        puedePasar: false, 
        razon: "Estás en la cárcel. Debes tirar los dados o pagar la fianza antes de pasar turno." 
      };
    }
    // Si ya tiró dados en la cárcel, puede pasar turno
    return { puedePasar: true, razon: "" };
  }

  // Para jugadores no encarcelados, deben haber tirado dados
  if (!haMovido) {
    return { 
      puedePasar: false, 
      razon: "Debes tirar los dados antes de pasar turno." 
    };
  }

  // Verificar si tienen acciones pendientes sin resolver
  if (tienePendientes(jugador, casilla) && !jugador.accionResuelta) {
    return { 
      puedePasar: false, 
      razon: "No puedes pasar el turno: primero resuelve la acción de esta casilla." 
    };
  }

  // Verificar deuda pendiente
  if ((jugador?.deudaBanco || 0) > 0) {
    return { 
      puedePasar: false, 
      razon: "Tienes deuda pendiente. Vende propiedades o hipoteca para cubrirla antes de pasar turno." 
    };
  }

  return { puedePasar: true, razon: "" };
}

/**
 * Determina el propietario de una casilla basándose en los jugadores
 * @param {Object} casilla - La casilla a verificar
 * @param {Array} jugadores - Array de todos los jugadores
 * @returns {Object|null} El jugador propietario o null
 */
export function encontrarPropietario(casilla, jugadores) {
  if (!casilla || !Array.isArray(jugadores)) return null;
  
  return jugadores.find(j => 
    (j.propiedades || []).some(p => Number(p.idPropiedad) === Number(casilla.id))
  ) || null;
}

/**
 * Verifica si una casilla está hipotecada
 * @param {Object} casilla - La casilla a verificar
 * @param {Object} propietario - El propietario de la casilla
 * @returns {boolean} True si está hipotecada
 */
export function estaHipotecada(casilla, propietario) {
  if (!casilla || !propietario) return false;
  
  const propObj = (propietario.propiedades || []).find(
    p => Number(p.idPropiedad) === Number(casilla.id)
  );
  
  return propObj ? !!propObj.hipotecado : false;
}

/**
 * Calcula la renta que debe pagar un jugador en una casilla
 * @param {Object} casilla - La casilla donde cae
 * @param {Object} propietario - El dueño de la propiedad
 * @returns {number} El monto de renta a pagar
 */
export function calcularRenta(casilla, propietario) {
  if (!casilla || !propietario) return 0;
  
  const propDelDue = (propietario.propiedades || []).find(
    p => Number(p.idPropiedad) === Number(casilla.id)
  );
  
  let renta = Number(casilla.rent?.base ?? Math.round((Number(casilla.price) || 0) * 0.1));
  
  if (propDelDue) {
    if ((Number(propDelDue.hotel) || 0) > 0) {
      renta = Number(casilla.rent?.withHotel ?? renta * 5);
    } else if ((Number(propDelDue.casas) || 0) > 0) {
      const idx = (Number(propDelDue.casas) || 0) - 1;
      renta = (casilla.rent?.withHouse && casilla.rent.withHouse[idx] !== undefined) 
        ? casilla.rent.withHouse[idx] 
        : Math.round(renta * (1 + (Number(propDelDue.casas) || 0)));
    }
  }
  
  return renta;
}

/**
 * Verifica si el jugador puede realizar una acción específica
 * @param {string} accion - Tipo de acción ('comprar', 'hipotecar', etc.)
 * @param {Object} jugador - El jugador que intenta la acción
 * @param {Object} casilla - La casilla involucrada
 * @param {Object} tableroData - Datos del tablero
 * @returns {Object} { puede: boolean, razon: string }
 */
export function puedeRealizarAccion(accion, jugador, casilla, tableroData = {}) {
  switch (accion) {
    case 'comprar':
      const precio = Number(casilla?.price || 0);
      if ((Number(jugador.dinero) || 0) < precio) {
        return { puede: false, razon: `Necesitas $${precio - (Number(jugador.dinero) || 0)} adicionales` };
      }
      return { puede: true, razon: "" };
      
    case 'hipotecar':
      // Verificar si hay construcciones en el color
      if (casilla.color && tableroData.casillas) {
        const tieneConstrucciones = (jugador.propiedades || []).some(p => {
          const propCasilla = tableroData.casillas.find(c => Number(c.id) === Number(p.idPropiedad));
          return propCasilla && 
                 propCasilla.color === casilla.color && 
                 ((Number(p.casas) || 0) > 0 || (Number(p.hotel) || 0) > 0);
        });
        
        if (tieneConstrucciones) {
          return { puede: false, razon: "No puedes hipotecar: hay construcciones en propiedades de este color" };
        }
      }
      return { puede: true, razon: "" };
      
    default:
      return { puede: true, razon: "" };
  }
}