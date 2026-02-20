import { FileText } from "lucide-react";
import { Card } from "../../components/ui";

export default function ProposalsTab({ taskId }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
          <FileText className="w-7 h-7 text-ink-300" />
        </div>
        <p className="text-body-md font-medium text-ink-500">
          Aucune proposition pour l'instant
        </p>
        <p className="text-body-sm text-ink-400">
          Les propositions liées à cette tâche apparaîtront ici.
        </p>
      </div>
    </Card>
  );
}
