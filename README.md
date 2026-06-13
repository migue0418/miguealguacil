# miguealguacil.com

Portfolio personal de Miguel Alguacil, desplegado en [miguealguacil.com](https://miguealguacil.com).

Sitio bilingüe (ES/EN) generado estáticamente con Next.js 16 (App Router + SSG), sin backend propio. Incluye una landing con hero, secciones de proyectos —con páginas de detalle individuales—, stack tecnológico, experiencia, educación y contacto, con animaciones mediante Framer Motion y scroll suave con Lenis.

## Stack

- Next.js 16 (App Router, SSG)
- TypeScript
- Tailwind CSS v4
- next-intl v4 (i18n ES/EN)
- Framer Motion v12 + Lenis v1
- Vitest + Testing Library (unit) / Playwright (E2E)

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Verificación

```bash
npm run lint && npm run test && npm run build
```

## Tests E2E

```bash
npx playwright test
```

## Despliegue

Desplegado en [Vercel](https://vercel.com) (plan Hobby) desde la rama `main`.
