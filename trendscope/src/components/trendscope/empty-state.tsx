import Link from "next/link";

import { ChartNoAxesCombined } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function EmptyState({
  title = "Seus dados começam aqui",
  description = "Conecte uma conta e sincronize para visualizar métricas oficiais.",
  action = true,
}: {
  title?: string;
  description?: string;
  action?: boolean;
}) {
  return (
    <Empty className="min-h-56 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ChartNoAxesCombined />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && (
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/dashboard/contas">Gerenciar contas</Link>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
