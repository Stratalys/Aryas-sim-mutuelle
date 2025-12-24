import { NextRequest, NextResponse } from 'next/server';
import { calculerResteACharge } from '@/lib/calculs';
import { sauvegarderLead } from '@/lib/supabase/leads';
import { fetchActesMedicaux } from '@/lib/supabase/actes';
import type { ActeMedical } from '@/data/actesMedicaux';

/**
 * Interface pour les données de la requête
 */
interface CalculRequest {
  // Données pour le calcul
  prixPaye: number;
  acteId?: number; // ID de l'acte médical (optionnel si on fournit les données directement)
  acteNom?: string; // Nom de l'acte (pour identification)
  bss?: number; // Base de remboursement (optionnel si acteId fourni)
  tauxRemboursementAm?: number; // Taux AM (optionnel si acteId fourni)
  partForfaitaire?: number; // Participation forfaitaire (optionnel si acteId fourni)
  tauxCouvertureMutuelle: number; // Taux de couverture mutuelle (100, 150, 200, 300, etc.)
  
  // Données du formulaire (optionnel, pour sauvegarder le lead)
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  metier?: string;
  message?: string;
  sauvegarderLead?: boolean; // Si true, sauvegarde le lead dans Supabase
}

/**
 * Route API POST pour calculer le remboursement
 * 
 * @param request - La requête HTTP
 * @returns Réponse JSON avec le résultat du calcul
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que la requête contient du JSON
    const body: CalculRequest = await request.json();

    // Validation des données requises
    if (!body.prixPaye || body.prixPaye <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le prix payé est requis et doit être supérieur à 0' 
        },
        { status: 400 }
      );
    }

    if (!body.tauxCouvertureMutuelle || body.tauxCouvertureMutuelle <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le taux de couverture mutuelle est requis et doit être supérieur à 0' 
        },
        { status: 400 }
      );
    }

    // Récupérer les données de l'acte médical
    let bss: number;
    let tauxRemboursementAm: number;
    let partForfaitaire: number;
    let acteNom: string;

    if (body.acteId) {
      // Si un ID d'acte est fourni, récupérer les données depuis Supabase
      const actes = await fetchActesMedicaux();
      const acte = actes.find((a: ActeMedical) => a.id === body.acteId);
      
      if (!acte) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Acte médical avec l'ID ${body.acteId} introuvable` 
          },
          { status: 404 }
        );
      }

      bss = acte.bss;
      tauxRemboursementAm = acte.txRemboursementAm;
      partForfaitaire = acte.partForfaitaire;
      acteNom = acte.nom;
    } else if (body.bss && body.tauxRemboursementAm !== undefined) {
      // Si les données sont fournies directement
      bss = body.bss;
      tauxRemboursementAm = body.tauxRemboursementAm;
      partForfaitaire = body.partForfaitaire || 0;
      acteNom = body.acteNom || 'Acte personnalisé';
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vous devez fournir soit un acteId, soit les données de l\'acte (bss, tauxRemboursementAm)' 
        },
        { status: 400 }
      );
    }

    // Validation des données de l'acte
    if (bss <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La base de remboursement (BSS) doit être supérieure à 0' 
        },
        { status: 400 }
      );
    }

    if (tauxRemboursementAm < 0 || tauxRemboursementAm > 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le taux de remboursement AM doit être entre 0 et 1 (ex: 0.7 pour 70%)' 
        },
        { status: 400 }
      );
    }

    // Effectuer le calcul
    const resultat = calculerResteACharge(
      body.prixPaye,
      bss,
      tauxRemboursementAm,
      partForfaitaire,
      body.tauxCouvertureMutuelle
    );

    // Préparer la réponse
    const response = {
      success: true,
      resultat: {
        remboursementAm: resultat.remboursementAm,
        remboursementMutuelle: resultat.remboursementMutuelle,
        resteACharge: resultat.resteACharge,
      },
      details: {
        prixPaye: body.prixPaye,
        bss: bss,
        tauxRemboursementAm: tauxRemboursementAm,
        partForfaitaire: partForfaitaire,
        tauxCouvertureMutuelle: body.tauxCouvertureMutuelle,
        acteNom: acteNom,
      },
    };

    // Sauvegarder le lead dans Supabase si demandé et si les données nécessaires sont fournies
    if (body.sauvegarderLead && body.nom && body.email) {
      try {
        await sauvegarderLead({
          nom_prospect: body.nom,
          prenom: body.prenom || undefined,
          email: body.email,
          telephone: body.telephone || undefined,
          metier: body.metier || undefined,
          message: body.message || undefined,
          acte_simule: acteNom,
          prix_paye: body.prixPaye,
          reste_a_charge: resultat.resteACharge,
        });

        // Ajouter l'information de sauvegarde à la réponse
        return NextResponse.json({
          ...response,
          leadSauvegarde: true,
          message: 'Calcul effectué et lead sauvegardé avec succès',
        });
      } catch (error: any) {
        // Si la sauvegarde échoue, on retourne quand même le résultat du calcul
        console.error('Erreur lors de la sauvegarde du lead:', error);
        return NextResponse.json({
          ...response,
          leadSauvegarde: false,
          warning: 'Calcul effectué mais erreur lors de la sauvegarde du lead',
          errorDetails: error?.message || 'Erreur inconnue',
        });
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erreur dans l\'API /api/calculer:', error);

    // Gestion des erreurs de parsing JSON
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Format de requête invalide. Le body doit être du JSON valide.' 
        },
        { status: 400 }
      );
    }

    // Erreur générique
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Une erreur est survenue lors du calcul',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Route GET pour documenter l'API
 */
