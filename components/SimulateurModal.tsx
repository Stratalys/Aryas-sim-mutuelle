'use client';

import { useState, useEffect } from 'react';
import SimulateurForm from './SimulateurForm';

export default function SimulateurModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Fermer la modale avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Carte CTA - État fermé */}
      {!isOpen && (
        <div className="bg-lin rounded-xl shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-nikkei font-bold text-bleu-cobalt mb-3">
              Estimez vos remboursements
            </h3>
            <p className="text-bleu-turquin mb-6 font-open leading-relaxed max-w-md mx-auto">
              Calculez rapidement le reste à charge de vos actes médicaux après remboursement de l&apos;Assurance Maladie et de votre mutuelle.
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Bouton cliqué, ouverture de la modale');
                setIsOpen(true);
              }}
              className="bg-bleu-cobalt text-white font-semibold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
              type="button"
            >
              Lancer la simulation
            </button>
          </div>
        </div>
      )}

      {/* Modale - État ouvert */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-bleu-turquin/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            // Fermer si on clique sur le fond (pas sur le contenu)
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto relative">
            {/* Bouton fermer (X) */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-baby-blue/20 transition-colors text-bleu-turquin hover:text-bleu-cobalt"
              aria-label="Fermer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Contenu de la modale */}
            <div className="p-6 md:p-8">
              <SimulateurForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

