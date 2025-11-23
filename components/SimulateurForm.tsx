'use client';

import { useState, useEffect } from 'react';
import type { ActeMedical } from '@/data/actesMedicaux';
import { calculerResteACharge, type ResultatCalcul } from '@/lib/calculs';
import { fetchActesMedicaux } from '@/lib/supabase/actes';
import { sauvegarderLead } from '@/lib/supabase/leads';

export default function SimulateurForm() {
  const [actesMedicaux, setActesMedicaux] = useState<ActeMedical[]>([]);
  const [selectedTypeDeSoin, setSelectedTypeDeSoin] = useState<string>('');
  const [acteSelectionne, setActeSelectionne] = useState<ActeMedical | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prixPaye, setPrixPaye] = useState<string>('80');
  const [tauxCouvertureMutuelle, setTauxCouvertureMutuelle] = useState<number>(300);
  const [tauxMutuelleManuel, setTauxMutuelleManuel] = useState<boolean>(false);
  const [tauxMutuelleManuelValue, setTauxMutuelleManuelValue] = useState<string>('');
  const [resultat, setResultat] = useState<ResultatCalcul | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saisieManuelle, setSaisieManuelle] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bssManuel, setBssManuel] = useState<string>('');
  const [tauxAMManuel, setTauxAMManuel] = useState<string>('');
  const [partForfaitaireManuel, setPartForfaitaireManuel] = useState<string>('');
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    metier: '',
    message: '',
  });

  // Charger les actes médicaux depuis Supabase
  useEffect(() => {
    const loadActes = async () => {
      try {
        setLoading(true);
        setError(null);
        const actes = await fetchActesMedicaux();
        setActesMedicaux(actes);
        // Ne plus sélectionner automatiquement un acte, l'utilisateur doit choisir le type de soin d'abord
      } catch (err: any) {
        console.error('Erreur lors du chargement des actes médicaux:', err);
        const errorMessage = err?.message || 'Erreur inconnue';
        setError(`Erreur lors du chargement des actes médicaux: ${errorMessage}. Veuillez vérifier la console pour plus de détails.`);
      } finally {
        setLoading(false);
      }
    };

    loadActes();
  }, []);

  const handleCalculer = () => {
    if (!acteSelectionne) {
      alert('Veuillez sélectionner un acte médical');
      return;
    }

    const prix = parseFloat(prixPaye);
    if (isNaN(prix) || prix <= 0) {
      alert('Veuillez entrer un prix valide');
      return;
    }

    // Utiliser les valeurs manuelles si la checkbox est cochée, sinon utiliser les valeurs de l'acte sélectionné
    let bss = acteSelectionne.bss;
    let tauxAM = acteSelectionne.txRemboursementAm;
    let partForfaitaire = acteSelectionne.partForfaitaire;

    if (saisieManuelle) {
      const bssValue = parseFloat(bssManuel);
      const tauxAMValue = parseFloat(tauxAMManuel);
      const partForfaitaireValue = parseFloat(partForfaitaireManuel);

      if (isNaN(bssValue) || bssValue <= 0) {
        alert('Veuillez entrer une base de remboursement valide');
        return;
      }
      if (isNaN(tauxAMValue) || tauxAMValue < 0 || tauxAMValue > 100) {
        alert('Veuillez entrer un taux de remboursement AM valide (entre 0 et 100)');
        return;
      }

      bss = bssValue;
      tauxAM = tauxAMValue / 100; // Convertir le pourcentage en décimal
      partForfaitaire = isNaN(partForfaitaireValue) ? 0 : partForfaitaireValue;
    }

    // Calculer le taux de couverture mutuelle (manuel ou sélectionné)
    let tauxMutuelle = tauxCouvertureMutuelle;
    if (tauxMutuelleManuel) {
      const tauxManuelValue = parseFloat(tauxMutuelleManuelValue);
      if (isNaN(tauxManuelValue) || tauxManuelValue <= 0) {
        alert('Veuillez entrer un taux de mutuelle valide');
        return;
      }
      tauxMutuelle = tauxManuelValue;
    }

    const resultatCalcul = calculerResteACharge(
      prix,
      bss,
      tauxAM,
      partForfaitaire,
      tauxMutuelle
    );

    setResultat(resultatCalcul);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acteSelectionne || !resultat) {
      setSubmitMessage({
        type: 'error',
        text: 'Erreur: Veuillez d\'abord effectuer un calcul de remboursement.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Construire le nom complet (nom + prénom)
      const nomComplet = formData.prenom 
        ? `${formData.nom} ${formData.prenom}`.trim()
        : formData.nom;

      // Préparer les données pour Supabase
      const donneesLead = {
        nom_prospect: nomComplet,
        email: formData.email,
        telephone: formData.telephone || undefined,
        metier: formData.metier || undefined,
        acte_simule: acteSelectionne.nom,
        prix_paye: parseFloat(prixPaye),
        reste_a_charge: resultat.resteACharge,
      };

      // Sauvegarder dans Supabase
      await sauvegarderLead(donneesLead);

      // Afficher le message de succès
      setSubmitMessage({
        type: 'success',
        text: 'Merci, un conseiller vous recontactera bientôt !',
      });

      // Réinitialiser le formulaire après un court délai
      setTimeout(() => {
        setIsModalOpen(false);
        setFormData({
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          metier: '',
          message: '',
        });
        setSubmitMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du lead:', error);
      setSubmitMessage({
        type: 'error',
        text: error?.message || 'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermer le modal avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  const formatEuro = (montant: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(montant);
  };

  // Obtenir les types de soins uniques avec vérifications robustes
  let typesDeSoin: string[] = [];
  try {
    if (Array.isArray(actesMedicaux) && actesMedicaux.length > 0) {
      const typesExtraits = actesMedicaux
        .map((acte: ActeMedical) => {
          try {
            // Vérifier que l'acte existe et a une propriété type_de_soin
            if (!acte || typeof acte !== 'object') {
              return null;
            }
            const type = acte.type_de_soin;
            // Accepter uniquement les strings non vides
            if (typeof type === 'string' && type.trim().length > 0) {
              return type.trim();
            }
            return null;
          } catch (err) {
            console.error('[SimulateurForm] Erreur lors de l\'extraction du type_de_soin:', err, acte);
            return null;
          }
        })
        .filter((type): type is string => type !== null);
      
      typesDeSoin = Array.from(new Set(typesExtraits)).sort();
    } else {
      console.warn('[SimulateurForm] actesMedicaux n\'est pas un tableau valide ou est vide:', actesMedicaux);
    }
  } catch (err) {
    console.error('[SimulateurForm] Erreur lors de l\'extraction des types de soin:', err);
    typesDeSoin = [];
  }

  // Filtrer les actes selon le type de soin sélectionné avec vérifications
  let actesFiltres: ActeMedical[] = [];
  try {
    if (selectedTypeDeSoin && Array.isArray(actesMedicaux)) {
      actesFiltres = actesMedicaux.filter((acte: ActeMedical) => {
        try {
          return acte && acte.type_de_soin === selectedTypeDeSoin;
        } catch (err) {
          console.error('[SimulateurForm] Erreur lors du filtrage:', err, acte);
          return false;
        }
      });
    }
  } catch (err) {
    console.error('[SimulateurForm] Erreur lors du filtrage des actes:', err);
    actesFiltres = [];
  }

  // Réinitialiser l'acte sélectionné quand le type de soin change
  useEffect(() => {
    if (selectedTypeDeSoin) {
      setActeSelectionne(null);
      setResultat(null);
    }
  }, [selectedTypeDeSoin]);

  // Afficher un message d'erreur si le chargement a échoué
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-bleu-cobalt text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full mx-auto ${!resultat ? 'max-w-2xl' : 'max-w-6xl'}`}>
      {/* 
        NOTE: Le message de confirmation de chargement ("Chargement réussi - X actes disponibles - X types de soins")
        a été supprimé car c'était un message de débogage pour Vercel et n'est plus nécessaire en production.
        Le formulaire s'affiche directement sans message de confirmation.
      */}
      {/* Layout dynamique : Centré sans résultats, deux colonnes avec résultats */}
      <div className={`flex flex-col ${!resultat ? 'justify-center' : 'lg:flex-row gap-8'}`}>
        {/* Colonne gauche : Formulaire de simulation */}
        <div className={resultat ? 'lg:w-5/12' : 'w-full'}>
          <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-nikkei font-bold text-bleu-cobalt mb-6">
          Votre simulation
        </h2>

        <div className="space-y-5">
          {/* 1. Type de Soin */}
          <div>
            <label htmlFor="type-de-soin" className="block text-sm font-medium text-bleu-turquin mb-2">
              1. Choisissez le Type de Soin:
            </label>
            <select
              id="type-de-soin"
              value={selectedTypeDeSoin || ''}
              onChange={(e) => {
                try {
                  setSelectedTypeDeSoin(e.target.value);
                  setActeSelectionne(null);
                  setResultat(null);
                } catch (err) {
                  console.error('[SimulateurForm] Erreur lors du changement de type de soin:', err);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent text-bleu-turquin bg-white"
              disabled={loading || typesDeSoin.length === 0}
            >
              <option value="" className="text-bleu-turquin">
                {loading ? 'Chargement...' : typesDeSoin.length === 0 ? 'Aucun type disponible' : 'Sélectionnez un type de soin'}
              </option>
              {Array.isArray(typesDeSoin) && typesDeSoin.length > 0 ? (
                typesDeSoin.map((type, index) => {
                  try {
                    if (!type || typeof type !== 'string') {
                      console.warn('[SimulateurForm] Type invalide ignoré:', type, 'à l\'index', index);
                      return null;
                    }
                    return (
                      <option key={`${type}-${index}`} value={type} className="text-bleu-turquin">
                        {type}
                      </option>
                    );
                  } catch (err) {
                    console.error('[SimulateurForm] Erreur lors du rendu d\'une option de type:', err, type);
                    return null;
                  }
                }).filter(Boolean)
              ) : (
                <option value="" className="text-bleu-turquin" disabled>
                  Aucun type disponible
                </option>
              )}
            </select>
            {!loading && typesDeSoin.length === 0 && actesMedicaux.length > 0 && (
              <p className="mt-2 text-sm text-amber-600">
                ⚠ Aucun type de soin trouvé dans les données. Vérifiez que la colonne type_de_soin est présente.
              </p>
            )}
          </div>

          {/* 2. Prestation Spécifique - Affichée seulement si un type de soin est sélectionné */}
          {selectedTypeDeSoin && (
            <div>
              <label htmlFor="acte" className="block text-sm font-medium text-bleu-turquin mb-2">
                2. Choisissez la Prestation:
              </label>
              <select
                id="acte"
                value={acteSelectionne?.id || ''}
                onChange={(e) => {
                  try {
                    const acteId = parseInt(e.target.value);
                    if (isNaN(acteId)) {
                      console.warn('[SimulateurForm] ID d\'acte invalide:', e.target.value);
                      return;
                    }
                    const acte = actesFiltres.find(a => a && a.id === acteId);
                    if (acte) {
                      setActeSelectionne(acte);
                      setResultat(null);
                    } else {
                      console.warn('[SimulateurForm] Acte non trouvé pour l\'ID:', acteId);
                    }
                  } catch (err) {
                    console.error('[SimulateurForm] Erreur lors de la sélection d\'un acte:', err);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent text-bleu-turquin bg-white"
                disabled={!Array.isArray(actesFiltres) || actesFiltres.length === 0}
              >
                <option value="" className="text-bleu-turquin">
                  {!Array.isArray(actesFiltres) || actesFiltres.length === 0 ? 'Aucune prestation disponible' : 'Sélectionnez une prestation'}
                </option>
                {Array.isArray(actesFiltres) && actesFiltres.length > 0 ? (
                  actesFiltres.map((acte, index) => {
                    try {
                      if (!acte || !acte.id || !acte.nom) {
                        console.warn('[SimulateurForm] Acte invalide ignoré:', acte, 'à l\'index', index);
                        return null;
                      }
                      return (
                        <option key={`${acte.id}-${index}`} value={acte.id} className="text-bleu-turquin">
                          {acte.nom}
                        </option>
                      );
                    } catch (err) {
                      console.error('[SimulateurForm] Erreur lors du rendu d\'une option d\'acte:', err, acte);
                      return null;
                    }
                  }).filter(Boolean)
                ) : (
                  <option value="" className="text-bleu-turquin" disabled>
                    Aucune prestation disponible
                  </option>
                )}
              </select>
              {actesFiltres.length === 0 && selectedTypeDeSoin && (
                <p className="mt-2 text-sm text-amber-600">
                  ⚠ Aucune prestation trouvée pour ce type de soin.
                </p>
              )}
            </div>
          )}

          {/* Checkbox pour saisie manuelle - Affiché seulement si une prestation est sélectionnée */}
          {acteSelectionne && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="saisie-manuelle"
                checked={saisieManuelle}
                onChange={(e) => {
                  setSaisieManuelle(e.target.checked);
                  if (!e.target.checked) {
                    // Réinitialiser les valeurs manuelles quand on décoche
                    setBssManuel('');
                    setTauxAMManuel('');
                    setPartForfaitaireManuel('');
                  }
                }}
                className="mr-2 w-4 h-4 text-bleu-cobalt border-gray-300 rounded focus:ring-bleu-cobalt"
              />
              <label htmlFor="saisie-manuelle" className="text-sm text-bleu-turquin cursor-pointer">
                Saisir manuellement la base de remboursement
              </label>
            </div>
          )}

          {/* Bloc d'informations de remboursement - Affichage automatique */}
          {!saisieManuelle && acteSelectionne && (
            <div className="bg-lin rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-bleu-turquin">Base de remboursement (BSS):</span>
                <span className="text-sm font-semibold text-bleu-turquin">{formatEuro(acteSelectionne.bss)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-bleu-turquin">Taux de remboursement AM:</span>
                <span className="text-sm font-semibold text-bleu-turquin">{(acteSelectionne.txRemboursementAm * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-bleu-turquin">Participation forfaitaire:</span>
                <span className="text-sm font-semibold text-bleu-turquin">{formatEuro(acteSelectionne.partForfaitaire)}</span>
              </div>
            </div>
          )}

          {/* Bloc de saisie manuelle */}
          {saisieManuelle && (
            <div className="bg-lin rounded-md p-4 space-y-4">
              <div>
                <label htmlFor="bss-manuel" className="block text-sm font-semibold text-bleu-turquin mb-2">
                  Base de remboursement (BSS) (€):
                </label>
                <input
                  type="number"
                  id="bss-manuel"
                  value={bssManuel}
                  onChange={(e) => setBssManuel(e.target.value)}
                  placeholder="Ex: 26.50"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="taux-am-manuel" className="block text-sm font-semibold text-bleu-turquin mb-2">
                  Taux de l&apos;A.M. (%):
                </label>
                <input
                  type="number"
                  id="taux-am-manuel"
                  value={tauxAMManuel}
                  onChange={(e) => setTauxAMManuel(e.target.value)}
                  placeholder="Ex: 70"
                  min="0"
                  max="100"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="part-forfaitaire-manuel" className="block text-sm font-semibold text-bleu-turquin mb-2">
                  Participation forfaitaire (€) (Optionnel):
                </label>
                <input
                  type="number"
                  id="part-forfaitaire-manuel"
                  value={partForfaitaireManuel}
                  onChange={(e) => setPartForfaitaireManuel(e.target.value)}
                  placeholder="Ex: 2.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Coût réel - Affiché seulement si une prestation est sélectionnée */}
          {acteSelectionne && (
            <div>
              <label htmlFor="prix" className="block text-sm font-medium text-bleu-turquin mb-2">
                Coût Réel de l&apos;acte (€):
              </label>
              <input
                type="number"
                id="prix"
                value={prixPaye}
                onChange={(e) => setPrixPaye(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
              />
            </div>
          )}

          {/* Taux de mutuelle - Affiché seulement si une prestation est sélectionnée */}
          {acteSelectionne && (
          <div>
            <label htmlFor="taux-mutuelle" className="block text-sm font-medium text-bleu-turquin mb-2">
              Taux de votre mutuelle (% BSS):
            </label>
            <select
              id="taux-mutuelle"
              value={tauxMutuelleManuel ? 'manuel' : tauxCouvertureMutuelle}
              onChange={(e) => {
                if (e.target.value === 'manuel') {
                  setTauxMutuelleManuel(true);
                } else {
                  setTauxMutuelleManuel(false);
                  setTauxCouvertureMutuelle(parseInt(e.target.value));
                  setTauxMutuelleManuelValue('');
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
            >
              <option value={100}>100%</option>
              <option value={150}>150%</option>
              <option value={200}>200%</option>
              <option value={250}>250%</option>
              <option value={300}>300%</option>
              <option value="manuel">Saisir manuellement</option>
            </select>
            {tauxMutuelleManuel && (
              <div className="mt-3">
                <label htmlFor="taux-mutuelle-manuel" className="block text-sm font-medium text-bleu-turquin mb-2">
                  Taux de mutuelle (% BSS):
                </label>
                <input
                  type="number"
                  id="taux-mutuelle-manuel"
                  value={tauxMutuelleManuelValue}
                  onChange={(e) => setTauxMutuelleManuelValue(e.target.value)}
                  placeholder="Ex: 325"
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                />
              </div>
            )}
          </div>
          )}

          {/* Bouton Calculer */}
          <button
            onClick={handleCalculer}
            className="w-full bg-bleu-cobalt text-white font-semibold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Calculer le remboursement
          </button>
        </div>
          </div>
        </div>

        {/* Colonne droite : Résultats et CTA */}
        {resultat && (
          <div className="lg:w-7/12 flex-shrink-0 space-y-6">
            {/* Carte de résultat */}
            <div className="bg-bleu-turquin rounded-xl shadow-md p-5">
              <h3 className="text-2xl font-nikkei font-bold text-white mb-4">
                Résultat de votre simulation
              </h3>
              <div className="space-y-0">
                <div className="flex justify-between items-center border-b border-white/30 pb-3 mb-3">
                  <span className="text-white text-base">Remboursement A.M. :</span>
                  <span className="text-white font-semibold text-lg">{formatEuro(resultat.remboursementAm)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/30 pb-3 mb-3">
                  <span className="text-white text-base">Remboursement Mutuelle :</span>
                  <span className="text-white font-semibold text-lg">{formatEuro(resultat.remboursementMutuelle)}</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-white font-semibold text-lg">Reste à votre charge :</span>
                  <span className="text-ambre font-bold text-4xl">{formatEuro(resultat.resteACharge)}</span>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-2xl font-nikkei font-bold text-bleu-cobalt mb-3 text-center">
                Besoin d&apos;une meilleure couverture ?
              </h3>
              <p className="text-bleu-turquin mb-4 leading-relaxed text-base">
                Si votre reste à charge vous semble trop élevé, il est peut-être temps d&apos;analyser votre contrat. Je peux vous aider à trouver une solution plus adaptée à vos besoins.
              </p>
              <button
                onClick={handleOpenModal}
                className="bg-ambre text-chocolat font-semibold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors w-full"
              >
                Analyser ma couverture
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-nikkei font-bold text-bleu-cobalt">
                Analyser ma couverture
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-chocolat transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-bleu-turquin mb-6">
              Laissez-moi vos coordonnées pour une analyse personnalisée et gratuite.
            </p>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-bleu-turquin mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="nom"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-bleu-turquin mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-bleu-turquin mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-bleu-turquin mb-2">
                  Téléphone (Optionnel)
                </label>
                <input
                  type="tel"
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="metier" className="block text-sm font-medium text-bleu-turquin mb-2">
                  Métier (Optionnel)
                </label>
                <input
                  type="text"
                  id="metier"
                  value={formData.metier}
                  onChange={(e) => setFormData({ ...formData, metier: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-bleu-turquin mb-2">
                  Message (Optionnel)
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-bleu-cobalt focus:border-transparent resize-y"
                />
              </div>

              {/* Message de succès ou d'erreur */}
              {submitMessage && (
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    submitMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <p className="text-sm font-medium">{submitMessage.text}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-bleu-cobalt text-white font-semibold py-3 px-6 rounded-lg transition-colors ${
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-opacity-90'
                }`}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