export async function GET() {
  return NextResponse.json({
    message: 'API de calcul de remboursement mutuelle',
    method: 'POST',
    endpoint: '/api/calculer',
    description: 'Calcule le reste à charge après remboursement de l\'Assurance Maladie et de la Mutuelle',
    parameters: {
      required: {
        prixPaye: 'number - Prix réellement payé par le patient',
        tauxCouvertureMutuelle: 'number - Taux de couverture mutuelle (100, 150, 200, 300, etc.)',
      },
      optional: {
        acteId: 'number - ID de l\'acte médical (pour récupérer bss, tauxRemboursementAm, partForfaitaire)',
        bss: 'number - Base de remboursement (si acteId non fourni)',
        tauxRemboursementAm: 'number - Taux de remboursement AM entre 0 et 1 (si acteId non fourni)',
        partForfaitaire: 'number - Participation forfaitaire (défaut: 0)',
        acteNom: 'string - Nom de l\'acte médical',
        sauvegarderLead: 'boolean - Si true, sauvegarde le lead dans Supabase',
        nom: 'string - Nom du prospect (requis si sauvegarderLead = true)',
        prenom: 'string - Prénom du prospect',
        email: 'string - Email du prospect (requis si sauvegarderLead = true)',
        telephone: 'string - Téléphone du prospect',
        metier: 'string - Métier du prospect',
        message: 'string - Message du prospect',
      },
    },
    example: {
      request: {
        prixPaye: 80,
        acteId: 1,
        tauxCouvertureMutuelle: 300,
        sauvegarderLead: true,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
      },
      response: {
        success: true,
        resultat: {
          remboursementAm: 17.5,
          remboursementMutuelle: 57.5,
          resteACharge: 5.0,
        },
        details: {
          prixPaye: 80,
          bss: 25.0,
          tauxRemboursementAm: 0.7,
          partForfaitaire: 1.0,
          tauxCouvertureMutuelle: 300,
          acteNom: 'Consultation Généraliste Secteur 1',
        },
        leadSauvegarde: true,
        message: 'Calcul effectué et lead sauvegardé avec succès',
      },
    },
  });
}

