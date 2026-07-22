import assert from "node:assert/strict";
import { calculateJudicialOrderDeadline } from "@/lib/judicial-order-deadline";

const running = calculateJudicialOrderDeadline({
  receivedDateValue: "2026-07-13",
  today: new Date(2026, 6, 16)
});
assert.equal(running.status, "running");
assert.equal(running.daysLeft, 7);

const weekend = calculateJudicialOrderDeadline({
  receivedDateValue: "2026-07-08",
  today: new Date(2026, 6, 16)
});
assert.equal(weekend.movedFromWeekend, true);
assert.equal(weekend.deadline?.getDay(), 1);

const unknown = calculateJudicialOrderDeadline({ unknownReceiptDate: true });
assert.equal(unknown.status, "unknown");

console.log("judicial-order-deadline tests passed");
