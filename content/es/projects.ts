import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'Agente LLM integrado en Minecraft a través de un mod personalizado. El backend, con autenticación JWT, expone un agente LangGraph con RAG que entiende el contexto del juego y decide y ejecuta acciones dentro del mundo.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'RAG', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
    detail: {
      summary: [
        'MinecraftButlerAI es un backend FastAPI que da vida a un mayordomo ("Alfred") dentro de Minecraft: entiende preguntas en lenguaje natural (por texto o por voz), responde con conocimiento real del juego y ejecuta acciones en el mundo. Más que una simple llamada a un LLM, es una arquitectura agéntica donde cada pieza resuelve un problema concreto, desde el enrutado de intenciones hasta la recuperación de conocimiento y la síntesis de voz.',
        'El butler combina un agente LangGraph con memoria persistente, un sistema RAG multilingüe sobre la documentación del juego y un pipeline de voz local, todo ello expuesto mediante una API HTTP autenticada con JWT y pensada para producción (rate-limiting, migraciones, observabilidad).',
      ],
      sections: [
        {
          heading: 'Arquitectura del agente',
          paragraphs: [
            'El butler se modela como un grafo de nodos con LangGraph: un primer nodo clasifica la intención del usuario y el grafo enruta de forma determinista (un diccionario intención → nodo, no "magia del LLM") a una de tres ramas: responder una pregunta con RAG, moverse a unas coordenadas o conversar.',
            'El estado del grafo (ButlerState) es un TypedDict tipado cuyo campo de mensajes usa el reducer add_messages de LangGraph, lo que acumula el historial automáticamente. El grafo se compila una sola vez (singleton protegido con asyncio.Lock) con un checkpointer AsyncRedisSaver: cada sesión persiste su estado en Redis con TTL, dando memoria conversacional multi-turno por jugador sin gestión adicional en el cliente.',
            'La clasificación de intención usa Claude Haiku 4.5 (rápido y barato) con structured output (un objeto Pydantic validado, no texto libre a parsear), mientras que la respuesta final usa Claude Sonnet 4.6. Ambos modelos se obtienen a través de un factory que abstrae por rol ("clasificador"/"respondedor") y por proveedor (Anthropic u OpenAI), de forma que el código pide capacidades, no modelos concretos.',
          ],
        },
        {
          heading: 'RAG multilingüe',
          paragraphs: [
            'El conocimiento del juego se indexa en inglés a partir de PrismarineJS/minecraft-data y extractos de la Minecraft Wiki, pero los usuarios preguntan en español. Para resolver ese salto de idioma se usan embeddings cross-lingual densos (paraphrase-multilingual-MiniLM-L12-v2) con búsqueda por similitud coseno en Qdrant.',
            'El diseño original incluía un pipeline híbrido completo (rama sparse BM42 + reranker FlashRank), que se descartó tras validar con datos reales: ambos componentes son léxicos y solo-inglés, por lo que con consultas en español el sparse devolvía ruido y el reranker no sabía reordenar resultados ES→EN. La conclusión, medida y documentada en el código, es que el denso multilingüe es superior por sí solo en ambos idiomas.',
            'Para las mecánicas de la wiki se usa Parent Document Retrieval: se indexan chunks pequeños (~800 caracteres) que producen embeddings precisos, pero se recupera y se pasa al LLM el bloque padre completo (~2000 caracteres), resolviendo la tensión entre precisión de recuperación y suficiencia de contexto.',
          ],
        },
        {
          heading: 'Voz y producción',
          paragraphs: [
            'La respuesta se emite por Server-Sent Events frase a frase (no token a token), porque el cliente la sintetiza por voz (TTS) y un TTS necesita frases completas para sonar natural; esto da percepción de inmediatez sin trocear el audio.',
            'La transcripción de voz se realiza on-device con faster-whisper en cuantización int8 (más rápido y con la mitad de memoria que float32, sin pérdida apreciable), con el modelo precalentado en el arranque para evitar cold-start y sin enviar el audio del usuario a terceros.',
            'El backend está pensado para producción: autenticación JWT con roles, rate-limiting con SlowAPI, migraciones Alembic, arquitectura por slices (router/schemas/service/repository) y observabilidad opcional de cada ejecución del agente con LangSmith.',
          ],
        },
      ],
      links: [
        {
          label: 'Arquitectura técnica',
          url: 'https://github.com/migue0418/minecraft-butler-ai-backend/blob/main/ARCHITECTURE.md',
        },
      ],
    },
  },
  {
    id: 'tfm-sexism-classifier',
    name: 'TFM: LLMs para detección automática de lenguaje sexista en redes sociales',
    description:
      'Trabajo de Fin de Máster: comparación de modelos BERT/ModernBERT ajustados frente a LLMs en zero/few-shot para detectar lenguaje sexista explícito e implícito en redes sociales.',
    stack: ['Python', 'PyTorch', 'Transformers', 'BERT', 'ModernBERT', 'FastAPI', 'React', 'SQLite'],
    repoUrl: 'https://github.com/migue0418/TFM-Miguel-Angel',
    featured: true,
    detail: {
      summary: [
        'El sexismo en redes sociales se manifiesta tanto de forma explícita como implícita, lo que dificulta su moderación automática: los sistemas actuales confunden a menudo el contenido sexista con publicaciones que simplemente lo denuncian o lo citan para criticarlo, y su rendimiento se degrada al pasar de un dominio (p. ej. Twitter) a otro (p. ej. foros o Reddit).',
        'Este TFM parte de la hipótesis de que un modelo tipo BERT ajustado específicamente para esta tarea (fine-tuning) puede ser competitivo, e incluso superior, frente a LLMs de propósito general usados en zero-shot o few-shot, aun reduciendo de forma significativa el volumen de datos de entrenamiento.',
      ],
      sections: [
        {
          heading: 'Datasets',
          paragraphs: [
            'EDOS (SemEval-2023 Task 10): conjunto de datos de Reddit y Gab con entre 5.000 y 20.000 ejemplos etiquetados, usado en sus variantes binaria, de 3 clases y de 4 clases para evaluar distintos niveles de granularidad en la detección de sexismo.',
            'RedditBIAS: alrededor de 3.000 frases centradas en sesgo de género, empleado para evaluar la generalización del modelo a un dominio distinto al de entrenamiento.',
            'Conjunto de frases sintéticas: 15 frases diseñadas específicamente para el TFM, distribuidas en 3 clases, que permiten una validación cualitativa rápida del comportamiento del modelo ante casos límite.',
          ],
        },
        {
          heading: 'Metodología',
          paragraphs: [
            'Preprocesado de los datasets (limpieza de texto, balanceo de clases al 50/50 para evitar sesgos por desbalance) y división en conjuntos de entrenamiento, validación y test con proporciones 70/10/20.',
            'Búsqueda de hiperparámetros mediante grid search sobre 54 combinaciones (learning rate, batch size, número de épocas, etc.) para encontrar la configuración óptima de fine-tuning de los modelos BERT y ModernBERT.',
            'Evaluación de LLMs en few-shot prompting (k=6 ejemplos para clasificación binaria, k=12 para 4 clases) aplicando logits masking para restringir la salida del modelo a las clases válidas.',
            'Métricas de evaluación: F1 macro, precision, recall y accuracy, calculadas de forma consistente para todos los modelos y datasets.',
          ],
        },
        {
          heading: 'Conclusiones',
          paragraphs: [
            'El fine-tuning de modelos tipo BERT supera de forma consistente a los LLMs sin ajustar: incluso el mejor resultado obtenido con Mistral-7B-Instruct en few-shot (F1 = 0.413) queda más de 40 puntos porcentuales por debajo de los modelos ajustados.',
            'Reducir el conjunto de entrenamiento de EDOS de 20.000 a 10.000 ejemplos es viable: supone un ahorro de aproximadamente el 87% en horas de GPU con una pérdida de rendimiento de solo 4 puntos porcentuales de F1.',
            'Limitaciones identificadas: confusión entre contenido crítico/denuncia y contenido sexista, dificultad para detectar ironía y sarcasmo, y falta de evaluación en escenarios multilingües, que queda abierta como trabajo futuro.',
          ],
        },
        {
          heading: 'Aplicación web',
          paragraphs: [
            'El modelo binario ModernBERT-base (entrenado sobre reduced_10k) se integró en una aplicación full-stack que demuestra su uso en un escenario real: un microservicio FastAPI con frontend React, persistencia en SQLite y autenticación JWT con tres roles: admin (gestión total de usuarios y roles), sexism_detection (lanzar y consultar análisis) y analytics (solo lectura de analíticas).',
            'El detector de sexismo ofrece tres modos de análisis: texto libre (segmentado en frases, con resultado global y por frase), URL (analiza el contenido textual de una página, con filtro opcional por etiqueta HTML) y dominio completo (respeta robots.txt, localiza el sitemap.xml, extrae las URLs indexables y ejecuta la inferencia en paralelo).',
            'El módulo de analíticas consolida los resultados en tres vistas: un dashboard global (URLs y frases analizadas, % de sexismo estimado, top-5 frases más sexistas e histograma de severidad), un listado de dominios analizados y un listado paginado de URLs por dominio con acceso al detalle frase a frase de cada una.',
            'Como prueba de concepto se analizó el portal principal de la Universidad de Granada (www.ugr.es): sobre 590 URLs y 12.643 frases, solo 22 frases (≈0,002%) se marcaron como sexistas, y la revisión manual confirmó que eran falsos positivos (frases que hablan sobre discriminación de género, no que la ejercen). Es el resultado esperado para una web institucional y una señal de que el modelo no sobre-etiqueta contenido de forma indiscriminada.',
          ],
        },
      ],
      results: [
        { label: 'F1 (ModernBERT-base, EDOS-10k)', value: '0.843' },
        { label: 'Recall (ModernBERT-base, EDOS-10k)', value: '0.853' },
        { label: 'Accuracy (ModernBERT-base, EDOS-10k)', value: '0.843' },
        { label: 'F1 (bert-base-uncased, EDOS-10k)', value: '0.836' },
        { label: 'F1 (bert-base-uncased, EDOS-20k)', value: '0.7876' },
        { label: 'F1 (Mistral-7B-Instruct, few-shot)', value: '0.413' },
        { label: 'F1 (frases sintéticas, BERT)', value: '0.95-0.96' },
      ],
      images: [
        {
          src: '/images/projects/tfm-sexism-classifier/binary-results-diagram.png',
          alt: 'Gráfico de barras comparando el F1 (macro) de cada modelo en los datasets EDOS, RedditBIAS y frases sintéticas',
          caption: 'Comparación de F1 (macro) por modelo y dataset en clasificación binaria',
          width: 3600,
          height: 1800,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/login-page.png',
          alt: 'Pantalla de inicio de sesión de la aplicación, con campos de usuario y contraseña',
          caption: 'Pantalla de inicio de sesión de la aplicación',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-text.png',
          alt: 'Resultado del análisis de un texto libre, con el porcentaje global de frases sexistas y el desglose frase a frase',
          caption: 'Análisis de un texto libre con resultado global y desglose frase a frase',
          width: 1920,
          height: 1228,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-url.png',
          alt: 'Resultado del análisis del contenido textual de una URL, con resumen global y detalle por frase',
          caption: 'Análisis del contenido textual de una URL',
          width: 1919,
          height: 1079,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-domain.png',
          alt: 'Resultado del análisis de un dominio completo, mostrando los sitemaps localizados y las URLs detectadas',
          caption: 'Análisis de un dominio completo a partir de su sitemap.xml',
          width: 1920,
          height: 1772,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/analytics-global.png',
          alt: 'Dashboard global de analíticas con URLs y frases analizadas, porcentaje de sexismo, top-5 frases más sexistas e histograma de severidad',
          caption:
            'Dashboard global de analíticas: URLs/frases analizadas, % de sexismo, top-5 frases, histograma de severidad',
          width: 1916,
          height: 939,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/domains-list.png',
          alt: 'Listado de dominios web analizados, con búsqueda y acceso al detalle de cada uno',
          caption: 'Listado de dominios analizados',
          width: 1920,
          height: 650,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/urls-domain.png',
          alt: 'Listado paginado de URLs de un dominio, con su porcentaje de sexismo y clasificación',
          caption: 'Listado paginado de URLs de un dominio con su clasificación',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/url-analysis.png',
          alt: 'Detalle frase a frase del análisis de una URL, con buscador y filtros por clasificación',
          caption: 'Detalle frase a frase del análisis de una URL',
          width: 1919,
          height: 945,
        },
      ],
      links: [
        {
          label: 'Memoria (PDF)',
          url: 'https://github.com/migue0418/TFM-Miguel-Angel/blob/main/TFM%20-%20LLMs%20para%20detecci%C3%B3n%20autom%C3%A1tica%20de%20lenguaje%20sexista%20en%20redes%20sociales.pdf',
        },
      ],
    },
  },
  {
    id: 'autoparts-inventory-platform',
    name: 'Plataforma de gestión e inventario para tienda de recambios de automóvil',
    description:
      'Plataforma full-stack de gestión e inventario para una tienda de recambios de automóvil: sincroniza y amplía la API de Factusol/SDELsol, automatiza la lectura de facturas de proveedores con OCR, relaciona artículos equivalentes de distintas marcas para encontrar alternativas, y convierte los móviles de la tienda en PDAs conectadas en tiempo real.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'PostgreSQL', 'SQLAlchemy', 'OCR', 'Docker', 'Caddy'],
    featured: true,
    detail: {
      summary: [
        'Aplicación interna de gestión para una tienda de recambios de automóvil, construida sobre Factusol Cloud (SDELsol), el ERP que usa el negocio para facturación y contabilidad. El proyecto se llevó de extremo a extremo, como desarrollador y como product manager: desde decidir qué partes del flujo de trabajo merecía la pena automatizar hasta diseñar la migración desde el sistema anterior, la capa de integración con Factusol y el despliegue final en la red local del negocio.',
        'Factusol expone una API de administración limitada (leer/escribir tablas, lanzar consultas), sin conceptos como la relación entre artículos equivalentes de distintas marcas, lectura automática de facturas o uso del móvil como terminal de almacén. El proyecto añade esa capa por encima: sincronización con PostgreSQL, un índice de equivalencias entre marcas para encontrar alternativas con el mismo uso, un pipeline de OCR para facturas de proveedores que escribe directamente en Factusol, y una app web servida en HTTPS dentro de la red local que cualquier móvil puede usar como PDA.',
      ],
      sections: [
        {
          heading: 'Sincronización y capa de negocio sobre Factusol',
          paragraphs: [
            'Un cliente HTTP asíncrono se autentica contra la API de Factusol (token JWT cacheado y renovado automáticamente) y expone operaciones genéricas: leer tablas, lanzar consultas SQL, y escribir, actualizar o borrar registros sobre las tablas del ERP (artículos, proveedores, tarifas, stock, facturas...). Sobre ese cliente se construyó un sincronizador que replica esas tablas en PostgreSQL de forma incremental (solo registros modificados desde la última sincronización) o completa, programable por tabla con un scheduler en segundo plano.',
            'Tener una copia local en PostgreSQL permite construir herramientas de análisis que Factusol no ofrece: un análisis de márgenes por familia de artículos (comparando precio de tarifa y precio de coste) y una comparación de tarifas de proveedor (ficheros Excel de tarifa frente al catálogo, clasificando coincidencias por referencia o código de barras).',
            "La pieza más valiosa de esta capa es la relación entre artículos equivalentes de distintas marcas: un mismo recambio (por ejemplo, una pastilla de freno o un filtro para un modelo de coche concreto) lo fabrican varios proveedores con referencias propias distintas, y Factusol guarda un 'código equivalente' por artículo pero no ofrece ninguna forma de explotarlo. Se construyó un índice de equivalencias que, dado un artículo, muestra de un vistazo las alternativas de otras marcas que cubren el mismo uso, junto a su stock, precio y margen, lo que resulta útil tanto para ofrecer una alternativa cuando el artículo solicitado no hay en stock como para elegir, entre varias opciones válidas, la de mejor margen.",
          ],
        },
        {
          heading: 'OCR de facturas de proveedores',
          paragraphs: [
            'Las facturas de compra que llegan de los proveedores (PDF o imagen) se procesan con un pipeline OCR que extrae cabecera y líneas: referencia, descripción, cantidad, precio de coste y descuentos. Cada línea se cruza contra el catálogo usando la referencia del proveedor o el código de barras del artículo.',
            'Las líneas reconocidas se escriben directamente en Factusol a través de su API, actualizando precios de coste y, si procede, dando de alta el artículo, de forma que el coste de compra queda al día sin teclear nada. Las líneas que no se reconocen automáticamente quedan en una cola de revisión manual, donde se asocian a un artículo existente o se crean como nuevos.',
            'Antes de esto, cada factura de proveedor implicaba teclear manualmente artículo por artículo en Factusol; ahora ese trabajo se reduce a revisar las pocas líneas que el sistema no reconoce.',
          ],
        },
        {
          heading: 'Migración desde el sistema anterior',
          paragraphs: [
            'El negocio venía de un sistema de gestión anterior (no Factusol) cuya base de datos se migró por completo a Factusol Cloud: catálogo de artículos, proveedores, clientes, tarifas y el histórico de facturas y albaranes emitidos y recibidos.',
            'Los datos del sistema anterior se volcaron a PostgreSQL como zona de staging, se limpiaron y normalizaron (incluyendo una clasificación asistida con IA para completar descripciones y familias de artículos que llegaban incompletas), se revisaron manualmente para control de calidad y finalmente se exportaron a las plantillas Excel que la herramienta de importación de Factusol Cloud espera.',
            'Como el negocio siguió operando durante toda la preparación de la migración, el proceso se diseñó de forma incremental: los nuevos movimientos (facturas, albaranes, tarifas) que se iban generando mientras se depuraba el resto del catálogo se incorporaban a la misma zona de staging en sucesivas pasadas, de modo que el volcado final a Factusol Cloud reflejara el catálogo y el histórico completos hasta el último día de actividad con el sistema anterior.',
          ],
        },
        {
          heading: 'Despliegue local: Caddy y móviles como PDA',
          paragraphs: [
            'Toda la aplicación (backend FastAPI sirviendo el build de React, y PostgreSQL) se ejecuta en contenedores con Docker Compose, detrás de Caddy como proxy inverso. Caddy emite y renueva automáticamente certificados TLS para un dominio interno de la red local del negocio, sin depender de un dominio público.',
            'Con esos certificados instalados como de confianza en los móviles de la tienda, cualquier empleado puede abrir la app desde el navegador del teléfono por HTTPS y usar la cámara como lector de códigos de barras (API BarcodeDetector con polyfill WASM para que funcione también en iOS), convirtiendo el móvil en una PDA conectada en tiempo real tanto a la API de Factusol como a la base de datos PostgreSQL sincronizada.',
            'El resultado es que el almacén dispone de consulta de stock, precios e inventario en tiempo real desde cualquier móvil, sin instalar nada y sin comprar hardware dedicado.',
          ],
        },
      ],
    },
  },
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Plantilla full stack con SDD y buenas prácticas de desarrollo. Incluye pre-commit hooks, Git Flow, Docker y estructura modular para proyectos de producción.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
    detail: {
      summary: [
        'Plantilla full-stack lista para producción: backend FastAPI con SQLAlchemy async, Alembic y autenticación JWT con roles, frontend React + TypeScript + Vite, y despliegue con Docker Compose detrás de Caddy como reverse proxy. Incluye, además, un flujo de Spec-Driven Development (OpenSpec) integrado desde el primer commit.',
        'El objetivo es arrancar cualquier proyecto nuevo con una base sólida (autenticación, gestión de usuarios y roles, arquitectura modular, migraciones, pre-commit hooks y documentación versionada) en lugar de reconstruir esa infraestructura desde cero en cada proyecto.',
      ],
      sections: [
        {
          heading: 'Arquitectura por slices',
          paragraphs: [
            'Tanto el backend como el frontend organizan el código por funcionalidad ("slice") en lugar de por capa técnica: cada feature del backend vive en app/features/<feature>/ con sus archivos router.py, schemas.py, service.py, repository.py y, si aplica, models.py; cada feature del frontend vive en src/features/<feature>/ con api.ts, types.ts y los componentes de página.',
            'Esta organización mantiene cada funcionalidad autocontenida y fácil de localizar, y facilita que un cambio (p. ej. añadir un nuevo recurso) toque un conjunto acotado y predecible de archivos en ambos lados.',
            'Al añadir un modelo SQLAlchemy nuevo, se importa en core/database.py::import_model_modules y se genera la migración correspondiente con Alembic (alembic revision --autogenerate seguido de alembic upgrade head), de forma que el esquema de base de datos queda siempre versionado junto al código.',
          ],
        },
        {
          heading: 'Autenticación y roles',
          paragraphs: [
            'La autenticación combina un access token JWT de corta duración (15 minutos) con un refresh token almacenado en una cookie HTTP-only, y las contraseñas se almacenan con hash argon2 (vía pwdlib).',
            'Los roles se modelan con una relación muchos-a-muchos entre User y Role a través de la tabla de unión user_roles, lo que permite asignar varios roles a un mismo usuario y reutilizar la misma tabla de roles para distintas políticas de acceso.',
            'La plantilla incluye reglas de negocio listas para producción: el username es único (un intento de duplicado devuelve 409) y existe protección de "último admin", que impide eliminar, desactivar o degradar al último usuario administrador activo del sistema.',
          ],
        },
        {
          heading: 'Spec-Driven Development integrado',
          paragraphs: [
            'La plantilla incorpora un flujo completo de Spec-Driven Development basado en OpenSpec: /opsx:explore para aclarar una idea, /opsx:propose para generar la propuesta y sus artefactos (specs, design, tasks), un plan técnico a nivel de archivos antes de implementar, /opsx:apply para ejecutar las tareas y /opsx:archive para fusionar las especificaciones al cerrar el cambio.',
            'Incluye agentes especializados (backend-developer, frontend-developer, product-strategy-analyst) y skills reutilizables (openspec-*, enrich-us, write-pr-report) que automatizan pasos recurrentes del ciclo de desarrollo, desde la redacción de historias de usuario hasta la apertura del pull request.',
            'La documentación del proyecto está versionada junto al código en docs/ (development_guide.md, base-standards.md, frontend-standards.md, backend-standards.md, data-model.md, entre otros), de forma que las convenciones y el modelo de datos evolucionan en el mismo repositorio y bajo el mismo control de cambios que la aplicación.',
          ],
        },
      ],
    },
  },
]
