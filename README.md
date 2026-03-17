# SmartPig - Gestión Porcina Local Estabilizada

Esta versión ha sido restaurada a su estado de máxima funcionalidad local y estabilidad. Todos los datos se almacenan de forma segura en `localStorage` para garantizar rapidez y privacidad.

## Características Principales (Restauradas)
- **Gestión de Ciclos**: Control total de Gestación, Lactancia y Verracos.
- **Producción Detallada**: Tablas de consumo semanal (8 semanas en Precebo, 15 en Ceba).
- **PigDoctor IA**: Asistente veterinario integrado basado en Genkit 1.x.
- **Inventario Inteligente**: Descuento automático de stock al registrar consumos o tratamientos.
- **Análisis Financiero**: Cálculo de costo por kilo producido y flujo de caja.

## Instrucciones para el Desarrollador
Si experimenta errores de `npm install`, asegúrese de usar Node.js 18+ y ejecutar:
1. `npm install` (las versiones han sido sincronizadas en package.json).
2. `npm run dev` para iniciar localmente.

## Nota sobre el Despliegue
Esta versión está optimizada para funcionamiento local. Se han eliminado las configuraciones experimentales de nube que causaban inestabilidad en la interfaz.