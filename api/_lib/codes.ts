import crypto from "crypto";
import { supabaseFetch } from "./supabase.js";

export type CatalogItemType = "product" | "course";

export type CatalogCodeTarget = {
  id: string;
  code: string;
  name: string;
  item_type: CatalogItemType;
  product_id: string | null;
};

export function normalizeCode(value: unknown) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function makeCode(prefix: string) {
  return `${prefix}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createUniqueCode(prefix: string, table: string, column = "code") {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = makeCode(prefix);
    const rows = await supabaseFetch<Record<string, unknown>[]>(
      `${table}?select=${column}&${column}=eq.${encodeURIComponent(code)}&limit=1`,
    );
    if (!rows.length) return code;
  }
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function findCatalogItemByCode(rawCode: unknown): Promise<CatalogCodeTarget | null> {
  const code = normalizeCode(rawCode);
  if (!code) return null;

  const products = await supabaseFetch<{ id: string; code?: string; name: string }[]>(
    `products?select=id,code,name&code=eq.${encodeURIComponent(code)}&limit=1`,
  );
  const product = products[0];
  if (product) {
    return {
      id: product.id,
      code: normalizeCode(product.code),
      name: product.name,
      item_type: "product",
      product_id: product.id,
    };
  }

  const courses = await supabaseFetch<{ id: string; code?: string; name: string }[]>(
    `courses?select=id,code,name&code=eq.${encodeURIComponent(code)}&limit=1`,
  );
  const course = courses[0];
  if (!course) return null;

  return {
    id: course.id,
    code: normalizeCode(course.code),
    name: course.name,
    item_type: "course",
    product_id: null,
  };
}
