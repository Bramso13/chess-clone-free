/**
 * Page de génération de tactiques
 */

import { TacticGenerator } from "@/components/tactics/TacticGenerator";

export default function GenerateTacticsPage() {
  return (
    <div className="container mx-auto py-8">
      <TacticGenerator defaultCount={10} />
    </div>
  );
}

