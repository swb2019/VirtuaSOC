"use client";

import { useState } from "react";

export function TenantPickerClient({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={() => {
        setLoading(true);
        fetch("/api/tenancy/select", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug }),
        })
          .then(async (r) => {
            if (!r.ok) throw new Error(`select failed: ${r.status}`);
          })
          // After selecting a tenant, drop the user into the tenant workspace.
          .then(() => (window.location.href = "/products"))
          .catch((e) => {
            const msg = e instanceof Error ? e.message : String(e);
            alert(msg);
            setLoading(false);
          });
      }}
      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
    >
      {loading ? "Selecting…" : "Select"}
    </button>
  );
}


