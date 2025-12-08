// app/blog-exemple/page.tsx
'use client';

import SimulateurModal from '@/components/SimulateurModal'; // Vérifiez le chemin de votre composant

export default function BlogExemple() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Comment bien choisir sa mutuelle en 2025 ?</h1>
      
      <div className="prose lg:prose-xl text-gray-700">
        <p className="mb-4">
          C&apos;est la question que tout le monde se pose. Les tarifs augmentent, les remboursements changent...
          Il est parfois difficile de s&apos;y retrouver entre le ticket modérateur et le 100% Santé.
        </p>
        
        <p className="mb-8">
          Avant de continuer votre lecture, nous vous conseillons de vérifier rapidement combien vous
          coûtent réellement vos soins actuels.
        </p>

        {/* C'est ici qu'on intègre votre simulateur en mode "Teaser" */}
        <div className="my-8 p-6 bg-lin rounded-xl border border-lin not-prose">
          <SimulateurModal />
        </div>

        <p className="mb-4">
          Maintenant que vous avez une idée plus claire, parlons des garanties hospitalisation...
          (Suite de l&apos;article fictif...)
        </p>
      </div>
    </div>
  );
}
