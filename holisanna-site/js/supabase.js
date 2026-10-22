/* Holisanna — client Supabase (projet « Holisanna », région UE).
   La clé « publishable » est faite pour le navigateur : elle n'ouvre rien toute seule.
   L'accès aux données est protégé par les règles RLS côté base (jamais par ce fichier).
   ⚠ Ne jamais mettre ici de clé « secret » ni « service_role ». */
(function () {
  'use strict';
  var URL = 'https://xvromzlzceqnhalyurcv.supabase.co';
  var KEY = 'sb_publishable_fVkY8bKIxfk5v6sajjvKyQ_tzfDDxrh';

  /* Conserve ce que le lien e-mail a ajouté à l'adresse (le client Supabase l'efface ensuite) : sert à expliquer un lien refusé */
  var HASH = (location.hash || '') + (location.search || '');
  var client = null;
  if (window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  window.HOL_SB = {
    client: client,
    hashAtLoad: HASH,
    /* Version de la charte éthique acceptée à l'inscription d'un praticien. À faire évoluer avec le document. */
    CHARTE_VERSION: '1.0'
  };
})();
