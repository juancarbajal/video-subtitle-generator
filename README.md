# 🎬 Subtitle Studio

**Generador automático de subtítulos para videos con IA** — Todo procesado directamente en tu navegador.

![Subtitle Studio Screenshot](https://image.qwenlm.ai/generated-images/1b3ab8c7-1113-4a2f-9687-ee652a5a0951/_result.png)

---

## ✨ Características

### 🤖 Transcripción Automática con IA
- **Whisper de OpenAI** ejecutándose 100% en el navegador usando [Transformers.js](https://huggingface.co/docs/transformers.js)
- **Sin servidor** — Todo el procesamiento se realiza localmente en tu dispositivo
- **Privacidad total** — Tu video nunca se envía a ningún servidor externo
- **Soporte multilingüe** — Más de 15 idiomas con detección automática
- **Marcas de tiempo precisas** — Genera subtítulos sincronizados automáticamente

### 🎥 Editor de Video Integrado
- Reproductor de video con controles personalizados
- Barra de progreso con marcadores de subtítulos
- Vista previa en tiempo real de los subtítulos sobre el video
- Navegación rápida con botones de avance/retroceso

### ✏️ Editor de Subtítulos
- Lista de subtítulos con timestamps editables
- Botón "Set to current" para ajustar tiempos al momento actual del video
- Edición inline de texto, inicio y fin de cada subtítulo
- Indicador visual del subtítulo activo durante la reproducción

### 📤 Importación y Exportación
- **Exportar** en formatos estándar: **SRT** y **WebVTT**
- **Importar** archivos de subtítulos existentes (.srt, .vtt)
- Copiar al portapapeles con un clic
- Vista previa del contenido antes de exportar

---

## 🚀 Tecnologías

| Tecnología | Uso |
|---|---|
| **React 19** | Framework de interfaz de usuario |
| **TypeScript** | Tipado estático |
| **Vite** | Build tool y dev server |
| **Tailwind CSS** | Estilos y diseño |
| **Transformers.js** | Inferencia de IA en el navegador |
| **OpenAI Whisper** | Modelo de reconocimiento de voz |
| **ONNX Runtime Web** | Ejecución del modelo (WASM) |
| **Web Audio API** | Extracción de audio del video |

---

## 📋 Requisitos

- **Navegador moderno** con soporte para:
  - WebAssembly (WASM)
  - Web Audio API
  - SharedArrayBuffer (recomendado para mejor rendimiento)
- **Conexión a internet** (solo la primera vez para descargar el modelo ~40MB)
- **Espacio en caché** del navegador para almacenar el modelo

### Navegadores soportados
- ✅ Chrome/Edge 90+
- ✅ Firefox 90+
- ✅ Safari 16+

---

## 🛠️ Instalación y Uso

### Desarrollo local

```bash
# Clonar el repositorio
git clone <repo-url>
cd subtitle-studio

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Build para producción

```bash
# Generar build de producción
npm run build

# Los archivos se generan en dist/
```

### Despliegue

Para un rendimiento óptimo, configura los siguientes headers HTTP en tu servidor:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Estos headers habilitan `SharedArrayBuffer`, lo que permite el procesamiento multi-hilo del modelo de IA.

> **Nota:** La aplicación funciona sin estos headers, pero en modo single-thread (más lento).

---

## 📖 Guía de Uso

### Flujo de trabajo básico

```
1. Subir Video → 2. Generar Subtítulos con IA → 3. Editar → 4. Exportar
```

#### Paso 1: Subir Video
Haz clic en **"Subir Video"** y selecciona un archivo de video desde tu dispositivo.

#### Paso 2: Generar Subtítulos Automáticamente
En el panel de **Transcripción Automática**:
1. (Opcional) Haz clic en ⚙️ para seleccionar el idioma del audio
2. Haz clic en **"Generar Subtítulos con IA"**
3. Espera a que se complete el proceso:
   - 📥 Descarga del modelo (solo la primera vez)
   - 🎵 Extracción del audio del video
   - 🗣️ Transcripción con Whisper
4. Los subtítulos generados aparecerán automáticamente en el editor

#### Paso 3: Editar Subtítulos
- Haz clic en ✏️ para editar cualquier subtítulo
- Usa **"Set to current"** para sincronizar con el momento del video
- Añade subtítulos manuales con el botón **"+ Add"**
- Elimina subtítulos innecesarios con 🗑️

#### Paso 4: Exportar
- Haz clic en **"Exportar"** en la barra superior
- Selecciona el formato (SRT o WebVTT)
- Descarga o copia al portapapeles

---

## 🌍 Idiomas Soportados

| Idioma | Código | Idioma | Código |
|---|---|---|---|
| English | `en` | 中文 | `zh` |
| Español | `es` | 日本語 | `ja` |
| Français | `fr` | 한국어 | `ko` |
| Deutsch | `de` | العربية | `ar` |
| Italiano | `it` | हिन्दी | `hi` |
| Português | `pt` | Nederlands | `nl` |
| Русский | `ru` | Polski | `pl` |
| Türkçe | `tr` | Auto-detectar | — |

---

## 🏗️ Estructura del Proyecto

```
subtitle-studio/
├── public/
│   └── _headers              # Headers para SharedArrayBuffer
├── src/
│   ├── components/
│   │   ├── AutoTranscription.tsx   # Panel de transcripción con IA
│   │   ├── ExportModal.tsx         # Modal de exportación SRT/VTT
│   │   ├── ImportModal.tsx         # Modal de importación
│   │   ├── SubtitleEditor.tsx      # Editor de subtítulos
│   │   └── VideoPlayer.tsx         # Reproductor de video
│   ├── services/
│   │   └── transcriptionService.ts # Servicio de transcripción Whisper
│   ├── utils/
│   │   └── subtitleUtils.ts        # Utilidades de formato y parseo
│   ├── App.tsx                     # Componente principal
│   ├── types.ts                    # Definiciones de tipos
│   ├── main.tsx                    # Punto de entrada
│   └── index.css                   # Estilos globales
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.js
```

---

## ⚡ Rendimiento

| Fase | Tiempo estimado | Notas |
|---|---|---|
| Descarga del modelo | ~30s (primera vez) | ~40MB, luego en caché |
| Extracción de audio | ~5-10s | Depende del tamaño del video |
| Transcripción | ~1-5 min por minuto de audio | Varía según hardware |

> 💡 **Tip:** El modelo `whisper-tiny` es el más rápido. Para mayor precisión, se puede cambiar a modelos más grandes.

---

## 🔒 Privacidad

- ✅ **100% local** — Todo el procesamiento ocurre en tu navegador
- ✅ **Sin telemetría** — No se envían datos a ningún servidor
- ✅ **Sin cuenta requerida** — Usa la aplicación directamente
- ✅ **Código abierto** — Puedes auditar todo el código

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Algunas ideas:

- [ ] Soporte para modelos Whisper más grandes (small, medium)
- [ ] Traducción automática de subtítulos
- [ ] Estilo personalizado de subtítulos (fuente, color, tamaño)
- [ ] Soporte para subtítulos quemados en el video (hardcoded)
- [ ] Historial de ediciones (undo/redo)
- [ ] Atajos de teclado avanzados

---

## 📄 Licencia

MIT License — Libre para uso personal y comercial.

---

## 🙏 Créditos

- **[OpenAI Whisper](https://github.com/openai/whisper)** — Modelo de reconocimiento de voz
- **[Transformers.js](https://github.com/huggingface/transformers.js)** — Inferencia de ML en el navegador
- **[Hugging Face](https://huggingface.co/)** — Hosting del modelo ONNX
- **[ONNX Runtime Web](https://github.com/microsoft/onnxruntime)** — Motor de ejecución WASM

---

<p align="center">
  Hecho con ❤️ usando React + Transformers.js + Whisper AI
</p>
