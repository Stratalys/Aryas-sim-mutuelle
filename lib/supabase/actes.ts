import { supabase } from './client';
import type { ActeMedical } from '@/data/actesMedicaux';

/**
 * Récupère tous les actes médicaux depuis Supabase
 * @returns Promise<ActeMedical[]> - Liste des actes médicaux
 */
export async function fetchActesMedicaux(): Promise<ActeMedical[]> {
  try {
    console.log('Tentative de connexion à Supabase...');
    
    // Essayer plusieurs noms de tables possibles
    const tableNames = ['actes_mutuelle', 'actes_medicaux', 'actes'];
    let data: any[] | null = null;
    let error: any = null;
    let usedTableName = '';

    for (const tableName of tableNames) {
      console.log(`Tentative avec la table: ${tableName}`);
      const result = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });
      
      if (!result.error && result.data) {
        data = result.data;
        usedTableName = tableName;
        console.log(`✓ Table "${tableName}" trouvée et accessible`);
        break;
      } else {
        console.log(`✗ Table "${tableName}" non accessible:`, result.error?.message);
        error = result.error;
      }
    }

    if (!data) {
      if (error) {
        console.error('Erreur Supabase détaillée:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Erreur Supabase: ${error.message}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`);
      }
      throw new Error('Aucune table accessible. Vérifiez que la table existe et que les permissions RLS sont correctement configurées.');
    }

    if (data.length === 0) {
      console.warn(`Aucun acte médical trouvé dans la table ${usedTableName}`);
      throw new Error(`La table ${usedTableName} est vide`);
    }

    console.log(`✓ Nombre d'actes récupérés depuis "${usedTableName}": ${data.length}`);
    
    // Afficher le contenu complet du premier acte
    const premierActe = data[0];
    console.log('=== PREMIER ACTE (structure complète) ===');
    console.log('Premier acte:', premierActe);
    console.log('Premier acte (JSON):', JSON.stringify(premierActe, null, 2));
    console.log('Clés disponibles:', Object.keys(premierActe || {}));
    console.log('Type de chaque propriété:');
    if (premierActe) {
      Object.keys(premierActe).forEach(key => {
        console.log(`  - ${key}: ${typeof premierActe[key]} = ${premierActe[key]}`);
      });
    }
    console.log('==========================================');

    // Mapper les données de Supabase vers le format ActeMedical
    // Note: Ajustez les noms de colonnes si nécessaire selon votre schéma Supabase
    // Colonnes attendues: id, nom, bss, tx_remboursement_am (ou txRemboursementAm), part_forfaitaire (ou partForfaitaire)
    const mappedData: ActeMedical[] = data
      .map((acte: any, index: number): ActeMedical | null => {
        // Utiliser les noms de colonnes exacts de la table Supabase
        const acteId = acte.id;
        const acteNom = acte.nom_acte; // Nom exact de la colonne dans Supabase

        // Vérifier que les données essentielles existent
        if (!acteId || !acteNom) {
          console.warn(`Acte invalide ignoré (index ${index}):`, {
            id: acteId,
            nom_acte: acteNom,
            toutesLesClés: Object.keys(acte),
            acteComplet: acte
          });
          return null;
        }

        // Déterminer la valeur de type_de_soin explicitement - toujours une string
        // Si la valeur est null, undefined, ou n'est pas une string dans la DB, on utilise une chaîne vide
        // Garantit que type_de_soin est toujours de type string (non optionnel, non nullable)
        let typeDeSoin: string = "";
        if (acte.type_de_soin !== null && acte.type_de_soin !== undefined) {
          const trimmed = String(acte.type_de_soin).trim();
          if (trimmed.length > 0) {
            typeDeSoin = trimmed;
          }
        }

        const mapped: ActeMedical = {
          id: Number(acteId),
          nom: String(acteNom).trim(),
          type_de_soin: typeDeSoin,
          bss: parseFloat(acte.bss || 0) || 0,
          txRemboursementAm: parseFloat(acte.tx_remb_am || 0) || 0, // Nom exact: tx_remb_am
          partForfaitaire: parseFloat(acte.part_forfaitaire || 0) || 0,
        };

        // Vérifier que le nom n'est pas vide après trim
        if (!mapped.nom) {
          console.warn(`Acte avec nom vide ignoré (index ${index}):`, acte);
          return null;
        }

        return mapped;
      })
      .filter((acte): acte is ActeMedical => acte !== null);

    if (mappedData.length === 0) {
      throw new Error('Aucun acte médical valide trouvé après le mapping. Vérifiez la structure de vos données.');
    }

    console.log(`✓ ${mappedData.length} actes mappés avec succès`);
    return mappedData;
  } catch (error: any) {
    console.error('Erreur complète lors de la récupération des actes médicaux:', error);
    throw error;
  }
}

