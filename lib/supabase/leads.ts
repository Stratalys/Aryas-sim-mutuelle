import { supabase } from './client';

export interface DonneesLead {
  nom_prospect: string;
  email: string;
  telephone?: string;
  metier?: string;
  acte_simule: string;
  prix_paye: number;
  reste_a_charge: number;
}

/**
 * Sauvegarde un lead dans la table prospects_mutuelle
 * @param donnees - Les données du prospect à sauvegarder
 * @returns Promise avec le résultat de l'insertion
 */
export async function sauvegarderLead(donnees: DonneesLead) {
  try {
    const { data, error } = await supabase
      .from('prospects_mutuelle')
      .insert([
        {
          nom_prospect: donnees.nom_prospect,
          email: donnees.email,
          telephone: donnees.telephone || null,
          metier: donnees.metier || null,
          acte_simule: donnees.acte_simule,
          prix_paye: donnees.prix_paye,
          reste_a_charge: donnees.reste_a_charge,
        },
      ])
      .select();

    if (error) {
      console.error('Erreur lors de la sauvegarde du lead:', error);
      throw error;
    }

    console.log('Lead sauvegardé avec succès:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Erreur complète lors de la sauvegarde du lead:', error);
    throw error;
  }
}

