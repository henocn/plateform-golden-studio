/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           MATRICE DES PERMISSIONS CENTRALISÉE (Frontend)       ║
 * ║                                                                ║
 * ║  Ce fichier DOIT rester synchronisé avec:                      ║
 * ║  backend/src/config/permissions.js                             ║
 * ║                                                                ║
 * ║  Pour ajouter/retirer un accès, modifiez les deux fichiers.    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  Format : permission-key → [roles autorisés]
 *
 *  Rôles internes : super_admin, admin, validator, contributor, reader
 *  Rôles clients  : client_admin, client_validator, client_contributor, client_reader
 */

const PERMISSIONS = {
  // ─── Projets ─────────────────────────────────────────────
  'projects.create':            ['super_admin', 'admin', 'contributor', 'client_admin'],
  'projects.edit':              ['super_admin', 'admin', 'contributor', 'client_admin'],
  'projects.delete':            ['super_admin', 'admin', 'client_admin'],
  'projects.view_all_orgs':     ['super_admin', 'admin', 'validator', 'contributor', 'reader'],
  'projects.view_own':          ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],

  // ─── Tâches ──────────────────────────────────────────────
  'tasks.create':               ['super_admin', 'admin', 'contributor', 'client_admin', 'client_contributor'],
  'tasks.edit':                 ['super_admin', 'admin', 'contributor', 'client_admin', 'client_contributor'],
  'tasks.delete':               ['super_admin', 'admin', 'client_admin'],
  'tasks.comment':              ['client_admin', 'client_validator', 'client_contributor'],

  // ─── Propositions ────────────────────────────────────────
  'proposals.create':           ['super_admin', 'admin', 'contributor', 'client_admin'],
  'proposals.submit_to_client': ['super_admin', 'admin', 'validator'],
  'proposals.validate_client':  ['client_admin', 'client_validator'],

  // ─── Briefs ──────────────────────────────────────────────
  'briefs.create':              ['super_admin', 'admin', 'contributor', 'client_admin'],
  'briefs.edit':                ['super_admin', 'admin', 'contributor', 'client_admin'],
  'briefs.submit':              ['client_admin', 'client_contributor'],

  // ─── Validations internes ────────────────────────────────
  'validations.internal':       ['super_admin', 'admin', 'validator'],

  // ─── Calendrier ──────────────────────────────────────────
  'calendar.manage':            ['super_admin', 'admin', 'contributor'],
  'calendar.view':              ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],

  // ─── Médiathèque ─────────────────────────────────────────
  'mediatheque.upload':         ['super_admin', 'admin', 'contributor'],
  'mediatheque.view':           ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],
  'mediatheque.upload_client':  ['client_admin', 'client_contributor'],

  // ─── Publications ────────────────────────────────────────
  'publications.manage':        ['super_admin', 'admin', 'contributor'],

  // ─── Utilisateurs ────────────────────────────────────────
  'users.list_members':         ['super_admin', 'admin', 'validator', 'contributor', 'reader'],
  'users.manage_internal':      ['super_admin'],
  'users.manage_clients':       ['super_admin', 'admin'],
  'users.manage_own_org':       ['client_admin'],

  // ─── Organisations ───────────────────────────────────────
  'organizations.manage':       ['super_admin'],

  // ─── Reporting ────────────────────────────────────────────
  'reporting.global':           ['super_admin', 'admin'],
  'reporting.own_org':          ['client_admin'],

  // ─── Audit / Logs ────────────────────────────────────────
  'audit.view':                 ['super_admin', 'admin'],
};

export default PERMISSIONS;
