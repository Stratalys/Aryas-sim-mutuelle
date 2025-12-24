import { NextRequest, NextResponse } from 'next/server';
import { fetchActesMedicaux } from '@/lib/supabase/actes';
import type { ActeMedical } from '@/data/actesMedicaux';

/**
 * Headers CORS pour permettre l'accès depuis Wix
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Route API GET pour récupérer la liste des actes médicaux
 * 
 * @param request - La requête HTTP
 * @returns Réponse JSON avec la liste des actes médicaux
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer les actes médicaux depuis Supabase
    const actes = await fetchActesMedicaux();

    // Vérifier que les données contiennent bien tous les champs nécessaires
    const actesFormates = actes.map((acte: ActeMedical) => ({
      id: acte.id,
      nom: acte.nom,
      type_de_soin: acte.type_de_soin,
      bss: acte.bss,
      txRemboursementAm: acte.txRemboursementAm,
      partForfaitaire: acte.partForfaitaire,
    }));

    // Retourner la réponse avec CORS
    return NextResponse.json(
      {
        success: true,
        actes: actesFormates,
        count: actesFormates.length,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error('Erreur dans l\'API /api/actes:', error);

    // Retourner une erreur avec CORS
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Une erreur est survenue lors de la récupération des actes médicaux',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

/**
 * Route OPTIONS pour gérer les requêtes CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

