import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'LLM agent integrated into Minecraft through a custom mod. The backend manages in-game context in real time via WebSocket and executes actions inside the world using LangGraph.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'RAG', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
  },
  {
    id: 'tfm-sexism-classifier',
    name: "Master's Thesis: Detecting Sexism on Social Media with BERT and LLMs",
    description:
      "Master's thesis comparing fine-tuned BERT/ModernBERT models against zero/few-shot LLMs for detecting explicit and implicit sexist language on social media.",
    stack: ['Python', 'PyTorch', 'Transformers', 'BERT', 'ModernBERT', 'FastAPI', 'React', 'SQLite'],
    repoUrl: 'https://github.com/migue0418/TFM-Miguel-Angel',
    featured: true,
    detail: {
      summary: [
        'Sexism on social media shows up both explicitly and implicitly, which makes automatic moderation hard: current systems often confuse sexist content with posts that simply report or criticize it, and performance drops sharply when moving from one domain (e.g. Twitter) to another (e.g. forums or Reddit).',
        'This thesis starts from the hypothesis that a BERT-style model fine-tuned specifically for this task can be competitive with, or even outperform, general-purpose LLMs used in zero-shot or few-shot settings, even when the training data is significantly reduced.',
      ],
      sections: [
        {
          heading: 'Datasets',
          paragraphs: [
            'EDOS (SemEval-2023 Task 10): a Reddit and Gab dataset with 5,000 to 20,000 labeled examples, used in its binary, 3-class, and 4-class variants to evaluate different levels of granularity in sexism detection.',
            'RedditBIAS: around 3,000 sentences focused on gender bias, used to evaluate how well the model generalizes to a domain different from the one it was trained on.',
            'Synthetic sentence set: 15 sentences designed specifically for this thesis, spread across 3 classes, enabling a quick qualitative check of model behaviour on edge cases.',
          ],
        },
        {
          heading: 'Methodology',
          paragraphs: [
            'Preprocessing of the datasets (text cleaning, balancing classes 50/50 to avoid bias from class imbalance) and splitting into training, validation, and test sets with a 70/10/20 ratio.',
            'Hyperparameter search via a grid search over 54 combinations (learning rate, batch size, number of epochs, etc.) to find the optimal fine-tuning configuration for the BERT and ModernBERT models.',
            'Evaluation of LLMs via few-shot prompting (k=6 examples for binary classification, k=12 for 4-class classification) using logits masking to restrict model output to valid classes.',
            'Evaluation metrics: macro F1, precision, recall, and accuracy, computed consistently across all models and datasets.',
          ],
        },
        {
          heading: 'Conclusions',
          paragraphs: [
            'Fine-tuned BERT-style models consistently outperform un-tuned LLMs: even the best result obtained with Mistral-7B-Instruct in few-shot (F1 = 0.413) is more than 40 percentage points below the fine-tuned models.',
            'Reducing the EDOS training set from 20,000 to 10,000 examples is viable: it saves roughly 87% of GPU-hours at the cost of only 4 percentage points of F1.',
            'Identified limitations: confusion between critical/reporting content and sexist content, difficulty detecting irony and sarcasm, and the lack of multilingual evaluation, which remains open as future work.',
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
        { label: 'F1 (synthetic sentences, BERT)', value: '0.95-0.96' },
      ],
      links: [
        {
          label: 'Thesis (PDF)',
          url: 'https://github.com/migue0418/TFM-Miguel-Angel/blob/main/TFM%20-%20LLMs%20para%20detecci%C3%B3n%20autom%C3%A1tica%20de%20lenguaje%20sexista%20en%20redes%20sociales.pdf',
        },
      ],
    },
  },
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Full stack template with SDD and development best practices. Includes pre-commit hooks, Git Flow, Docker, and modular structure for production projects.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
  },
]
