"use client";

import { useEffect } from "react";

import type { CampaignSchedule } from "@/lib/meta/campaign-schedule";
import {
  datetimeLocalInputToIso,
  isoToDatetimeLocalInput,
  minutesToTimeInput,
  timeInputToMinutes,
} from "@/lib/wizard/datetime-local-iso";

const WEEK = [
  { day: 1 as const, label: "Seg" },
  { day: 2 as const, label: "Ter" },
  { day: 3 as const, label: "Qua" },
  { day: 4 as const, label: "Qui" },
  { day: 5 as const, label: "Sex" },
  { day: 6 as const, label: "Sáb" },
  { day: 7 as const, label: "Dom" },
];

type BudgetPeriod = "daily" | "lifetime";

interface Step2ScheduleProps {
  budgetPeriod: BudgetPeriod;
  campaignSchedule: CampaignSchedule;
  onSetCampaignSchedule: (patch: Partial<CampaignSchedule>) => void;
}

export function Step2Schedule({ budgetPeriod, campaignSchedule, onSetCampaignSchedule }: Step2ScheduleProps) {
  useEffect(() => {
    if (budgetPeriod !== "daily") return;
    if (campaignSchedule.dayparting.enabled) {
      onSetCampaignSchedule({ dayparting: { enabled: false, segments: [] } });
    }
    if (campaignSchedule.flightMode === "custom_dates") {
      onSetCampaignSchedule({
        flightMode: "automatic",
        flightStart: undefined,
        flightEnd: undefined,
      });
    }
  }, [budgetPeriod, campaignSchedule.flightMode, campaignSchedule.dayparting.enabled, onSetCampaignSchedule]);

  useEffect(() => {
    if (budgetPeriod !== "lifetime") return;
    if (campaignSchedule.openEndedFlight) {
      onSetCampaignSchedule({ openEndedFlight: false });
    }
  }, [budgetPeriod, campaignSchedule.openEndedFlight, onSetCampaignSchedule]);

  const s = campaignSchedule;

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Agendamento e frequência</h4>
      <p className="text-xs text-gray-600">
        Aplicado na criação no Meta. Dayparting usa a timezone da conta de anúncios no Meta. Datas de início/fim do
        voo são convertidas a partir da hora local deste dispositivo e enviadas em UTC+0000 (ver aviso na fila após
        publicar).
      </p>

      {budgetPeriod === "lifetime" ? (
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-700">Voo (orçamento vitalício)</span>
          <p className="text-xs text-gray-600">
            No Meta, <span className="font-medium text-gray-800">orçamento vitalício exige sempre uma data de fim</span>{" "}
            do voo. Para uma campanha contínua sem data de fim, usa orçamento diário e a opção «Sem data de fim»
            abaixo.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onSetCampaignSchedule({
                  flightMode: "automatic",
                  flightStart: undefined,
                  flightEnd: undefined,
                  openEndedFlight: false,
                })
              }
              className={`rounded-md border px-3 py-1.5 text-xs ${
                s.flightMode === "automatic"
                  ? "border-[#7132f5] bg-[rgba(113,50,245,0.12)] text-brand-purple-dark font-medium"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              Automático (30 dias)
            </button>
            <button
              type="button"
              onClick={() =>
                onSetCampaignSchedule({ flightMode: "custom_dates", openEndedFlight: false })
              }
              className={`rounded-md border px-3 py-1.5 text-xs ${
                s.flightMode === "custom_dates"
                  ? "border-[#7132f5] bg-[rgba(113,50,245,0.12)] text-brand-purple-dark font-medium"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              Datas personalizadas
            </button>
          </div>
          {s.flightMode === "custom_dates" ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-gray-600">
                Início
                <input
                  type="datetime-local"
                  value={isoToDatetimeLocalInput(s.flightStart ?? "")}
                  onChange={(e) => onSetCampaignSchedule({ flightStart: datetimeLocalInputToIso(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
                />
              </label>
              <label className="text-xs text-gray-600">
                Fim
                <input
                  type="datetime-local"
                  value={isoToDatetimeLocalInput(s.flightEnd ?? "")}
                  onChange={(e) => onSetCampaignSchedule({ flightEnd: datetimeLocalInputToIso(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
                />
              </label>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <span className="text-xs font-medium text-gray-700">Voo (orçamento diário)</span>
          <p className="text-xs text-gray-600">
            Opcional: agenda o primeiro início do conjunto de anúncios. Podes deixar a campanha sem data de fim (no
            Meta o fim do voo fica contínuo) ou definir uma data de encerramento (janela mínima de 24 horas entre
            início e fim).
          </p>
          <label className="block text-xs text-gray-600">
            Início (opcional)
            <input
              type="datetime-local"
              value={isoToDatetimeLocalInput(s.flightStart ?? "")}
              onChange={(e) => onSetCampaignSchedule({ flightStart: datetimeLocalInputToIso(e.target.value) })}
              className="mt-1 w-full max-w-md rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={s.openEndedFlight}
              onChange={(e) => {
                const open = e.target.checked;
                onSetCampaignSchedule({
                  openEndedFlight: open,
                  ...(open ? { flightEnd: undefined } : {}),
                });
              }}
              className="rounded border-gray-300"
            />
            Sem data de fim (campanha contínua)
          </label>
          {!s.openEndedFlight ? (
            <label className="block text-xs text-gray-600">
              Fim do voo {s.flightStart?.trim() ? "(obrigatório se há início)" : "(opcional até definires início)"}
              <input
                type="datetime-local"
                value={isoToDatetimeLocalInput(s.flightEnd ?? "")}
                onChange={(e) => onSetCampaignSchedule({ flightEnd: datetimeLocalInputToIso(e.target.value) })}
                className="mt-1 w-full max-w-md rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
              />
            </label>
          ) : null}
        </div>
      )}

      <div className="border-t border-gray-200 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={s.dayparting.enabled}
            disabled={budgetPeriod !== "lifetime"}
            onChange={(e) => {
              const enabled = e.target.checked;
              onSetCampaignSchedule({
                dayparting: enabled
                  ? {
                      enabled: true,
                      segments:
                        s.dayparting.segments.length > 0
                          ? s.dayparting.segments
                          : [{ days: [1, 2, 3, 4, 5], startMinute: 9 * 60, endMinute: 18 * 60 }],
                    }
                  : { enabled: false, segments: [] },
              });
            }}
            className="rounded border-gray-300"
          />
          Dayparting (horas e dias da semana)
        </label>

        {s.dayparting.enabled && budgetPeriod === "lifetime" ? (
          <div className="mt-3 space-y-3">
            {s.dayparting.segments.map((seg, idx) => (
              <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-2 flex flex-wrap gap-1">
                  {WEEK.map(({ day, label }) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const has = seg.days.includes(day);
                        const days = has ? seg.days.filter((d) => d !== day) : [...seg.days, day].sort((a, b) => a - b);
                        const next = [...s.dayparting.segments];
                        next[idx] = { ...seg, days };
                        onSetCampaignSchedule({ dayparting: { ...s.dayparting, segments: next } });
                      }}
                      className={`rounded px-2 py-1 text-[11px] ${
                        seg.days.includes(day)
                          ? "bg-[#7132f5] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs text-gray-600">
                    Das
                    <input
                      type="time"
                      value={minutesToTimeInput(seg.startMinute)}
                      onChange={(e) => {
                        const next = [...s.dayparting.segments];
                        next[idx] = { ...seg, startMinute: timeInputToMinutes(e.target.value) };
                        onSetCampaignSchedule({ dayparting: { ...s.dayparting, segments: next } });
                      }}
                      className="mt-1 block rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs text-gray-600">
                    às
                    <input
                      type="time"
                      value={minutesToTimeInput(seg.endMinute)}
                      onChange={(e) => {
                        const next = [...s.dayparting.segments];
                        next[idx] = { ...seg, endMinute: timeInputToMinutes(e.target.value) };
                        onSetCampaignSchedule({ dayparting: { ...s.dayparting, segments: next } });
                      }}
                      className="mt-1 block rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      const next = s.dayparting.segments.filter((_, j) => j !== idx);
                      onSetCampaignSchedule({
                        dayparting: {
                          ...s.dayparting,
                          segments: next.length ? next : [{ days: [1, 2, 3, 4, 5], startMinute: 9 * 60, endMinute: 18 * 60 }],
                        },
                      });
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-xs font-medium text-[#7132f5] hover:underline"
              onClick={() =>
                onSetCampaignSchedule({
                  dayparting: {
                    ...s.dayparting,
                    segments: [...s.dayparting.segments, { days: [6, 7], startMinute: 10 * 60, endMinute: 22 * 60 }],
                  },
                })
              }
            >
              + Adicionar intervalo
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-gray-200 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={s.frequencyCap != null}
            onChange={(e) =>
              onSetCampaignSchedule({
                frequencyCap: e.target.checked ? { intervalDays: 7, maxImpressions: 5 } : null,
              })
            }
            className="rounded border-gray-300"
          />
          Limite de frequência (impressões)
        </label>
        {s.frequencyCap ? (
          <div className="mt-2 flex flex-wrap gap-3">
            <label className="text-xs text-gray-600">
              Janela (dias)
              <input
                type="number"
                min={1}
                max={90}
                value={s.frequencyCap.intervalDays}
                onChange={(e) =>
                  onSetCampaignSchedule({
                    frequencyCap: {
                      ...s.frequencyCap!,
                      intervalDays: Number(e.target.value) || 1,
                    },
                  })
                }
                className="mt-1 block w-24 rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs text-gray-600">
              Máx. impressões
              <input
                type="number"
                min={1}
                max={90}
                value={s.frequencyCap.maxImpressions}
                onChange={(e) =>
                  onSetCampaignSchedule({
                    frequencyCap: {
                      ...s.frequencyCap!,
                      maxImpressions: Number(e.target.value) || 1,
                    },
                  })
                }
                className="mt-1 block w-24 rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
        ) : null}
      </div>
    </section>
  );
}
