# Crawling y comparación

Ejemplo de proyecto: monitorizar la web de un competidor de **e-commerce
de zapatos**.

Objetivo: detectar cambios realmente relevantes en promociones, precios,
productos, logística y mensaje comercial.

La idea clave es esta:

No hay que comparar la web entera como si todo valiera lo mismo.
Hay que hacer crawling dirigido, extraer señales estructuradas y usar
hashes para no trabajar en vano.

------------------------------------------------------------------------

# 1. Estrategia de crawling

Yo no empezaría intentando recorrer toda la web del competidor.
Para un caso de negocio, haría crawling dirigido sobre páginas concretas.

## Qué páginas vigilaría

Para una tienda de zapatos, las más útiles serían:

- Home
- Categoría mujer
- Categoría hombre
- Categoría sneakers
- Página de ofertas / rebajas
- Página de producto destacada
- Página de marcas
- Página de envíos / devoluciones
- Blog o novedades

Porque ahí es donde suelen aparecer señales importantes:

- Descuentos
- Nuevas colecciones
- Reposicionamiento
- Nuevos tipos de producto
- Cambios en logística
- Cambios en mensaje de marca

------------------------------------------------------------------------

# 2. Flujo del crawling

Yo lo haría así:

## Paso 1. Tener una lista de URLs

Ejemplo del competidor:

- `https://competidorzapatos.com/`
- `https://competidorzapatos.com/mujer`
- `https://competidorzapatos.com/hombre`
- `https://competidorzapatos.com/sneakers`
- `https://competidorzapatos.com/rebajas`
- `https://competidorzapatos.com/envios-devoluciones`

## Paso 2. Abrir cada URL con un navegador automático

Usaría `Playwright`, porque muchas tiendas cargan cosas con JavaScript.

Qué haría en cada página:

- Abrir la URL
- Esperar a que cargue el contenido principal
- Cerrar banners de cookies si molestan
- Capturar el HTML final renderizado
- Sacar el texto visible
- Detectar elementos clave

## Paso 3. Normalizar el contenido

Esto es importantísimo.

No guardaría solo el HTML bruto, porque trae muchísimo ruido:

- Scripts
- Estilos
- IDs dinámicos
- Banners
- Bloques irrelevantes
- Contenido repetido en header y footer

Lo correcto es transformar la página en una versión limpia con estructura
útil para comparar.

------------------------------------------------------------------------

# 3. Qué datos extraería

Para cada página intentaría sacar datos estructurados.

## En home

- `h1`
- Mensaje principal
- Banners
- Promociones visibles
- Categorías destacadas
- Productos destacados
- CTAs tipo "Compra ahora"

## En categoría

- Nombre de la categoría
- Número de productos visibles
- Productos destacados
- Precios visibles
- Etiquetas como `nuevo`, `rebajas`, `top ventas`

## En rebajas

- Porcentaje de descuento
- Tipo de promo
- Duración si aparece
- Categorías incluidas

## En envíos y devoluciones

- Coste de envío
- Umbral de envío gratis
- Plazo de devolución

La idea es extraer estructura de negocio, no HTML sin procesar.

------------------------------------------------------------------------

# 4. Ejemplo real de crawling

Supón que el crawler entra hoy en:

`https://competidorzapatos.com/rebajas`

Y extrae algo así:

```json
{
  "url": "https://competidorzapatos.com/rebajas",
  "pageType": "sale",
  "title": "Rebajas en zapatos | Competidor",
  "h1": "Rebajas de hasta el 30%",
  "mainText": "Descubre nuestra selección de zapatos y sneakers con hasta un 30% de descuento.",
  "promoBlocks": [
    "Hasta 30% en sneakers",
    "Envío gratis desde 70€"
  ],
  "products": [
    {
      "name": "Sneaker Urban White",
      "price": "79€",
      "oldPrice": "99€",
      "badge": "Rebaja"
    },
    {
      "name": "Botín Classic Black",
      "price": "89€",
      "oldPrice": "119€",
      "badge": "Rebaja"
    }
  ]
}
```

