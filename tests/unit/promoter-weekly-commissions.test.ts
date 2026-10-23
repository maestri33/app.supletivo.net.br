import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePromoterWeeklyMetrics,
  formatClosingDate,
  type PromoterCommission,
  type PromoterSummary,
} from "../../src/lib/promoter.ts";

test("calculatePromoterWeeklyMetrics with full summary and ledger", () => {
  const summary: PromoterSummary = {
    week_paid_leads: 2,
    week_goal: 5,
    week_commission_total: "100.00",
    bonus_amount: "500.00",
    next_closing_at: "2026-10-30T18:00:00-03:00",
    lifetime: {
      total_students: 5,
      goals_hit: 1,
      total_received: "350.00",
    },
  };

  const commissions: PromoterCommission[] = [
    { external_id: "c1", amount: "50.00", source: "lead", status: "pending", created_at: "2026-10-23T10:00:00Z" },
    { external_id: "c2", amount: "50.00", source: "lead", status: "processed", created_at: "2026-10-23T11:00:00Z" },
    { external_id: "c3", amount: "350.00", source: "lead", status: "paid", created_at: "2026-10-16T18:00:00Z" },
    { external_id: "c4", amount: "100.00", source: "lead", status: "cancelled", created_at: "2026-10-20T12:00:00Z" },
  ];

  const metrics = calculatePromoterWeeklyMetrics(summary, commissions);
  assert.equal(metrics.receivedAmount, "350.00");
  assert.match(metrics.receivedLabel, /350,00/);
  assert.equal(metrics.weekPendingAmount, "100.00");
  assert.match(metrics.weekPendingLabel, /100,00/);
  assert.match(metrics.weekAccruedLabel!, /100,00/);
  assert.match(metrics.closingLabel, /Fechamento:/);
});

test("calculatePromoterWeeklyMetrics with only commissions ledger (no summary)", () => {
  const commissions: PromoterCommission[] = [
    { external_id: "c1", amount: "25.10", source: "lead", status: "pending", created_at: "2026-10-23T10:00:00Z" },
    { external_id: "c2", amount: "50.01", source: "lead", status: "processed", created_at: "2026-10-23T11:00:00Z" },
    { external_id: "c3", amount: "100.00", source: "lead", status: "paid", created_at: "2026-10-16T18:00:00Z" },
    { external_id: "c4", amount: "999.00", source: "lead", status: "cancelled", created_at: "2026-10-20T12:00:00Z" },
    { external_id: "c5", amount: "999.00", source: "lead", status: "failed", created_at: "2026-10-20T12:00:00Z" },
  ];

  const metrics = calculatePromoterWeeklyMetrics(null, commissions);
  assert.equal(metrics.receivedAmount, "100.00");
  assert.match(metrics.receivedLabel, /100,00/);
  assert.equal(metrics.weekPendingAmount, "75.11");
  assert.match(metrics.weekPendingLabel, /75,11/);
  assert.equal(metrics.weekAccruedLabel, null);
  assert.equal(metrics.closingLabel, "Fechamento na sexta-feira às 18:00");
});

test("calculatePromoterWeeklyMetrics with empty data defaults to 0.00", () => {
  const metrics = calculatePromoterWeeklyMetrics(null, []);
  assert.equal(metrics.receivedAmount, "0.00");
  assert.match(metrics.receivedLabel, /0,00/);
  assert.equal(metrics.weekPendingAmount, "0.00");
  assert.match(metrics.weekPendingLabel, /0,00/);
  assert.equal(metrics.weekAccruedLabel, null);
  assert.equal(metrics.closingLabel, "Fechamento na sexta-feira às 18:00");
});

test("formatClosingDate returns fallback on null or invalid input", () => {
  assert.equal(formatClosingDate(null), "Fechamento na sexta-feira às 18:00");
  assert.equal(formatClosingDate(undefined), "Fechamento na sexta-feira às 18:00");
  assert.equal(formatClosingDate("not-a-date"), "Fechamento na sexta-feira às 18:00");
});

test("calculatePromoterWeeklyMetrics handles integer strings and zero amounts without failure", () => {
  const summary: PromoterSummary = {
    week_paid_leads: 0,
    week_goal: 5,
    week_commission_total: "0",
    lifetime: {
      total_students: 0,
      total_received: "0",
    },
  };

  const commissions: PromoterCommission[] = [
    { external_id: "c1", amount: "100", source: "lead", status: "pending", created_at: "2026-10-23T10:00:00Z" },
    { external_id: "c2", amount: "50.5", source: "lead", status: "processed", created_at: "2026-10-23T11:00:00Z" },
    { external_id: "c3", amount: "0", source: "lead", status: "paid", created_at: "2026-10-16T18:00:00Z" },
  ];

  const metrics = calculatePromoterWeeklyMetrics(summary, commissions);
  assert.match(metrics.receivedLabel, /0,00/);
  assert.equal(metrics.weekPendingAmount, "150.50");
  assert.match(metrics.weekPendingLabel, /150,50/);
  assert.match(metrics.weekAccruedLabel!, /0,00/);
});

test("calculatePromoterWeeklyMetrics handles negative commission reversals", () => {
  const commissions: PromoterCommission[] = [
    { external_id: "c1", amount: "100.00", source: "lead", status: "pending", created_at: "2026-10-23T10:00:00Z" },
    { external_id: "c2", amount: "-30.00", source: "reversal", status: "pending", created_at: "2026-10-23T11:00:00Z" },
    { external_id: "c3", amount: "200.00", source: "lead", status: "paid", created_at: "2026-10-16T18:00:00Z" },
    { external_id: "c4", amount: "-50.00", source: "reversal", status: "paid", created_at: "2026-10-16T19:00:00Z" },
  ];

  const metrics = calculatePromoterWeeklyMetrics(null, commissions);
  assert.equal(metrics.receivedAmount, "150.00");
  assert.match(metrics.receivedLabel, /150,00/);
  assert.equal(metrics.weekPendingAmount, "70.00");
  assert.match(metrics.weekPendingLabel, /70,00/);
});
