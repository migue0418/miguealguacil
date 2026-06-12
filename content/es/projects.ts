import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'Agente LLM integrado en Minecraft a través de un mod personalizado. El backend gestiona el contexto del juego en tiempo real mediante WebSocket y ejecuta acciones dentro del mundo usando LangGraph.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'RAG', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
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
        'Este TFM parte de la hipótesis de que un modelo tipo BERT ajustado específicamente para esta tarea (fine-tuning) puede ser competitivo, e incluso superior, frente a LLMs de propósito general usados en zero-shot o few-shot, incluso reduciendo de forma significativa el volumen de datos de entrenamiento.',
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
      links: [
        {
          label: 'Memoria (PDF)',
          url: 'https://github.com/migue0418/TFM-Miguel-Angel/blob/main/TFM%20-%20LLMs%20para%20detecci%C3%B3n%20autom%C3%A1tica%20de%20lenguaje%20sexista%20en%20redes%20sociales.pdf',
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
  },
]
