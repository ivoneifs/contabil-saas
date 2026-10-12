"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileText,
  FolderOpen,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  apiAbrir,
  apiBaixarPost,
  apiDownload,
  apiFetch,
  apiUpload,
} from "@/lib/api";
import {
  Botao,
  Card,
  Erro,
  Modal,
  Selo,
  Titulo,
  Vazio,
  brl,
  campo,
  formatarDoc,
  useApi,
} from "@/components/ui";
import { usePode } from "@/lib/permissoes";

type Modelo =
  | "NFE"
  | "NFCE"
  | "CTE"
  | "CTEOS"
  | "MDFE"
  | "NFSE"
  | "EVENTO"
  | "DESCONHECIDO";

interface Doc {
  id: string;
  clientId: string | null;
  modelo: Modelo;
  formato: "XML" | "PDF";
  direcao: "ENTRADA" | "SAIDA" | null;
  chaveAcesso: string | null;
  numero: string | null;
  serie: string | null;
  dataEmissao: string | null;
  emitenteDoc: string | null;
  emitenteNome: string | null;
  destinatarioDoc: string | null;
  destinatarioNome: string | null;
  valorTotal: string | null;
  naturezaOperacao: string | null;
  protocolo: string | null;
  situacao: string | null;
  descricaoEvento: string | null;
  nomeArquivo: string;
  tamanhoBytes: number;
  createdAt: string;
  client: { razaoSocial: string } | null;
}

interface Detalhe extends Doc {
  relacionados: {
    id: string;
    formato: "XML" | "PDF";
    modelo: Modelo;
    nomeArquivo: string;
    descricaoEvento: string | null;
    situacao: string | null;
  }[];
}

interface Lista {
  itens: Doc[];
  total: number;
  pagina: number;
  porPagina: number;
  valorTotal: number;
}

interface ResultadoUpload {
  importados: number;
  duplicados: number;
  ignorados: number;
  erros: number;
  resultado: {
    arquivo: string;
    status: "importado" | "duplicado" | "ignorado" | "erro";
    modelo?: Modelo;
    numero?: string | null;
    cliente?: string | null;
    mensagem?: string;
  }[];
}

interface Client {
  id: string;
  razaoSocial: string;
}

const MODELOS: Record<
  Modelo,
  {
    nome: string;
    pdf: string;
    tom: "indigo" | "violet" | "amber" | "green" | "slate" | "red";
  }
> = {
  NFE: { nome: "NF-e", pdf: "DANFE", tom: "indigo" },
  NFCE: { nome: "NFC-e", pdf: "DANFC-e", tom: "violet" },
  CTE: { nome: "CT-e", pdf: "DACTE", tom: "amber" },
  CTEOS: { nome: "CT-e OS", pdf: "DACTE OS", tom: "amber" },
  MDFE: { nome: "MDF-e", pdf: "DAMDFE", tom: "green" },
  NFSE: { nome: "NFS-e", pdf: "DANFSe", tom: "indigo" },
  EVENTO: { nome: "Evento", pdf: "Evento", tom: "slate" },
  DESCONHECIDO: { nome: "Outro", pdf: "PDF", tom: "slate" },
};

const SITUACAO_TOM: Record<string, "green" | "red" | "amber" | "slate"> = {
  AUTORIZADA: "green",
  HOMOLOGADO: "green",
  CANCELADA: "red",
  DENEGADA: "red",
  SEM_PROTOCOLO: "amber",
};

const LOTE = 20;
const ACEITOS = ".xml,.pdf,.zip";
const tamanho = (b: number) =>
  b > 1048576
    ? `${(b / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`;
const chaveFormatada = (c: string) => c.replace(/(\d{4})(?=\d)/g, "$1 ");
const dataHora = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : "—";

function filtrosVazios(clientId = "") {
  return {
    busca: "",
    modelo: "",
    formato: "",
    direcao: "",
    clientId,
    situacao: "",
    de: "",
    ate: "",
  };
}