Eso ya es mucho más útil que guardar el HTML entero y rezar.

------------------------------------------------------------------------

# 5. Cómo lo guardaría en base de datos

Yo lo guardaría en varias capas.

La idea no es guardar solo "la web actual", sino sacar fotos en el tiempo
para luego comparar.

Si usas Mongo, lo dejaría así.

## Colección `competitors`

```json
{
  "_id": "comp_001",
  "name": "Competidor Zapatos",
  "domain": "competidorzapatos.com",
  "industry": "calzado",
  "active": true
}
```

## Colección `sources`

Cada URL que quieres monitorizar.

```json
{
  "_id": "src_001",
  "competitorId": "comp_001",
  "url": "https://competidorzapatos.com/rebajas",
  "type": "sale_page",
  "active": true,
  "crawlFrequency": "daily"
}
```

## Colección `snapshots`

Aquí guardas cada captura de una URL en un momento concreto.

```json
{
  "_id": "snap_20260308_001",
  "sourceId": "src_001",
  "competitorId": "comp_001",
  "url": "https://competidorzapatos.com/rebajas",
  "crawledAt": "2026-03-08T08:00:00Z",
  "status": 200,
  "title": "Rebajas en zapatos | Competidor",
  "pageType": "sale",
  "structuredData": {
    "h1": "Rebajas de hasta el 30%",
    "mainText": "Descubre nuestra selección de zapatos y sneakers con hasta un 30% de descuento.",
    "promoBlocks": [
      "Hasta 30% en sneakers",
      "Envío gratis desde 70€"
    ],
    "products": [
      {
        "name": "Sneaker Urban White",
        "price": 79,
        "oldPrice": 99,
        "badge": "Rebaja"
      },
      {
        "name": "Botín Classic Black",
        "price": 89,
        "oldPrice": 119,
        "badge": "Rebaja"
      }
    ]
  },
  "contentHash": "abc123xyz",
  "hashes": {
    "mainText": "hash_text_1",
    "promoBlocks": "hash_promo_1",
    "products": "hash_products_1"
  }
}
```

## Por qué guardaría `structuredData`

Porque comparar HTML con HTML es un infierno.

Comparar esto:

- `h1`
- Promos
- Productos
- Precios
- Mensajes

es muchísimo más útil.

## También guardaría hashes

Esto es crítico para no trabajar en vano.

No basta con guardar el contenido: hay que guardar hashes por bloques
relevantes.

Por ejemplo:

- Hash del texto principal
- Hash del bloque de productos
- Hash del bloque de promociones

Así puedes detectar muy rápido si algo cambió sin tener que comparar todo
cada vez.

Ejemplo:

```json
{
  "hashes": {
    "mainText": "hash_text_1",
    "promoBlocks": "hash_promo_1",
    "products": "hash_products_1"
  }
}
```

------------------------------------------------------------------------

# 6. Cómo lo compararía en el siguiente crawling

Aquí está la parte interesante.

Cuando mañana vuelvas a hacer crawling de la misma URL, haces esto:

## Paso 1. Buscar el snapshot anterior

Coges el último snapshot de esa misma `sourceId`.

Ejemplo:

- Snapshot de ayer
- Snapshot de hoy

## Paso 2. Comparación rápida por hash

Primero comparas hashes.

Si el hash de productos no cambió, ni miras productos.
Si cambió el hash de promociones, solo analizas promociones.

Esto te ahorra tiempo y coste.

## Paso 3. Comparación campo por campo

Comparas lo estructurado.

Ejemplo, snapshot de ayer:

