import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Récupère les variables d'environnement Supabase en essayant plusieurs variantes
 * pour une meilleure compatibilité avec différents environnements de déploiement
 */
function getSupabaseEnv() {
  // Essayer d'abord avec NEXT_PUBLIC_ (pour le client-side)
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Si non trouvées, essayer sans le préfixe (pour compatibilité)
  if (!supabaseUrl) {
    supabaseUrl = process.env.SUPABASE_URL?.trim();
  }
  if (!supabaseAnonKey) {
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
  }

  // Debug: afficher ce qui est trouvé (sans exposer les valeurs complètes)
  if (typeof window !== 'undefined') {
    console.log('[Supabase] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
    });
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Instance lazy du client Supabase
let supabaseInstance: SupabaseClient | null = null;

/**
 * Obtient ou crée le client Supabase de manière lazy
 * @returns Le client Supabase ou null si les variables d'environnement sont manquantes
 */
function getSupabaseClient(): SupabaseClient | null {
  // Si déjà initialisé, retourner l'instance
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    // Ne pas afficher d'erreur en production pour éviter les logs inutiles
    // L'erreur sera levée uniquement lors de l'utilisation du client
    if (typeof window !== 'undefined') {
      console.warn(
        '[Supabase] Missing environment variables. ' +
        'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel.'
      );
    }
    return null;
  }

  // Créer et stocker l'instance
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

/**
 * Client Supabase exporté
 * Utilise une initialisation lazy pour éviter les erreurs au chargement du module
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      // Si le client n'est pas disponible, créer un objet qui lance une erreur descriptive
      // seulement lors de l'utilisation réelle
      if (prop === 'from') {
        return (tableName: string) => {
          const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
          const errorDetails = {
            message: 'Supabase client not initialized',
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseAnonKey,
            suggestion: 'Please check your environment variables in Vercel project settings. ' +
              'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set ' +
              'and that you have redeployed after adding them.',
          };
          console.error('[Supabase Error]', errorDetails);
          throw new Error(
            `${errorDetails.message}. URL: ${errorDetails.hasUrl ? '✓' : '✗'}, Key: ${errorDetails.hasKey ? '✓' : '✗'}. ` +
            errorDetails.suggestion
          );
        };
      }
      // Pour les autres propriétés, retourner une fonction qui lance une erreur
      return () => {
        const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
        throw new Error(
          `Supabase client not initialized. URL: ${!!supabaseUrl ? 'found' : 'missing'}, Key: ${!!supabaseAnonKey ? 'found' : 'missing'}. ` +
          'Please check your environment variables in Vercel and redeploy.'
        );
      };
    }
    const value = client[prop as keyof SupabaseClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

