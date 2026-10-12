import { Activity, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// A renderização precisa acontecer no servidor a cada request: é ela que
// dispara a chamada em /api/health. O cronjob da API pinga essa página de 3
// em 3 minutos, então nenhuma das duas aplicações hiberna por inatividade.
export const dynamic = 'force-dynamic';

type ApiStatus = {
  ok: boolean;
  detail: string;
  latencyMs: number;
  url: string;
};

async function checkApi(): Promise<ApiStatus> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

  if (!baseUrl) {
    return {
      ok: false,
      detail: 'NEXT_PUBLIC_API_BASE_URL não está definida.',
      latencyMs: 0,
      url: '—',
    };
  }

  const url = `${baseUrl}/api/health`;
  const startedAt = Date.now();

  try {
    const response = await fetch(url, { cache: 'no-store' });
    const body = (await response.text()).trim();

    return {
      ok: response.ok,
      detail: response.ok ? body || 'Healthy' : `HTTP ${response.status}`,
      latencyMs: Date.now() - startedAt,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : 'Falha ao chamar a API.',
      latencyMs: Date.now() - startedAt,
      url,
    };
  }
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-foreground/10 last:border-0">
      <div className="flex items-center gap-2 font-medium">
        {ok ? (
          <CheckCircle2 className="w-4 h-4 text-primary" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" />
        )}
        {label}
      </div>
      <span className="text-right font-mono text-muted-foreground break-all">
        {detail}
      </span>
    </div>
  );
}

export default async function HealthPage() {
  const api = await checkApi();
  const checkedAt = new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-primary" />
            Healthcheck
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusRow label="Web" ok detail="Healthy" />
          <StatusRow
            label="API"
            ok={api.ok}
            detail={`${api.detail} · ${api.latencyMs}ms`}
          />
          <p className="pt-4 text-muted-foreground">
            Endpoint consultado:{' '}
            <span className="font-mono break-all">{api.url}</span>
          </p>
          <p className="text-muted-foreground">
            Verificado em{' '}
            {format(checkedAt, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