```json
{
  "h1": "Rebajas de hasta el 30%",
  "promoBlocks": [
    "Hasta 30% en sneakers",
    "Envío gratis desde 70€"
  ],
  "products": [
    {
      "name": "Sneaker Urban White",
      "price": 79,
      "oldPrice": 99,
      "badge": "Rebaja"
    },
    {
      "name": "Botín Classic Black",
      "price": 89,
      "oldPrice": 119,
      "badge": "Rebaja"
    }
  ]
}
```

Snapshot de hoy:

```json
{
  "h1": "Mid Season Sale: hasta el 40%",
  "promoBlocks": [
    "Hasta 40% en sneakers",
    "Envío gratis desde 50€"
  ],
  "products": [
    {
      "name": "Sneaker Urban White",
      "price": 69,
      "oldPrice": 99,
      "badge": "Rebaja"
    },
    {
      "name": "Botín Classic Black",
      "price": 89,
      "oldPrice": 119,
      "badge": "Rebaja"
    },
    {
      "name": "Loafer Soft Brown",
      "price": 75,
      "oldPrice": 95,
      "badge": "Nuevo en rebajas"
    }
  ]
}
```

------------------------------------------------------------------------

# 7. Qué detectaría el comparador

## Cambio 1: cambió el H1

Antes:

`Rebajas de hasta el 30%`

Ahora:

`Mid Season Sale: hasta el 40%`

Interpretación:

- Han subido agresividad promocional
- Además cambian lenguaje a algo más internacional/comercial

## Cambio 2: cambió el umbral de envío gratis

Antes:

`Envío gratis desde 70€`

Ahora:

`Envío gratis desde 50€`

Interpretación:

- Están reduciendo barrera de compra
- Posible empuje a conversión

## Cambio 3: bajó el precio de un producto

Antes:

`Sneaker Urban White = 79€`

Ahora:

`Sneaker Urban White = 69€`

Interpretación:

- Descuento adicional del producto

## Cambio 4: apareció un producto nuevo en rebajas

Nuevo:

`Loafer Soft Brown`

Interpretación:

- Ampliación de catálogo promocionado

------------------------------------------------------------------------

# 8. Cómo guardaría el resultado de la comparación

Lo metería en una colección `changes`.

```json
{
  "_id": "chg_001",
  "sourceId": "src_001",
  "competitorId": "comp_001",
  "beforeSnapshotId": "snap_20260307_001",
  "afterSnapshotId": "snap_20260308_001",
  "detectedAt": "2026-03-08T08:01:00Z",
  "pageType": "sale_page",
  "changes": [
    {
      "field": "h1",
      "type": "text_changed",
      "before": "Rebajas de hasta el 30%",
      "after": "Mid Season Sale: hasta el 40%"
    },
    {
      "field": "promoBlocks",
      "type": "text_changed",
      "before": "Envío gratis desde 70€",
      "after": "Envío gratis desde 50€"
    },
    {
      "field": "products",
      "type": "price_changed",
      "productName": "Sneaker Urban White",
      "before": 79,
      "after": 69
    },
    {
      "field": "products",
      "type": "product_added",
      "productName": "Loafer Soft Brown",
      "price": 75
    }
  ]
}
```

------------------------------------------------------------------------

# 9. Cómo resumiría eso para negocio

Luego, encima de esos cambios, generas un insight mucho más legible:

```json
{
  "_id": "insight_001",
  "competitorId": "comp_001",
  "date": "2026-03-08",
  "summary": "El competidor ha intensificado su campaña de rebajas: ha pasado de descuentos del 30% al 40%, ha reducido el umbral de envío gratis de 70€ a 50€ y ha añadido nuevos productos al catálogo promocional.",
  "impact": "high",
  "labels": ["pricing", "promotion", "conversion"]
}
```

Eso ya sí se lo enseñas al usuario.

------------------------------------------------------------------------

# 10. Qué compararía exactamente en una tienda de zapatos

Para este caso, yo no compararía toda la web igual.
Haría reglas por tipo de página.

## Home

Compararía:

- Mensaje principal
- Banners
- Categorías destacadas
- Promociones
- Claims de marca

