import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SupportCard() {
  return (
    <Card size="sm" className="group-data-[collapsible=icon]:hidden">
      <CardHeader>
        <CardTitle>Seu Creator Studio</CardTitle>
        <CardDescription>
          Conecte suas contas para começar. A demonstração é opcional e usa dados fictícios.
        </CardDescription>
        <Link className="text-sm underline underline-offset-4" href="/dashboard/contas">
          Gerenciar conexões
        </Link>
      </CardHeader>
    </Card>
  );
}
