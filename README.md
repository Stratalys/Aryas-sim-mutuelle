# Simulateur de Remboursement Mutuelle

Application Next.js 14 pour simuler le remboursement mutuelle et calculer le reste à charge après remboursement de l'Assurance Maladie et de la mutuelle.

## Technologies

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Build

```bash
npm run build
npm start
```

## Structure du projet

```
├── app/
│   ├── layout.tsx      # Layout principal avec métadonnées SEO
│   ├── page.tsx        # Page d'accueil
│   └── globals.css     # Styles globaux Tailwind
├── components/
│   └── SimulateurForm.tsx  # Composant principal du simulateur
├── data/
│   └── actesMedicaux.ts    # Données des actes médicaux (à remplacer par Supabase)
├── lib/
│   └── calculs.ts          # Fonctions de calcul de remboursement
└── tailwind.config.js      # Configuration Tailwind avec couleurs du brandbook
```

## Notes

- Les données des actes médicaux sont actuellement stockées localement dans `data/actesMedicaux.ts`
- Un commentaire dans `components/SimulateurForm.tsx` indique où remplacer par un appel Supabase
- Les polices PP Nikkei Maru et Open Sans sont configurées (PP Nikkei Maru nécessite une importation locale si non disponible sur Google Fonts)

## Brandbook

- **Couleurs :**
  - BLEU COBALT: `#506EF9`
  - BLEU TURQUIN: `#394869`
  - BABY BLUE: `#8DADBE`
  - CHOCOLAT: `#381D01`
  - AMBRE: `#F2BA05`
  - LIN: `#F2EADA`

- **Typographie :**
  - PP Nikkei Maru : Titres
  - Open Sans : Corps de texte