## Categorías

Compararía:

- Número de productos visibles
- Orden de destacados
- Rangos de precio
- Badges
- Filtros nuevos

## Producto

Compararía:

- Precio
- Precio antiguo
- Disponibilidad
- Variantes
- Mensaje de envío
- Reviews visibles

## Rebajas

Compararía:

- Porcentaje máximo de descuento
- Categorías afectadas
- Productos incluidos
- Mensajes promocionales

## Envíos y devoluciones

Compararía:

- Coste de envío
- Envío gratis a partir de X
- Días de devolución
- Política de cambios

------------------------------------------------------------------------

# 11. Ejemplo más completo pensando como tu empresa

Imagina que tú vendes zapatos y tú tienes esto:

- Envío gratis desde `60€`
- Devolución en `30 días`
- Descuento máximo del `20%`

Y tu competidor cambia a:

- Envío gratis desde `50€`
- Devolución en `60 días`
- Descuento máximo del `40%`

Tu sistema debería detectar algo así:

## Insight para ti

Competidor Zapatos ha reforzado su propuesta comercial esta semana.
Ha aumentado la promoción máxima del `20-30%` al `40%`, ha reducido el
umbral de envío gratis a `50€` y ha mejorado la política de devolución a
`60 días`. Esto puede aumentar su conversión en campañas de rebajas y
generar presión competitiva en categorías de sneakers y casual.

Eso ya no es scraping.
Eso ya es inteligencia competitiva útil.

------------------------------------------------------------------------

# 12. Mi forma práctica de implementarlo

Yo lo montaría así:

## En crawling

Para cada URL:

- `fetch_page(url)` o navegación con `Playwright`
- `extract_structured_content(html, page_type)`
- Guardar snapshot

## En comparación

Para cada snapshot nuevo:

- Buscar snapshot anterior
- Comparar hashes
- Comparar campos relevantes
- Generar lista de cambios
- Guardar cambios

## En salida

- Agrupar cambios por competidor
- Generar resumen diario

## Pseudoflujo simple

1. Scheduler elige URL del competidor
2. Playwright abre la página
3. Extraes contenido estructurado
4. Guardas snapshot en Mongo
5. Buscas snapshot anterior
6. Comparas hashes
7. Comparas campos relevantes
8. Guardas cambios detectados
9. Generas insight resumido

------------------------------------------------------------------------

# 13. Qué no haría al principio

No haría esto de entrada:

- Crawl automático de miles de páginas
- Comparar HTML completo
- Meter LLM en todos los pasos
- Extraer todo con un parser universal

Empezaría con extractores simples, específicos y útiles.

Para una tienda de zapatos, con eso ya puedes detectar muchísimo valor.

------------------------------------------------------------------------

# 14. Ejemplo final ultra simple

## Día 1

Guardas esto para `/rebajas`:

```json
{
  "h1": "Rebajas de hasta el 30%",
  "shippingPromo": "Envío gratis desde 70€",
  "topProducts": [
    { "name": "Sneaker Urban White", "price": 79 },
    { "name": "Botín Classic Black", "price": 89 }
  ]
}
```

## Día 2

Guardas esto:

```json
{
  "h1": "Mid Season Sale: hasta el 40%",
  "shippingPromo": "Envío gratis desde 50€",
  "topProducts": [
    { "name": "Sneaker Urban White", "price": 69 },
    { "name": "Botín Classic Black", "price": 89 },
    { "name": "Loafer Soft Brown", "price": 75 }
  ]
}
```

## Resultado

El sistema debería detectar:

- Cambio en mensaje promocional principal
- Cambio en umbral de envío gratis
- Bajada de precio en producto destacado
- Nuevo producto incorporado a rebajas

La conclusión práctica es esta:

Este texto es mucho más importante que una visión genérica del crawling,
porque baja el problema a cómo generar señales útiles para negocio.
