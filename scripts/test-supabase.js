// Script de test pour vérifier la connexion Supabase
// Exécuter avec: node scripts/test-supabase.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL Supabase:', supabaseUrl ? '✓ Définie' : '✗ Manquante');
console.log('Clé Supabase:', supabaseAnonKey ? '✓ Définie' : '✗ Manquante');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\nTest de connexion à Supabase...');
    
    // Test 1: Vérifier la table actes_mutuelle
    console.log('\n1. Test de la table "actes_mutuelle"...');
    const { data: data1, error: error1 } = await supabase
      .from('actes_mutuelle')
      .select('*')
      .limit(1);
    
    if (error1) {
      console.error('❌ Erreur:', error1.message);
      console.error('   Détails:', error1.details);
      console.error('   Hint:', error1.hint);
    } else {
      console.log('✓ Table "actes_mutuelle" accessible');
      console.log('   Nombre de lignes:', data1?.length || 0);
      if (data1 && data1.length > 0) {
        console.log('   Exemple de données:', JSON.stringify(data1[0], null, 2));
      }
    }
    
    // Test 2: Vérifier si la table s'appelle différemment
    console.log('\n2. Test de la table "actes_medicaux"...');
    const { data: data2, error: error2 } = await supabase
      .from('actes_medicaux')
      .select('*')
      .limit(1);
    
    if (error2) {
      console.log('⚠ Table "actes_medicaux" n\'existe pas ou n\'est pas accessible');
    } else {
      console.log('✓ Table "actes_medicaux" accessible');
      console.log('   Nombre de lignes:', data2?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testConnection();


