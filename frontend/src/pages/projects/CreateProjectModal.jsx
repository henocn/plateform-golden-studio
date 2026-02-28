import { useState, useEffect, useMemo, useRef } from "react";
import { Modal, Button, Input, Textarea, Select } from "../../components/ui";
import { projectsAPI, usersAPI, agenciesAPI, directionsAPI } from "../../api/services";
import { usePermissions } from "../../hooks";
import { PRIORITY, extractList, formatErrorMessage } from "../../utils/helpers";
import toast from "react-hot-toast";

const DEFAULT_FORM = {
  title: "",
  description: "",
  agency_id: "",
  direction_id: "",
  priority: "normal",
  target_date: "",
  internal_manager_id: "",
  client_contact_id: "",
};

function buildInitialForm(project) {
  const base = project
    ? {
        title: project.title || "",
        description: project.description || "",
        agency_id: project.agency_id || "",
        direction_id: project.direction_id || "",
        priority: project.priority || "normal",
        target_date: project.target_date || "",
        internal_manager_id: project.internal_manager_id || "",
        client_contact_id: project.client_contact_id || "",
      }
    : { ...DEFAULT_FORM };

  return base;
}

export default function CreateProjectModal({
  open,
  onClose,
  onCreated,
  project,
}) {
  const { userType, user } = usePermissions();
  const [loading, setLoading] = useState(false);

  const [allClients, setAllClients] = useState([]);
  const [internalUsers, setInternalUsers] = useState([]);

  const [form, setForm] = useState(() => buildInitialForm(project));
  const [agencies, setAgencies] = useState([]);
  const [directions, setDirections] = useState([]);
  const agencyIdForDirectionsRef = useRef("");

  const filteredClients = useMemo(() => allClients, [allClients]);

  useEffect(() => {
    if (!form.client_contact_id) return;
    const stillValid = filteredClients.some((c) => c.id === form.client_contact_id);
    if (!stillValid) setForm((prev) => ({ ...prev, client_contact_id: "" }));
  }, [filteredClients, form.client_contact_id]);

  useEffect(() => {
    if (!open) return;
    setForm(buildInitialForm(project));
    if (userType === "internal") {
      usersAPI.listMembers({ type: "internal" }).then(({ data }) => setInternalUsers(extractList(data.data).items));
      usersAPI.listClients().then(({ data }) => setAllClients(extractList(data.data).items));
    } else if (userType === "client") {
      usersAPI.listClients().then(({ data }) => setAllClients(extractList(data.data).items));
    }
    agenciesAPI.list().then(({ data }) => setAgencies(Array.isArray(data?.data) ? data.data : data || []));
    const aid = project?.agency_id || "";
    agencyIdForDirectionsRef.current = aid;
    directionsAPI.list(aid ? { agency_id: aid } : { agency_id: "null" }).then(({ data }) =>
      setDirections(Array.isArray(data?.data) ? data.data : data || []),
    );
  }, [open, project, userType]);

  useEffect(() => {
    if (!open || form.agency_id === agencyIdForDirectionsRef.current) return;
    agencyIdForDirectionsRef.current = form.agency_id;
    const params = form.agency_id ? { agency_id: form.agency_id } : { agency_id: "null" };
    directionsAPI.list(params).then(({ data }) => setDirections(Array.isArray(data?.data) ? data.data : data || []));
  }, [open, form.agency_id]);

  const set = (key) => (e) =>
    setForm((prev) => {
      const next = { ...prev, [key]: e.target.value };
      if (key === "agency_id") next.direction_id = "";
      return next;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.internal_manager_id) delete payload.internal_manager_id;
      if (!payload.client_contact_id) delete payload.client_contact_id;
      if (!payload.agency_id) delete payload.agency_id;
      if (!payload.direction_id) delete payload.direction_id;

      if (project) {
        await projectsAPI.update(project.id, payload);
        toast.success("Projet modifié avec succès");
      } else {
        await projectsAPI.create(payload);
        toast.success("Projet créé avec succès");
      }
      onCreated();
    } catch (err) {
      const details = formatErrorMessage(err);
      details.forEach((d) => toast.error(d.message));
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = Object.entries(PRIORITY).map(([k, v]) => ({
    value: k,
    label: v.label,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Modifier le projet" : "Nouveau projet"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={loading} onClick={handleSubmit}>
            {project ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Titre */}
        <Input
          label="Titre"
          required
          value={form.title}
          onChange={set("title")}
          placeholder="Campagne de communication…"
        />

        {/* Description */}
        <Textarea
          label="Description"
          value={form.description}
          onChange={set("description")}
          rows={3}
        />

        {/* Agence + Direction */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Agence"
            value={form.agency_id}
            onChange={set("agency_id")}
            placeholder="Ministère (aucune)"
            options={[
              { value: "", label: "Ministère (aucune)" },
              ...agencies.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <Select
            label="Direction"
            value={form.direction_id}
            onChange={set("direction_id")}
            placeholder="Sélectionner une direction"
            options={[
              { value: "", label: "—" },
              ...directions.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>

        {/* Responsable interne + Responsable client */}
        <div className="grid grid-cols-2 gap-4">
          {userType === "internal" && (
            <Select
              label="Responsable interne"
              value={form.internal_manager_id}
              onChange={set("internal_manager_id")}
              placeholder="Sélectionner"
              options={internalUsers.map((u) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name}`,
              }))}
            />
          )}
          <Select
            label="Responsable client"
            value={form.client_contact_id}
            onChange={set("client_contact_id")}
            placeholder="Sélectionner"
            options={filteredClients.map((u) => ({
              value: u.id,
              label: `${u.first_name} ${u.last_name}`,
            }))}
          />
        </div>

        {/* Priorité + Date cible */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priorité"
            value={form.priority}
            onChange={set("priority")}
            options={priorityOptions}
          />
          <Input
            label="Date cible"
            type="date"
            value={form.target_date}
            onChange={set("target_date")}
          />
        </div>
      </form>
    </Modal>
  );
}
