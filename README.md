# 🎮 PixelTrivia — Juego de Trivia Multijugador

Juego tipo Kahoot con personajes pixel art sobre **Constitución Nacional** y **Día del Trabajador**.

---

## 🚀 Cómo ejecutarlo localmente

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Iniciar el servidor
npm start

# 3. Abrir en el navegador
# Profe/Host: http://localhost:3000
# Alumnos escanan el QR o entran a: http://TU_IP:3000/?join=CODIGO
```

---

## ☁️ Cómo subirlo a la web (GRATIS)

### Opción A — Railway (recomendado, 1 click)
1. Crear cuenta en https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Subir esta carpeta a un repo de GitHub
4. Railway detecta automáticamente Node.js y despliega
5. Te da una URL pública tipo `https://pixeltrivia-xxx.railway.app`

### Opción B — Render
1. Crear cuenta en https://render.com
2. "New Web Service" → conectar GitHub
3. Build Command: `npm install`
4. Start Command: `node server.js`

### Opción C — Glitch (el más fácil)
1. Ir a https://glitch.com
2. "New Project" → "Import from GitHub"
3. ¡Listo! Glitch te da una URL pública gratis

---

## 🎯 Cómo usar en clase

1. **Profe**: Abre la URL → click en "SOY PROFE / HOST" → crea sala
2. **Proyectar** el código QR en el pizarrón o pantalla
3. **Alumnos**: Escanean el QR con el celular → eligen personaje → ponen su nombre
4. **Profe**: Cuando todos estén → click "INICIAR JUEGO"
5. ¡A competir!

---

## ⚡ Mecánica de puntos

- Respuesta correcta + rápida = hasta **1100 puntos**
- 1° en responder correctamente: bonus extra
- Respuesta incorrecta: **0 puntos**
- Tiempo por pregunta: **15 segundos**

---

## 👾 Personajes disponibles
- 🦕 BRAQUIO — dinosaurio con galera
- 🐰 CONEJITO — conejo con ropa Adidas
- 🐧 MAGO — pingüino con capa roja
- 🐧 PINGÜINO — pingüino con libros
- 🐆 JAGUAR ARG — jaguar con camiseta argentina
