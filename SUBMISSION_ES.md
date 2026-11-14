# Cursor Hackatón México CDMX — Texto de postulación

**Nombre del equipo:** Cursor CDMX Builders  
**Nombre del proyecto:** Échale  
**Repositorio público:** _Pegar URL del repo aquí_  
**Live link:** _Pegar URL desplegada aquí_

## Descripción del proyecto

Échale es una plataforma comunitaria de metas solidarias en México donde cada historia está **gestionada por una organización aliada verificada**. En lugar de crowdfunding genérico, el enfoque está en metas concretas por persona, con transparencia de avance y actualización en tiempo real.

Para el demo se muestran 3 historias pagables, cada una ligada a una cuenta receptora real de Pey:

- Adrian Soto (regresar a casa)
- Santiago Tena (salud)
- Miriam Nava (reconstrucción tras sismo)

Además, el flujo **Crea tu página** permite que una persona capture su historia y registre su CLABE para revisión con la organización aliada.

Cada página muestra:

- Historia humana con fotos y contexto.
- Meta total y desglose por hitos (por ejemplo: Techo, Muros, Piso y puerta).
- Mensajes de apoyo recientes.
- Herramientas para compartir (incluyendo WhatsApp) y tarjeta QR descargable para difusión.

La parte central del reto se resolvió integrando **CoDi vía API de Pey**:

- Se crea un cobro CoDi por monto y referencia (`numRef`) con `POST /codi/qr`.
- Se renderiza el `qrString` devuelto por Pey como QR listo para escanear desde banca móvil.
- Se maneja webhook firmado (`webhook-signature`) para confirmar pago y actualizar inmediatamente la recaudación, hitos y feed.
- La atribución del pago se hace por `codiQrId`/`numRef` del cobro almacenado, por lo que funciona correctamente aunque una misma API key atienda múltiples historias.

Para operación real y demo sin fricción, el proyecto incluye:

- **Modo LIVE** (dinero real con API key del dueño).
- **Modo MOCK** (flujo completo simulado para escenarios sin llaves).
- Panel admin para organizaciones aliadas: crear/editar historias, moderar solicitudes (aprobar/rechazar), revisar estado CoDi de cuentas y marcar fondos liberados.

En resumen, Échale combina diseño cálido en español mexicano, UX mobile-first y cobros instantáneos con CoDi para convertir apoyo comunitario en resultados visibles, medibles y transparentes.
