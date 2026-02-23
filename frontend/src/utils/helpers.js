import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, FileText, Hourglass, RefreshCw, XCircle } from "lucide-react";

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr, pattern = "dd MMM yyyy") {
  if (!dateStr) return "—";
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return "—";
  return format(date, pattern, { locale: fr });
}

/**
 * Format to relative time (e.g., "il y a 3 heures")
 */
export function formatRelative(dateStr) {
  if (!dateStr) return "—";
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return "—";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/**
 * Format a datetime
 */
export function formatDateTime(dateStr) {
  return formatDate(dateStr, "dd MMM yyyy · HH:mm");
}

// ── Status Maps ──────────────────────────────────────────

export const PROJECT_STATUS = {
  brief_received: { label: "Brief reçu", color: "info" },
  in_production: { label: "En production", color: "warning" },
  in_validation: { label: "En validation", color: "primary" },
  published: { label: "Publié", color: "success" },
  archived: { label: "Archivé", color: "neutral" },
};

export const TASK_STATUS = {
  todo: { label: "À faire", color: "neutral" },
  in_production: { label: "En cours", color: "info" },
  done: { label: "Terminé", color: "success" },
  blocked: { label: "Bloqué", color: "danger" },
};

export const PROPOSAL_STATUS = {
  submitted:      { label: "Soumis", color: "info", icon: FileText },
  rejected:       { label: "Rejetée",   color: "danger",  icon: XCircle },
  draft:          { label: "Brouillon",  color: "neutral", icon: FileText },
  needs_revision: { label: "À réviser",  color: "orange",  icon: RefreshCw },
  approved:       { label: "Approuvée",  color: "success", icon: CheckCircle2 },
  pending_client_validation: { label: "En validation", color: "warning", icon: Hourglass },
};


export const PRIORITY = {
  low: { label: "Basse", color: "neutral" },
  normal: { label: "Normale", color: "info" },
  high: { label: "Haute", color: "warning" },
  urgent: { label: "Urgente", color: "danger" },
}; 

export const MEDIA_TYPES = {
  logo: { label: "Logo", color: "info" },
  graphic_charter: { label: "Charte graphique", color: "primary" },
  video: { label: "Vidéo", color: "success" },
  photo: { label: "Photo", color: "warning" },
  template: { label: "Template", color: "neutral" },
  document: { label: "Document", color: "info" },
  other: { label: "Autre", color: "neutral" },
};

export const ROLE_LABELS = {
  super_admin: { label: "Super Admin", color: "#1E3A5F" },
  admin: { label: "Admin", color: "#059669" },
  validator: { label: "Validateur", color: "#D97706" },
  contributor: { label: "Contributeur", color: "#F59E0B" },
  reader: { label: "Lecteur", color: "#9CA3AF" },
  client_admin: { label: "Client Admin", color: "#1E3A5F" },
  client_validator: { label: "Client Valid.", color: "#059669" },
  client_contributor: { label: "Client Contrib.", color: "#D97706" },
  client_reader: { label: "Client Lecteur", color: "#9CA3AF" },
};

export const CALENDAR_EVENT_TYPES = {
  publication: {
    label: "Publication",
    bg: "bg-info-600", // #2563EB ✓
    text: "text-white",
    border: "border-l-info-500", // #3B82F6 (plus proche dispo)
  },
  event_coverage: {
    label: "Événement",
    bg: "bg-success-600", // #059669 ✓
    text: "text-white",
    border: "border-l-success-700", // #047857 ✓
  },
  filming: {
    label: "Tournage",
    bg: "bg-[#A21CAF]", // Violet absent du config → arbitrary value statique ✓
    text: "text-white",
    border: "border-l-[#701A75]",
  },
  deliverable_deadline: {
    label: "Livrable",
    bg: "bg-warning-500", // #F59E0B ✓
    text: "text-ink-700", // #374151 ✓
    border: "border-l-warning-700", // #B45309 ✓
  },
  meeting: {
    label: "Réunion",
    bg: "bg-danger-600", // #DC2626 ✓
    text: "text-white",
    border: "border-l-danger-700", // #B91C1C (plus proche dispo)
  },
};

// ── Helpers ──────────────────────────────────────────────

/**
 * Get initials from a name
 */
export function getInitials(firstName, lastName) {
  const f = firstName?.charAt(0)?.toUpperCase() || "";
  const l = lastName?.charAt(0)?.toUpperCase() || "";
  return `${f}${l}` || "?";
}

/**
 * Truncate text
 */
export function truncate(str, maxLength = 80) {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (!bytes) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`;
}

/**
 * Download a blob
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Safely extract list items + total from API response data.
 * Backend format: { data: [...], meta: { total, page, limit, totalPages } }
 * Fallback: { rows: [], count } or direct array.
 * Usage: const { items, total } = extractList(data.data);
 */
export function extractList(apiData) {
  if (!apiData) return { items: [], total: 0 };
  // Standard backend format: { data: [...], meta: { total } }
  if (apiData.meta !== undefined || apiData.data !== undefined) {
    const items = Array.isArray(apiData.data) ? apiData.data : [];
    return { items, total: apiData.meta?.total ?? items.length };
  }
  // Sequelize format: { rows: [...], count }
  if (Array.isArray(apiData.rows)) {
    return { items: apiData.rows, total: apiData.count ?? apiData.rows.length };
  }
  // Direct array
  if (Array.isArray(apiData)) return { items: apiData, total: apiData.length };
  return { items: [], total: 0 };
}

// Extract and display error details from API error response
export function formatErrorMessage(error) {
  const rawDetails = error.response?.data?.error?.details;

  const details =
    Array.isArray(rawDetails) && rawDetails.length > 0
      ? rawDetails
      : [
          {
            message:
              error.response?.data?.error?.message ||
              "Erreur lors de la mise à jour du statut",
          },
        ];
  return details;
}


// interval de temps entre deux dates

export function deltaTime(startDate, endDate) {
  const delta = endDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 0;
  return delta;
}