// clienteFixo: usado dentro da ficha do cliente (tudo filtrado e enviado para ele).
export default function ArquivoFiscal({
  clienteFixo,
}: {
  clienteFixo?: string;
}) {
  const pode = usePode();
  const { dados: clients } = useApi<Client[]>("/clients");
  const { dados: resumo, recarregar: recarregarResumo } = useApi<
    {
      modelo: Modelo;
      formato: "XML" | "PDF";
      quantidade: number;
      valor: number | null;
    }[]
  >(clienteFixo ? null : "/documentos-fiscais/resumo");

  const [filtros, setFiltros] = useState(filtrosVazios(clienteFixo));
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<Lista | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const [arrastando, setArrastando] = useState(false);
  const [clienteUpload, setClienteUpload] = useState(clienteFixo ?? "");
  const [progresso, setProgresso] = useState<{
    feito: number;
    total: number;
  } | null>(null);
  const [relatorio, setRelatorio] = useState<ResultadoUpload | null>(null);
  const [verRelatorio, setVerRelatorio] = useState(false);
  const inputArquivos = useRef<HTMLInputElement>(null);
  const inputPasta = useRef<HTMLInputElement>(null);

  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);

  const query = useCallback(() => {
    const p = new URLSearchParams({ pagina: String(pagina), porPagina: "50" });
    Object.entries(filtros).forEach(([k, v]) => v && p.set(k, v));
    return p.toString();
  }, [filtros, pagina]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setLista(await apiFetch<Lista>(`/documentos-fiscais?${query()}`));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(carregar, filtros.busca ? 350 : 0);
    return () => clearTimeout(t);
  }, [carregar, filtros.busca]);

  function mudarFiltro(k: keyof ReturnType<typeof filtrosVazios>, v: string) {
    setFiltros((f) => ({ ...f, [k]: v }));
    setPagina(1);
    setSelecionados(new Set());
  }

  async function enviar(arquivos: File[]) {
    const validos = arquivos.filter((f) => /\.(xml|pdf|zip)$/i.test(f.name));
    if (!validos.length) {
      setErro("Selecione arquivos XML, PDF ou ZIP.");
      return;
    }
    setErro(null);
    setRelatorio(null);
    setProgresso({ feito: 0, total: validos.length });
    const total: ResultadoUpload = {
      importados: 0,
      duplicados: 0,
      ignorados: 0,
      erros: 0,
      resultado: [],
    };
    try {
      for (let i = 0; i < validos.length; i += LOTE) {
        const form = new FormData();
        validos
          .slice(i, i + LOTE)
          .forEach((f) => form.append("files", f, f.name));
        if (clienteUpload) form.append("clientId", clienteUpload);
        const r = await apiUpload<ResultadoUpload>(
          "/documentos-fiscais/upload",
          form,
        );
        total.importados += r.importados;
        total.duplicados += r.duplicados;
        total.ignorados += r.ignorados;
        total.erros += r.erros;
        total.resultado.push(...r.resultado);
        setProgresso({
          feito: Math.min(i + LOTE, validos.length),
          total: validos.length,
        });
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro no envio.");
    } finally {
      setProgresso(null);
      setRelatorio(total);
      setVerRelatorio(total.erros > 0);
      setPagina(1);
      carregar();
      recarregarResumo();
    }
  }

  async function abrirDetalhe(id: string) {
    try {
      setDetalhe(await apiFetch<Detalhe>(`/documentos-fiscais/${id}`));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao abrir.");
    }
  }

  async function exportar() {
    setErro(null);
    try {
      const corpo = selecionados.size
        ? { ids: Array.from(selecionados) }
        : Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      await apiBaixarPost(
        "/documentos-fiscais/exportar",
        corpo,
        `documentos-fiscais-${new Date().toISOString().slice(0, 10)}.zip`,
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao exportar.");
    }
  }

  async function excluirSelecionados() {
    if (
      !window.confirm(
        `Excluir ${selecionados.size} arquivo(s)? Não dá para desfazer.`,
      )
    )
      return;
    try {
      await apiFetch("/documentos-fiscais/remover", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selecionados) }),
      });
      setSelecionados(new Set());
      carregar();
      recarregarResumo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  async function vincular(clientId: string) {
    if (!detalhe) return;
    try {
      await apiFetch(`/documentos-fiscais/${detalhe.id}/cliente`, {
        method: "PATCH",
        body: JSON.stringify({ clientId: clientId || null }),
      });
      await abrirDetalhe(detalhe.id);
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao vincular.");
    }
  }

  const abrir = (id: string) =>
    apiAbrir(`/documentos-fiscais/${id}/arquivo?inline=1`).catch((e) =>
      setErro(e.message),
    );
  const baixar = (id: string, nome: string) =>
    apiDownload(`/documentos-fiscais/${id}/arquivo`, nome).catch((e) =>
      setErro(e.message),
    );

  const cards = (["NFE", "NFCE", "CTE", "MDFE", "NFSE"] as Modelo[]).map(
    (m) => {
      const xml =
        resumo?.filter(
          (r) =>
            r.formato === "XML" &&
            (r.modelo === m || (m === "CTE" && r.modelo === "CTEOS")),
        ) ?? [];
      const pdf =
        resumo?.filter(
          (r) =>
            r.formato === "PDF" &&
            (r.modelo === m || (m === "CTE" && r.modelo === "CTEOS")),
        ) ?? [];
      return {
        modelo: m,
        xml: xml.reduce((s, r) => s + r.quantidade, 0),
        pdf: pdf.reduce((s, r) => s + r.quantidade, 0),
        valor: xml.reduce((s, r) => s + (r.valor ?? 0), 0),
      };
    },
  );

  const paginas = lista
    ? Math.max(1, Math.ceil(lista.total / lista.porPagina))
    : 1;
  const todosMarcados =
    !!lista?.itens.length && lista.itens.every((d) => selecionados.has(d.id));

  return (
    <div className={clienteFixo ? "" : "mx-auto max-w-7xl"}>
      {!clienteFixo && (
        <Titulo
          titulo="Arquivo fiscal"
          subtitulo="XML e PDF de NF-e, NFC-e, CT-e, MDF-e e NFS-e. O sistema lê cada XML, vincula ao cliente pelo CNPJ e junta o PDF à nota pela chave de acesso."
        />
      )}
      <Erro msg={erro} />

      {/* Resumo por modelo */}
      {!clienteFixo && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <button
              key={c.modelo}
              onClick={() =>
                mudarFiltro(
                  "modelo",
                  filtros.modelo === c.modelo ? "" : c.modelo,
                )
              }
              className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 ${filtros.modelo === c.modelo ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {MODELOS[c.modelo].nome}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {c.xml}
              </p>
              <p className="text-xs text-slate-500">
                XML · {c.pdf} {MODELOS[c.modelo].pdf}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-indigo-700">
                {brl(c.valor)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Upload */}
      {pode("fiscal.enviar") && (
        <Card className="mb-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              enviar(Array.from(e.dataTransfer.files));
            }}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition ${arrastando ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50/50"}`}
          >
            {progresso ? (
              <div className="mx-auto max-w-md">
                <p className="text-sm font-medium">
                  Enviando e lendo os arquivos… {progresso.feito} de{" "}
                  {progresso.total}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{
                      width: `${Math.max(5, (progresso.feito / progresso.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Upload size={22} />
                </div>
                <p className="mt-3 font-medium">Arraste os arquivos aqui</p>
                <p className="mt-1 text-sm text-slate-500">
                  XML (NF-e, NFC-e, CT-e, MDF-e, NFS-e e eventos), PDF (DANFE,
                  DANFC-e, DACTE, DAMDFE) ou ZIP com tudo junto.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Botao
                    onClick={() => inputArquivos.current?.click()}
                    className="inline-flex items-center gap-2"
                  >
                    <FileArchive size={16} /> Escolher arquivos
                  </Botao>
                  <Botao
                    variante="secundario"
                    onClick={() => inputPasta.current?.click()}
                    className="inline-flex items-center gap-2"
                  >
                    <FolderOpen size={16} /> Enviar uma pasta
                  </Botao>
                  {!clienteFixo && (
                    <select
                      className={`${campo} w-auto`}
                      value={clienteUpload}
                      onChange={(e) => setClienteUpload(e.target.value)}
                      title="Cliente"
                    >
                      <option value="">Vincular pelo CNPJ (automático)</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={c.id}>
                          Tudo para: {c.razaoSocial}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  ref={inputArquivos}
                  type="file"
                  multiple
                  accept={ACEITOS}
                  className="hidden"
                  onChange={(e) =>
                    e.target.files &&
                    enviar(Array.from(e.target.files)).finally(
                      () => (e.target.value = ""),
                    )
                  }
                />
                <input
                  ref={inputPasta}
                  type="file"
                  multiple
                  className="hidden"
                  {...({ webkitdirectory: "", directory: "" } as Record<
                    string,
                    string
                  >)}
                  onChange={(e) =>
                    e.target.files &&
                    enviar(Array.from(e.target.files)).finally(
                      () => (e.target.value = ""),
                    )
                  }
                />
              </>
            )}
          </div>

          {relatorio && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Selo tom="green">{relatorio.importados} importados</Selo>
                <Selo tom="slate">{relatorio.duplicados} já existiam</Selo>
                {!!relatorio.ignorados && (
                  <Selo tom="amber">{relatorio.ignorados} ignorados</Selo>
                )}
                {!!relatorio.erros && (
                  <Selo tom="red">{relatorio.erros} com erro</Selo>
                )}
                <button
                  className="ml-auto text-sm text-indigo-700 hover:underline"
                  onClick={() => setVerRelatorio((v) => !v)}
                >
                  {verRelatorio ? "Ocultar detalhes" : "Ver detalhes"}
                </button>
              </div>
              {verRelatorio && (
                <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 text-sm">
                  {relatorio.resultado.map((r, i) => (
                    <li
                      key={`${r.arquivo}-${i}`}
                      className="flex flex-wrap items-center gap-2 px-3 py-2"
                    >
                      <Selo
                        tom={
                          r.status === "importado"
                            ? "green"
                            : r.status === "erro"
                              ? "red"
                              : r.status === "ignorado"
                                ? "amber"
                                : "slate"
                        }
                      >
                        {r.status}
                      </Selo>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">
                        {r.arquivo}
                      </span>
                      {r.modelo && (
                        <span className="text-xs text-slate-500">
                          {MODELOS[r.modelo].nome} {r.numero ?? ""}{" "}
                          {r.cliente ? `· ${r.cliente}` : ""}
                        </span>
                      )}
                      {r.mensagem && (
                        <span className="w-full text-xs text-slate-500">
                          {r.mensagem}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Filtros */}
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <input
          className={`${campo} xl:col-span-2`}
          placeholder="Buscar nome, CNPJ, número ou chave…"
          value={filtros.busca}
          onChange={(e) => mudarFiltro("busca", e.target.value)}
        />
        <select
          className={campo}
          value={filtros.modelo}
          onChange={(e) => mudarFiltro("modelo", e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {(Object.keys(MODELOS) as Modelo[]).map((m) => (
            <option key={m} value={m}>
              {MODELOS[m].nome}
            </option>
          ))}
        </select>
        <select
          className={campo}
          value={filtros.formato}
          onChange={(e) => mudarFiltro("formato", e.target.value)}
        >
          <option value="">XML e PDF</option>
          <option value="XML">Só XML</option>
          <option value="PDF">Só PDF</option>
        </select>
        <select
          className={campo}
          value={filtros.direcao}
          onChange={(e) => mudarFiltro("direcao", e.target.value)}
        >
          <option value="">Entrada e saída</option>
          <option value="SAIDA">Saída (emitidas)</option>
          <option value="ENTRADA">Entrada (recebidas)</option>
        </select>
        {!clienteFixo && (
          <select
            className={campo}
            value={filtros.clientId}
            onChange={(e) => mudarFiltro("clientId", e.target.value)}
          >
            <option value="">Todos os clientes</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razaoSocial}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          className={campo}
          value={filtros.de}
          onChange={(e) => mudarFiltro("de", e.target.value)}
          title="Emitidas a partir de"
        />
        <input
          type="date"
          className={campo}
          value={filtros.ate}
          onChange={(e) => mudarFiltro("ate", e.target.value)}
          title="Emitidas até"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">
          {lista?.total ?? 0} arquivo(s) · valor dos XMLs válidos:{" "}
          <b className="text-slate-800">{brl(lista?.valorTotal ?? 0)}</b>
        </span>
        {Object.entries(filtros).some(
          ([k, v]) => v && !(clienteFixo && k === "clientId"),
        ) && (
          <button
            className="inline-flex items-center gap-1 text-indigo-700 hover:underline"
            onClick={() => {
              setFiltros(filtrosVazios(clienteFixo));
              setPagina(1);
            }}
          >
            <X size={14} /> Limpar filtros
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {selecionados.size > 0 && pode("fiscal.excluir") && (
            <Botao
              variante="perigo"
              className="inline-flex items-center gap-1.5"
              onClick={excluirSelecionados}
            >
              <Trash2 size={15} /> Excluir ({selecionados.size})
            </Botao>
          )}
          <Botao
            variante="secundario"
            className="inline-flex items-center gap-1.5"
            onClick={exportar}
            disabled={!lista?.total}
          >
            <Download size={15} />{" "}
            {selecionados.size
              ? `Baixar ${selecionados.size} em ZIP`
              : "Baixar filtrados em ZIP"}
          </Botao>
        </div>
      </div>

      {/* Tabela */}
      {!lista?.itens.length ? (
        <Vazio>
          {carregando
            ? "Carregando…"
            : Object.values(filtros).some(Boolean)
              ? "Nenhum arquivo com esses filtros."
              : "Nenhum arquivo ainda. Envie seus XMLs e PDFs acima."}
        </Vazio>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={todosMarcados}
                    onChange={(e) =>
                      setSelecionados(
                        e.target.checked
                          ? new Set(lista.itens.map((d) => d.id))
                          : new Set(),
                      )
                    }
                  />
                </th>
                {[
                  "Tipo",
                  "Número",
                  "Emissão",
                  "Emitente",
                  "Destinatário",
                  "Valor",
                  "Situação",
                  "Cliente",
                  "",
                ].map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-3 py-3 font-medium"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lista.itens.map((d) => (
                <tr
                  key={d.id}
                  className={`hover:bg-slate-50 ${selecionados.has(d.id) ? "bg-indigo-50/50" : ""}`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${d.nomeArquivo}`}
                      checked={selecionados.has(d.id)}
                      onChange={(e) => {
                        const n = new Set(selecionados);
                        if (e.target.checked) n.add(d.id);
                        else n.delete(d.id);
                        setSelecionados(n);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Selo tom={MODELOS[d.modelo].tom}>
                        {d.formato === "PDF"
                          ? MODELOS[d.modelo].pdf
                          : MODELOS[d.modelo].nome}
                      </Selo>
                      {d.formato === "PDF" ? (
                        <FileText size={14} className="text-rose-500" />
                      ) : (
                        <FileCode2 size={14} className="text-slate-400" />
                      )}
                    </div>
                    {d.direcao && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {d.direcao === "SAIDA" ? "↑ Saída" : "↓ Entrada"}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                    {d.modelo === "EVENTO" ? (
                      <span className="text-xs text-slate-600">
                        {d.descricaoEvento?.split(" · ")[0]}
                      </span>
                    ) : d.numero ? (
                      `${d.numero}${d.serie ? `/${d.serie}` : ""}`
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {dataHora(d.dataEmissao)}
                  </td>
                  <td className="max-w-[200px] px-3 py-2.5">
                    <p className="truncate">{d.emitenteNome ?? "—"}</p>
                    {d.emitenteDoc && (
                      <p className="text-[11px] text-slate-500">
                        {formatarDoc(d.emitenteDoc)}
                      </p>
                    )}
                  </td>
                  <td className="max-w-[200px] px-3 py-2.5">
                    <p className="truncate">{d.destinatarioNome ?? "—"}</p>
                    {d.destinatarioDoc && (
                      <p className="text-[11px] text-slate-500">
                        {formatarDoc(d.destinatarioDoc)}
                      </p>
                    )}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${d.situacao === "CANCELADA" ? "text-slate-400 line-through" : ""}`}
                  >
                    {d.valorTotal ? brl(d.valorTotal) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {d.situacao ? (
                      <Selo tom={SITUACAO_TOM[d.situacao] ?? "slate"}>
                        {d.situacao.replace("_", " ").toLowerCase()}
                      </Selo>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2.5 text-xs">
                    {d.clientId ? (
                      <Link
                        href={`/dashboard/clients/${d.clientId}`}
                        className="text-indigo-700 hover:underline"
                      >
                        {d.client?.razaoSocial}
                      </Link>
                    ) : (
                      <span className="text-amber-600">Sem vínculo</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex gap-1">
                      <button
                        title="Detalhes"
                        onClick={() => abrirDetalhe(d.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        title="Baixar"
                        onClick={() => baixar(d.id, d.nomeArquivo)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lista && paginas > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Botao
            variante="secundario"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </Botao>
          <span>
            Página {pagina} de {paginas}
          </span>
          <Botao
            variante="secundario"
            disabled={pagina >= paginas}
            onClick={() => setPagina((p) => p + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight size={16} />
          </Botao>
        </div>
      )}

      {/* Detalhe */}
      <Modal
        aberto={!!detalhe}
        titulo={
          detalhe
            ? `${detalhe.formato === "PDF" ? MODELOS[detalhe.modelo].pdf : MODELOS[detalhe.modelo].nome} ${detalhe.numero ?? ""}`
            : ""
        }
        onFechar={() => setDetalhe(null)}
        largura="max-w-2xl"
      >
        {detalhe && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap gap-2">
              {detalhe.situacao && (
                <Selo tom={SITUACAO_TOM[detalhe.situacao] ?? "slate"}>
                  {detalhe.situacao.replace("_", " ").toLowerCase()}
                </Selo>
              )}
              {detalhe.direcao && (
                <Selo tom="indigo">
                  {detalhe.direcao === "SAIDA" ? "Saída" : "Entrada"}
                </Selo>
              )}
              <Selo>{detalhe.formato}</Selo>
            </div>
            {detalhe.chaveAcesso && (
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Chave de acesso
                </p>
                <p className="mt-1 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-[13px]">
                  {chaveFormatada(detalhe.chaveAcesso)}
                </p>
              </div>
            )}
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                [
                  "Número / série",
                  detalhe.numero
                    ? `${detalhe.numero}${detalhe.serie ? ` / ${detalhe.serie}` : ""}`
                    : null,
                ],
                [
                  "Emissão",
                  detalhe.dataEmissao
                    ? new Date(detalhe.dataEmissao).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })
                    : null,
                ],
                [
                  "Emitente",
                  detalhe.emitenteNome
                    ? `${detalhe.emitenteNome}${detalhe.emitenteDoc ? ` · ${formatarDoc(detalhe.emitenteDoc)}` : ""}`
                    : detalhe.emitenteDoc && formatarDoc(detalhe.emitenteDoc),
                ],
                [
                  "Destinatário",
                  detalhe.destinatarioNome
                    ? `${detalhe.destinatarioNome}${detalhe.destinatarioDoc ? ` · ${formatarDoc(detalhe.destinatarioDoc)}` : ""}`
                    : detalhe.destinatarioDoc &&
                      formatarDoc(detalhe.destinatarioDoc),
                ],
                ["Valor", detalhe.valorTotal ? brl(detalhe.valorTotal) : null],
                ["Protocolo", detalhe.protocolo],
                [
                  detalhe.modelo === "MDFE"
                    ? "Percurso"
                    : "Natureza / descrição",
                  detalhe.naturezaOperacao,
                ],
                ["Evento", detalhe.descricaoEvento],
                [
                  "Arquivo",
                  `${detalhe.nomeArquivo} · ${tamanho(detalhe.tamanhoBytes)}`,
                ],
              ]
                .filter(([, v]) => v)
                .map(([r, v]) => (
                  <div key={r as string}>
                    <dt className="text-xs font-medium uppercase text-slate-500">
                      {r}
                    </dt>
                    <dd className="mt-0.5 break-words">{v}</dd>
                  </div>
                ))}
            </dl>

            <div>
              <p className="mb-1 text-xs font-medium uppercase text-slate-500">
                Cliente vinculado
              </p>
              <select
                className={campo}
                value={detalhe.clientId ?? ""}
                onChange={(e) => vincular(e.target.value)}
                disabled={!pode("fiscal.enviar")}
              >
                <option value="">Sem vínculo</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razaoSocial}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-slate-500">
                Arquivos desta chave
              </p>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {[
                  {
                    id: detalhe.id,
                    formato: detalhe.formato,
                    modelo: detalhe.modelo,
                    nomeArquivo: detalhe.nomeArquivo,
                    descricaoEvento: detalhe.descricaoEvento,
                  },
                  ...detalhe.relacionados,
                ].map((r) => (
                  <li key={r.id} className="flex items-center gap-2 px-3 py-2">
                    {r.formato === "PDF" ? (
                      <FileText size={15} className="text-rose-500" />
                    ) : (
                      <FileCode2 size={15} className="text-slate-400" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {r.formato === "PDF"
                        ? MODELOS[r.modelo].pdf
                        : r.modelo === "EVENTO"
                          ? (r.descricaoEvento?.split(" · ")[0] ?? "Evento")
                          : `XML ${MODELOS[r.modelo].nome}`}
                      <span className="ml-2 text-xs text-slate-400">
                        {r.nomeArquivo}
                      </span>
                    </span>
                    <button
                      title="Abrir"
                      onClick={() => abrir(r.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      title="Baixar"
                      onClick={() => baixar(r.id, r.nomeArquivo)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Download size={15} />
                    </button>
                  </li>
                ))}
              </ul>
              {detalhe.formato === "XML" &&
                detalhe.modelo !== "EVENTO" &&
                !detalhe.relacionados.some((r) => r.formato === "PDF") && (
                  <p className="mt-2 text-xs text-slate-500">
                    Sem {MODELOS[detalhe.modelo].pdf} ainda. Envie o PDF e ele
                    se junta a esta nota pela chave.
                  </p>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
