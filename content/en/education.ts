import type { EducationData } from '@/lib/types'

export const educationData: EducationData = {
  degrees: [
    {
      id: 'master-ugr',
      degree: "Master's Degree in Data Science and Computer Engineering",
      institution: 'Universidad de Granada',
      startYear: 2023,
      endYear: 2025,
      specialization: 'Data Science and Intelligent Technologies',
    },
    {
      id: 'grado-ugr',
      degree: "Bachelor's Degree in Computer Engineering",
      institution: 'Universidad de Granada',
      startYear: 2017,
      endYear: 2022,
      exchange: {
        institution: 'Åbo Akademi University',
        city: 'Turku',
        country: 'Finland',
        startYear: 2019,
        endYear: 2020,
      },
    },
  ],
  certifications: [
    {
      id: 'nvidia-cuda-python',
      name: 'Fundamentals of Accelerated Computing with CUDA Python',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'fxy9PAM8SDS_Q3KlOR6FiA',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=-eCWdDy5Q-agVRZB1sbBYg',
    },
    {
      id: 'nvidia-deep-learning',
      name: 'Getting Started with Deep Learning',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'M0S7oiZMQcO9R966P9O6-Q',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=z81gjItNQgG3VfGLs1EaNQ',
    },
    {
      id: 'nvidia-prompt-engineering',
      name: 'Building LLM Applications With Prompt Engineering',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'v4rq1bLWQO-q2Ymc5WeYfw',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=XCTUF8gkS4u29cEQRcSr2Q',
    },
  ],
}
