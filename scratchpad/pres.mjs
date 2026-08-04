const m = await import("../lib/placeholder-data.ts");
const all = m.tournaments ?? [];
const rows = all.filter(t => t.presentedBy).map(t => `  ${String(t.presentedBy).padEnd(10)} <- ${t.name}`);
console.log("events showing a presenter: " + rows.length + " of " + all.length);
console.log(rows.join("\n"));
