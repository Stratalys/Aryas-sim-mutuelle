export interface ResultatCalcul {
  remboursementAm: number;
  remboursementMutuelle: number;
  resteACharge: number;
}

/**
 * Calcule le reste à charge après remboursement de l'Assurance Maladie et de la Mutuelle
 * 
 * @param prixPaye - Prix réellement payé par le patient
 * @param bss - Base de Remboursement Sécurité Sociale
 * @param tauxRemboursementAm - Taux de remboursement AM (ex: 0.7 pour 70%)
 * @param partForfaitaire - Participation Forfaitaire/Franchise
 * @param tauxCouvertureMutuelle - Taux de couverture mutuelle en % (ex: 100, 150, 200, 300)
 * @returns Objet contenant les montants arrondis à 2 décimales
 */
export function calculerResteACharge(
  prixPaye: number,
  bss: number,
  tauxRemboursementAm: number,
  partForfaitaire: number,
  tauxCouvertureMutuelle: number
): ResultatCalcul {
  // Montant Remboursé par l'Assurance Maladie
  // R_am = (BSS × T_am) - PF
  const R_am = (bss * tauxRemboursementAm) - partForfaitaire;

  // Plafond de Remboursement par la Mutuelle
  // Plafond_mut = (BSS × (tauxCouvertureMutuelle / 100)) - R_am
  const Plafond_mut = (bss * (tauxCouvertureMutuelle / 100)) - R_am;

  // Montant Remboursé par la Mutuelle
  // R_mut = min((P_payé - R_am), Plafond_mut)
  // Note: La PF est déjà incluse dans R_am, donc on ne la déduit pas à nouveau
  const R_mut = Math.min(
    prixPaye - R_am,
    Plafond_mut
  );

  // Reste à Charge Final
  // RAC_final = P_payé - R_am - R_mut
  const RAC = prixPaye - R_am - R_mut;

  // Arrondir à 2 décimales
  return {
    remboursementAm: Math.round(R_am * 100) / 100,
    remboursementMutuelle: Math.round(R_mut * 100) / 100,
    resteACharge: Math.round(RAC * 100) / 100,
  };
}


