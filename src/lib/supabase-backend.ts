/**
 * Supabase Backend – routes every /api/* call to Supabase.
 * This replaces the need for a traditional REST server.
 */
import {
  supabase,
  getAdminSession,
  setAdminSession,
  clearAdminSession,
} from "./supabase";

// ── Helpers ───────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Matches a path against a pattern like `/api/products/id/:id` */
function match(
  path: string,
  pattern: string
): Record<string, string> | null {
  const pp = path.split("/").filter(Boolean);
  const tp = pattern.split("/").filter(Boolean);
  if (pp.length !== tp.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < tp.length; i++) {
    if (tp[i].startsWith(":")) {
      params[tp[i].slice(1)] = decodeURIComponent(pp[i]);
    } else if (tp[i] !== pp[i]) {
      return null;
    }
  }
  return params;
}

/** Transform a Supabase product row (with joined brand/category) to API shape */
function transformProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brandId: row.brand_id,
    brandName: row.brands?.name ?? null,
    categoryId: row.category_id ?? null,
    categoryName: row.categories?.name ?? null,
    oilType: row.oil_type,
    viscosityGrade: row.viscosity_grade ?? null,
    volume: row.volume,
    price: Number(row.price),
    description: row.description,
    apiStandard: row.api_standard ?? null,
    images: row.images ?? [],
    compatibleVehicleTypes: row.compatible_vehicle_types ?? [],
    inStock: row.in_stock,
    featured: row.featured,
    securitySheetUrl: row.security_sheet_url ?? null,
    technicalSheetUrl: row.technical_sheet_url ?? null,
    metaPixelId: row.meta_pixel_id ?? null,
    createdAt: row.created_at,
  };
}

/** Transform an order row (with joined product) to API shape */
function transformOrder(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? null,
    productPrice: row.products ? Number(row.products.price) : null,
    productSlug: row.products?.slug ?? null,
    customerName: row.customer_name,
    phone: row.phone,
    wilayaCode: row.wilaya_code,
    wilayaName: row.wilaya_name,
    address: row.address,
    quantity: row.quantity,
    deliveryType: row.delivery_type || "stopdesk",
    deliveryPrice: Number(row.delivery_price),
    totalPrice: Number(row.total_price),
    status: row.status,
    notes: row.notes ?? null,
    createdAt: row.created_at,
  };
}

// ── Error helper ──────────────────────────────────────────

class RouteError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ── Main Router ───────────────────────────────────────────

export async function handleApiRoute(
  url: string,
  method: string,
  body?: any
): Promise<{ data: any; status: number }> {
  // Parse URL
  const u = new URL(url, "http://localhost");
  const path = u.pathname;
  const q = Object.fromEntries(u.searchParams.entries());

  let m: Record<string, string> | null;

  // ═══════════════════════════════════════════════════════
  //  HEALTH CHECK
  // ═══════════════════════════════════════════════════════
  if (method === "GET" && path === "/api/healthz") {
    return { data: { status: "ok" }, status: 200 };
  }

  // ═══════════════════════════════════════════════════════
  //  ADMIN AUTH (hardcoded credentials)
  // ═══════════════════════════════════════════════════════
  if (method === "POST" && path === "/api/admin/login") {
    const { email, password } = body;
    const ADMIN_EMAIL = "admin@petrowest.dz";
    const ADMIN_PASSWORD = "PetroWest2026!";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const admin = { id: 1, email: ADMIN_EMAIL, name: "Admin Petro West" };
      setAdminSession(admin);
      return { data: { success: true, admin }, status: 200 };
    }
    throw new RouteError(401, "Invalid credentials");
  }

  if (method === "POST" && path === "/api/admin/logout") {
    clearAdminSession();
    return { data: { success: true, message: "Logged out" }, status: 200 };
  }

  if (method === "GET" && path === "/api/admin/me") {
    const session = getAdminSession();
    if (!session) throw new RouteError(401, "Unauthorized");
    return { data: session, status: 200 };
  }

  // ═══════════════════════════════════════════════════════
  //  PRODUCTS
  // ═══════════════════════════════════════════════════════

  // List products
  if (method === "GET" && path === "/api/products") {
    const page = parseInt(q.page || "1");
    const limit = parseInt(q.limit || "12");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select("*, brands!brand_id(name), categories!category_id(name)", {
        count: "exact",
      });

    if (q.search) {
      query = query.ilike("name", `%${q.search}%`);
    }
    if (q.brand) {
      // Filter by brand name – need to get brand id first
      const { data: brandRow } = await supabase
        .from("brands")
        .select("id")
        .eq("name", q.brand)
        .maybeSingle();
      if (brandRow) query = query.eq("brand_id", brandRow.id);
      else query = query.eq("brand_id", -1); // no match
    }
    if (q.oilType) {
      query = query.eq("oil_type", q.oilType);
    }
    if (q.categoryId) {
      query = query.eq("category_id", Number(q.categoryId));
    }
    if (q.inStock === "true") {
      query = query.eq("in_stock", true);
    }
    if (q.minPrice) {
      query = query.gte("price", Number(q.minPrice));
    }
    if (q.maxPrice) {
      query = query.lte("price", Number(q.maxPrice));
    }
    if (q.featured === "true") {
      query = query.eq("featured", true);
    }

    query = query.order("created_at", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new RouteError(500, error.message);

    return {
      data: {
        products: (data || []).map(transformProduct),
        total: count || 0,
        page,
        limit,
      },
      status: 200,
    };
  }

  // Create product
  if (method === "POST" && path === "/api/products") {
    const slug = slugify(body.name) + "-" + Date.now().toString(36);
    const row = {
      name: body.name,
      slug,
      brand_id: body.brandId,
      category_id: body.categoryId ?? null,
      oil_type: body.oilType,
      viscosity_grade: body.viscosityGrade ?? null,
      volume: body.volume,
      price: body.price,
      description: body.description,
      api_standard: body.apiStandard ?? null,
      images: body.images ?? [],
      compatible_vehicle_types: body.compatibleVehicleTypes ?? [],
      in_stock: body.inStock ?? true,
      featured: body.featured ?? false,
      security_sheet_url: body.securitySheetUrl ?? null,
      technical_sheet_url: body.technicalSheetUrl ?? null,
      meta_pixel_id: body.metaPixelId ?? null,
    };
    const { data, error } = await supabase
      .from("products")
      .insert(row)
      .select("*, brands!brand_id(name), categories!category_id(name)")
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: transformProduct(data), status: 201 };
  }

  // Get product by slug
  if (method === "GET" && (m = match(path, "/api/products/:slug")) && !path.includes("/id/")) {
    const { data, error } = await supabase
      .from("products")
      .select("*, brands!brand_id(name), categories!category_id(name)")
      .eq("slug", m.slug)
      .maybeSingle();
    if (error) throw new RouteError(500, error.message);
    if (!data) throw new RouteError(404, "Product not found");
    return { data: transformProduct(data), status: 200 };
  }

  // Toggle product stock
  if (method === "PATCH" && (m = match(path, "/api/products/id/:id/stock"))) {
    const { data, error } = await supabase
      .from("products")
      .update({ in_stock: body.inStock })
      .eq("id", Number(m.id))
      .select("*, brands!brand_id(name), categories!category_id(name)")
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: transformProduct(data), status: 200 };
  }

  // Get product by ID
  if (method === "GET" && (m = match(path, "/api/products/id/:id"))) {
    const { data, error } = await supabase
      .from("products")
      .select("*, brands!brand_id(name), categories!category_id(name)")
      .eq("id", Number(m.id))
      .maybeSingle();
    if (error) throw new RouteError(500, error.message);
    if (!data) throw new RouteError(404, "Product not found");
    return { data: transformProduct(data), status: 200 };
  }

  // Update product by ID
  if (method === "PATCH" && (m = match(path, "/api/products/id/:id"))) {
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.brandId !== undefined) updates.brand_id = body.brandId;
    if (body.categoryId !== undefined) updates.category_id = body.categoryId;
    if (body.oilType !== undefined) updates.oil_type = body.oilType;
    if (body.viscosityGrade !== undefined) updates.viscosity_grade = body.viscosityGrade;
    if (body.volume !== undefined) updates.volume = body.volume;
    if (body.price !== undefined) updates.price = body.price;
    if (body.description !== undefined) updates.description = body.description;
    if (body.apiStandard !== undefined) updates.api_standard = body.apiStandard;
    if (body.images !== undefined) updates.images = body.images;
    if (body.compatibleVehicleTypes !== undefined) updates.compatible_vehicle_types = body.compatibleVehicleTypes;
    if (body.inStock !== undefined) updates.in_stock = body.inStock;
    if (body.featured !== undefined) updates.featured = body.featured;
    if (body.securitySheetUrl !== undefined) updates.security_sheet_url = body.securitySheetUrl;
    if (body.technicalSheetUrl !== undefined) updates.technical_sheet_url = body.technicalSheetUrl;
    if (body.metaPixelId !== undefined) updates.meta_pixel_id = body.metaPixelId;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", Number(m.id))
      .select("*, brands!brand_id(name), categories!category_id(name)")
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: transformProduct(data), status: 200 };
  }

  // Delete product by ID
  if (method === "DELETE" && (m = match(path, "/api/products/id/:id"))) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  ORDERS
  // ═══════════════════════════════════════════════════════

  // Order stats
  if (method === "GET" && path === "/api/orders/stats") {
    const { data, error } = await supabase.rpc("get_order_stats");
    if (error) throw new RouteError(500, error.message);
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  // List orders — uses SECURITY DEFINER RPC to bypass RLS entirely
  if (method === "GET" && path === "/api/orders") {
    const page  = parseInt(q.page  || "1");
    const limit = parseInt(q.limit || "20");

    const { data, error } = await supabase.rpc("list_orders_admin", {
      p_status:    q.status    || null,
      p_search:    q.search    || null,
      p_date_from: q.dateFrom  || null,
      p_date_to:   q.dateTo    || null,
      p_page:      page,
      p_limit:     limit,
    });
    if (error) throw new RouteError(500, error.message);

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  // Create order (via RPC)
  if (method === "POST" && path === "/api/orders") {
    const { data, error } = await supabase.rpc("create_order", {
      p_product_id: body.productId,
      p_customer_name: body.customerName,
      p_phone: body.phone,
      p_wilaya_code: body.wilayaCode,
      p_address: body.address,
      p_quantity: body.quantity,
      p_delivery_type: body.deliveryType || "stopdesk",
    });
    if (error) throw new RouteError(500, error.message);
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 201 };
  }

  // Get order by ID — uses SECURITY DEFINER RPC to bypass RLS
  if (method === "GET" && (m = match(path, "/api/orders/:id"))) {
    const { data, error } = await supabase.rpc("get_order_by_id_admin", {
      p_id: Number(m.id),
    });
    if (error) {
      if (error.message?.includes("not found")) throw new RouteError(404, "Order not found");
      throw new RouteError(500, error.message);
    }
    if (!data) throw new RouteError(404, "Order not found");
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  // Update order — uses SECURITY DEFINER RPC to bypass RLS
  if (method === "PATCH" && (m = match(path, "/api/orders/:id"))) {
    const { data, error } = await supabase.rpc("update_order_admin", {
      p_id:     Number(m.id),
      p_status: body.status ?? null,
      p_notes:  body.notes  ?? null,
    });
    if (error) {
      if (error.message?.includes("not found")) throw new RouteError(404, "Order not found");
      throw new RouteError(500, error.message);
    }
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  // ═══════════════════════════════════════════════════════
  //  CATEGORIES
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/categories") {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, image")
      .order("name");
    if (error) throw new RouteError(500, error.message);

    // Get product counts per category
    const { data: counts } = await supabase
      .from("products")
      .select("category_id");

    const countMap: Record<number, number> = {};
    (counts || []).forEach((p: any) => {
      if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    });

    const result = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      image: c.image ?? null,
      productCount: countMap[c.id] || 0,
    }));
    return { data: result, status: 200 };
  }

  if (method === "POST" && path === "/api/categories") {
    const row: any = { name: body.name };
    if (body.image !== undefined) row.image = body.image;
    const { data, error } = await supabase
      .from("categories")
      .insert(row)
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: { id: data.id, name: data.name, image: data.image ?? null, productCount: 0 }, status: 201 };
  }

  if (method === "PATCH" && (m = match(path, "/api/categories/:id"))) {
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.image !== undefined) updates.image = body.image;
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", Number(m.id))
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: { id: data.id, name: data.name, image: data.image ?? null, productCount: 0 }, status: 200 };
  }

  if (method === "DELETE" && (m = match(path, "/api/categories/:id"))) {
    const { error } = await supabase.from("categories").delete().eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  BRANDS
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/brands") {
    const { data, error } = await supabase
      .from("brands")
      .select("id, name")
      .order("name");
    if (error) throw new RouteError(500, error.message);

    const { data: counts } = await supabase
      .from("products")
      .select("brand_id");

    const countMap: Record<number, number> = {};
    (counts || []).forEach((p: any) => {
      countMap[p.brand_id] = (countMap[p.brand_id] || 0) + 1;
    });

    const result = (data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      productCount: countMap[b.id] || 0,
    }));
    return { data: result, status: 200 };
  }

  if (method === "POST" && path === "/api/brands") {
    const { data, error } = await supabase
      .from("brands")
      .insert({ name: body.name })
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: { id: data.id, name: data.name, productCount: 0 }, status: 201 };
  }

  if (method === "PATCH" && (m = match(path, "/api/brands/:id"))) {
    const { data, error } = await supabase
      .from("brands")
      .update({ name: body.name })
      .eq("id", Number(m.id))
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: { id: data.id, name: data.name, productCount: 0 }, status: 200 };
  }

  if (method === "DELETE" && (m = match(path, "/api/brands/:id"))) {
    const { error } = await supabase.from("brands").delete().eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  OIL TYPES
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/oil-types") {
    const { data, error } = await supabase
      .from("oil_types")
      .select("id, name")
      .order("name");
    if (error) throw new RouteError(500, error.message);

    // Get product counts per oil type
    const { data: products } = await supabase
      .from("products")
      .select("oil_type");

    const countMap: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      if (p.oil_type) countMap[p.oil_type] = (countMap[p.oil_type] || 0) + 1;
    });

    const result = (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      productCount: countMap[t.name] || 0,
    }));
    return { data: result, status: 200 };
  }

  if (method === "POST" && path === "/api/oil-types") {
    const { data, error } = await supabase
      .from("oil_types")
      .insert({ name: body.name })
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: { id: data.id, name: data.name, productCount: 0 }, status: 201 };
  }

  if (method === "PATCH" && (m = match(path, "/api/oil-types/:id"))) {
    const { data, error } = await supabase
      .from("oil_types")
      .update({ name: body.name })
      .eq("id", Number(m.id))
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: { id: data.id, name: data.name, productCount: 0 }, status: 200 };
  }

  if (method === "DELETE" && (m = match(path, "/api/oil-types/:id"))) {
    const { error } = await supabase.from("oil_types").delete().eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  VEHICLE CATEGORIES
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/vehicle/categories") {
    const { data, error } = await supabase
      .from("vehicle_categories")
      .select("id, name")
      .order("id");
    if (error) throw new RouteError(500, error.message);

    const { data: brands } = await supabase
      .from("vehicle_brands")
      .select("vehicle_category_id");

    const countMap: Record<number, number> = {};
    (brands || []).forEach((b: any) => {
      countMap[b.vehicle_category_id] = (countMap[b.vehicle_category_id] || 0) + 1;
    });

    const result = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      brandCount: countMap[c.id] || 0,
    }));
    return { data: result, status: 200 };
  }

  if (method === "POST" && path === "/api/vehicle/categories") {
    const { data, error } = await supabase
      .from("vehicle_categories")
      .insert({ name: body.name })
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: { id: data.id, name: data.name, brandCount: 0 }, status: 201 };
  }

  if (method === "PATCH" && (m = match(path, "/api/vehicle/categories/:id"))) {
    const { data, error } = await supabase
      .from("vehicle_categories")
      .update({ name: body.name })
      .eq("id", Number(m.id))
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return { data: { id: data.id, name: data.name, brandCount: 0 }, status: 200 };
  }

  if (method === "DELETE" && (m = match(path, "/api/vehicle/categories/:id"))) {
    const { error } = await supabase.from("vehicle_categories").delete().eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  VEHICLE BRANDS
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/vehicle/brands") {
    let query = supabase
      .from("vehicle_brands")
      .select("id, name, logo_url, vehicle_category_id, vehicle_categories!vehicle_category_id(name)")
      .order("name");

    if (q.vehicleCategoryId) {
      query = query.eq("vehicle_category_id", Number(q.vehicleCategoryId));
    }

    const { data, error } = await query;
    if (error) throw new RouteError(500, error.message);

    const { data: models } = await supabase
      .from("vehicle_models")
      .select("vehicle_brand_id");

    const countMap: Record<number, number> = {};
    (models || []).forEach((m: any) => {
      countMap[m.vehicle_brand_id] = (countMap[m.vehicle_brand_id] || 0) + 1;
    });

    const result = (data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      logoUrl: b.logo_url ?? null,
      vehicleCategoryId: b.vehicle_category_id,
      vehicleCategoryName: b.vehicle_categories?.name ?? null,
      modelCount: countMap[b.id] || 0,
    }));
    return { data: result, status: 200 };
  }

  if (method === "POST" && path === "/api/vehicle/brands") {
    const { data, error } = await supabase
      .from("vehicle_brands")
      .insert({
        name: body.name,
        vehicle_category_id: body.vehicleCategoryId,
        logo_url: body.logoUrl ?? null,
      })
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return {
      data: {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url ?? null,
        vehicleCategoryId: data.vehicle_category_id,
        vehicleCategoryName: null,
        modelCount: 0,
      },
      status: 201,
    };
  }

  if (method === "PATCH" && (m = match(path, "/api/vehicle/brands/:id"))) {
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.vehicleCategoryId !== undefined) updates.vehicle_category_id = body.vehicleCategoryId;
    if (body.logoUrl !== undefined) updates.logo_url = body.logoUrl;

    const { data, error } = await supabase
      .from("vehicle_brands")
      .update(updates)
      .eq("id", Number(m.id))
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return {
      data: {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url ?? null,
        vehicleCategoryId: data.vehicle_category_id,
        vehicleCategoryName: null,
        modelCount: 0,
      },
      status: 200,
    };
  }

  if (method === "DELETE" && (m = match(path, "/api/vehicle/brands/:id"))) {
    const { error } = await supabase.from("vehicle_brands").delete().eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  VEHICLE MODELS
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/vehicle/models") {
    let query = supabase
      .from("vehicle_models")
      .select("id, name, vehicle_brand_id, vehicle_brands!vehicle_brand_id(name)")
      .order("name");

    if (q.vehicleBrandId) {
      query = query.eq("vehicle_brand_id", Number(q.vehicleBrandId));
    }

    const { data, error } = await query;
    if (error) throw new RouteError(500, error.message);

    const { data: versions } = await supabase
      .from("vehicle_versions")
      .select("vehicle_model_id");

    const countMap: Record<number, number> = {};
    (versions || []).forEach((v: any) => {
      countMap[v.vehicle_model_id] = (countMap[v.vehicle_model_id] || 0) + 1;
    });

    const result = (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      vehicleBrandId: m.vehicle_brand_id,
      vehicleBrandName: m.vehicle_brands?.name ?? null,
      versionCount: countMap[m.id] || 0,
    }));
    return { data: result, status: 200 };
  }

  if (method === "POST" && path === "/api/vehicle/models") {
    const { data, error } = await supabase
      .from("vehicle_models")
      .insert({ name: body.name, vehicle_brand_id: body.vehicleBrandId })
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return {
      data: {
        id: data.id,
        name: data.name,
        vehicleBrandId: data.vehicle_brand_id,
        vehicleBrandName: null,
        versionCount: 0,
      },
      status: 201,
    };
  }

  if (method === "PATCH" && (m = match(path, "/api/vehicle/models/:id"))) {
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.vehicleBrandId !== undefined) updates.vehicle_brand_id = body.vehicleBrandId;

    const { data, error } = await supabase
      .from("vehicle_models")
      .update(updates)
      .eq("id", Number(m.id))
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return {
      data: {
        id: data.id,
        name: data.name,
        vehicleBrandId: data.vehicle_brand_id,
        vehicleBrandName: null,
        versionCount: 0,
      },
      status: 200,
    };
  }

  if (method === "DELETE" && (m = match(path, "/api/vehicle/models/:id"))) {
    const { error } = await supabase.from("vehicle_models").delete().eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  VEHICLE VERSIONS
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/vehicle/versions") {
    let query = supabase
      .from("vehicle_versions")
      .select(
        "id, name, vehicle_model_id, recommended_product_id, vehicle_models!vehicle_model_id(name), products!recommended_product_id(name)"
      )
      .order("name");

    if (q.vehicleModelId) {
      query = query.eq("vehicle_model_id", Number(q.vehicleModelId));
    }

    const { data, error } = await query;
    if (error) throw new RouteError(500, error.message);

    const result = (data || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      vehicleModelId: v.vehicle_model_id,
      vehicleModelName: v.vehicle_models?.name ?? null,
      recommendedProductId: v.recommended_product_id ?? null,
      recommendedProductName: v.products?.name ?? null,
    }));
    return { data: result, status: 200 };
  }

  if (method === "POST" && path === "/api/vehicle/versions") {
    const { data, error } = await supabase
      .from("vehicle_versions")
      .insert({
        name: body.name,
        vehicle_model_id: body.vehicleModelId,
        recommended_product_id: body.recommendedProductId ?? null,
      })
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return {
      data: {
        id: data.id,
        name: data.name,
        vehicleModelId: data.vehicle_model_id,
        vehicleModelName: null,
        recommendedProductId: data.recommended_product_id,
        recommendedProductName: null,
      },
      status: 201,
    };
  }

  if (method === "PATCH" && (m = match(path, "/api/vehicle/versions/:id"))) {
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.vehicleModelId !== undefined) updates.vehicle_model_id = body.vehicleModelId;
    if (body.recommendedProductId !== undefined)
      updates.recommended_product_id = body.recommendedProductId;

    const { data, error } = await supabase
      .from("vehicle_versions")
      .update(updates)
      .eq("id", Number(m.id))
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return {
      data: {
        id: data.id,
        name: data.name,
        vehicleModelId: data.vehicle_model_id,
        vehicleModelName: null,
        recommendedProductId: data.recommended_product_id,
        recommendedProductName: null,
      },
      status: 200,
    };
  }

  if (method === "DELETE" && (m = match(path, "/api/vehicle/versions/:id"))) {
    const { error } = await supabase.from("vehicle_versions").delete().eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  VEHICLE YEARS
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/vehicle/years") {
    let query = supabase
      .from("vehicle_years")
      .select("id, year, vehicle_version_id")
      .order("year", { ascending: false });

    if (q.vehicleVersionId) {
      query = query.eq("vehicle_version_id", Number(q.vehicleVersionId));
    }

    const { data, error } = await query;
    if (error) throw new RouteError(500, error.message);

    const result = (data || []).map((y: any) => ({
      id: y.id,
      year: y.year,
      vehicleVersionId: y.vehicle_version_id,
    }));
    return { data: result, status: 200 };
  }

  if (method === "POST" && path === "/api/vehicle/years") {
    const { data, error } = await supabase
      .from("vehicle_years")
      .insert({
        year: body.year,
        vehicle_version_id: body.vehicleVersionId,
      })
      .select()
      .single();
    if (error) throw new RouteError(500, error.message);
    return {
      data: {
        id: data.id,
        year: data.year,
        vehicleVersionId: data.vehicle_version_id,
      },
      status: 201,
    };
  }

  if (method === "DELETE" && (m = match(path, "/api/vehicle/years/:id"))) {
    const { error } = await supabase.from("vehicle_years").delete().eq("id", Number(m.id));
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  VEHICLE YEAR PRODUCTS (multi-product recommendations)
  // ═══════════════════════════════════════════════════════

  // Get products for a given year
  if (method === "GET" && (m = match(path, "/api/vehicle/years/:id/products"))) {
    const { data, error } = await supabase
      .from("vehicle_year_products")
      .select("id, product_id, products!product_id(name, slug, price, images, brands!brand_id(name))")
      .eq("vehicle_year_id", Number(m.id));
    if (error) throw new RouteError(500, error.message);

    const result = (data || []).map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.products?.name ?? null,
      productSlug: r.products?.slug ?? null,
      productPrice: r.products ? Number(r.products.price) : null,
      productImage: r.products?.images?.[0] ?? null,
      productBrandName: r.products?.brands?.name ?? null,
    }));
    return { data: result, status: 200 };
  }

  // Set products for a year (replace all)
  if (method === "PUT" && (m = match(path, "/api/vehicle/years/:id/products"))) {
    const yearId = Number(m.id);
    // Remove existing
    await supabase.from("vehicle_year_products").delete().eq("vehicle_year_id", yearId);
    // Insert new
    const productIds: number[] = body.productIds || [];
    if (productIds.length > 0) {
      const rows = productIds.map((pid: number) => ({ vehicle_year_id: yearId, product_id: pid }));
      const { error } = await supabase.from("vehicle_year_products").insert(rows);
      if (error) throw new RouteError(500, error.message);
    }
    // Return the new list
    const { data } = await supabase
      .from("vehicle_year_products")
      .select("id, product_id")
      .eq("vehicle_year_id", yearId);
    return { data: (data || []).map((r: any) => ({ id: r.id, productId: r.product_id })), status: 200 };
  }

  // ═══════════════════════════════════════════════════════
  //  VEHICLE RECOMMEND (updated: year-based, multiple)
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/vehicle/recommend") {
    const yearId = Number(q.vehicleYearId);
    // Legacy: support old vehicleVersionId param
    const versionId = Number(q.vehicleVersionId);

    if (yearId) {
      // New path: get products for a specific year
      const { data: links, error } = await supabase
        .from("vehicle_year_products")
        .select("product_id")
        .eq("vehicle_year_id", yearId);
      if (error) throw new RouteError(500, error.message);
      if (!links || links.length === 0) throw new RouteError(404, "No recommendations for this year");

      const ids = links.map((l: any) => l.product_id);
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("*, brands!brand_id(name), categories!category_id(name)")
        .in("id", ids);
      if (pErr) throw new RouteError(500, pErr.message);

      return { data: (products || []).map(transformProduct), status: 200 };
    }

    if (versionId) {
      // Legacy single-product fallback via recommended_product_id
      const { data: version, error: vErr } = await supabase
        .from("vehicle_versions")
        .select("recommended_product_id")
        .eq("id", versionId)
        .maybeSingle();
      if (vErr) throw new RouteError(500, vErr.message);
      if (!version?.recommended_product_id)
        throw new RouteError(404, "No recommendation for this version");

      const { data: product, error: pErr } = await supabase
        .from("products")
        .select("*, brands!brand_id(name), categories!category_id(name)")
        .eq("id", version.recommended_product_id)
        .maybeSingle();
      if (pErr) throw new RouteError(500, pErr.message);
      if (!product) throw new RouteError(404, "Recommended product not found");

      return { data: [transformProduct(product)], status: 200 };
    }

    throw new RouteError(400, "vehicleYearId or vehicleVersionId required");
  }

  // ═══════════════════════════════════════════════════════
  //  DELIVERY PRICES
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/delivery-prices") {
    const { data, error } = await supabase
      .from("delivery_prices")
      .select("id, wilaya_code, wilaya_name, price, domicile_price")
      .order("wilaya_code");
    if (error) throw new RouteError(500, error.message);

    const result = (data || []).map((d: any) => ({
      id: d.id,
      wilayaCode: d.wilaya_code,
      wilayaName: d.wilaya_name,
      price: Number(d.price),
      domicilePrice: Number(d.domicile_price),
    }));
    return { data: result, status: 200 };
  }

  if (method === "PUT" && path === "/api/delivery-prices") {
    // Upsert all delivery prices
    const rows = (body.prices || []).map((p: any) => ({
      wilaya_code: p.wilayaCode,
      price: p.price,
      domicile_price: p.domicilePrice,
    }));

    for (const row of rows) {
      await supabase
        .from("delivery_prices")
        .update({ price: row.price, domicile_price: row.domicile_price })
        .eq("wilaya_code", row.wilaya_code);
    }

    // Return updated list
    const { data, error } = await supabase
      .from("delivery_prices")
      .select("id, wilaya_code, wilaya_name, price, domicile_price")
      .order("wilaya_code");
    if (error) throw new RouteError(500, error.message);

    const result = (data || []).map((d: any) => ({
      id: d.id,
      wilayaCode: d.wilaya_code,
      wilayaName: d.wilaya_name,
      price: Number(d.price),
      domicilePrice: Number(d.domicile_price),
    }));
    return { data: result, status: 200 };
  }

  if (method === "GET" && (m = match(path, "/api/delivery-prices/:wilayaCode"))) {
    const { data, error } = await supabase
      .from("delivery_prices")
      .select("id, wilaya_code, wilaya_name, price, domicile_price")
      .eq("wilaya_code", m.wilayaCode)
      .maybeSingle();
    if (error) throw new RouteError(500, error.message);
    if (!data) throw new RouteError(404, "Wilaya not found");
    return {
      data: {
        id: data.id,
        wilayaCode: data.wilaya_code,
        wilayaName: data.wilaya_name,
        price: Number(data.price),
        domicilePrice: Number(data.domicile_price),
      },
      status: 200,
    };
  }

  // ═══════════════════════════════════════════════════════
  //  B2B MESSAGES
  // ═══════════════════════════════════════════════════════

  // Create (public form) — uses SECURITY DEFINER RPC to bypass grants/RLS
  if (method === "POST" && path === "/api/b2b-messages") {
    const { data, error } = await supabase.rpc("create_b2b_message", {
      p_company: body.company,
      p_phone: body.phone,
      p_email: body.email,
      p_message: body.message,
    });
    if (error) throw new RouteError(500, error.message);
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 201 };
  }

  // List (admin)
  if (method === "GET" && path === "/api/b2b-messages") {
    const page = parseInt(q.page || "1");
    const limit = parseInt(q.limit || "20");

    const { data, error } = await supabase.rpc("list_b2b_messages_admin", {
      p_is_read: q.isRead !== undefined ? q.isRead === "true" : null,
      p_search: q.search || null,
      p_page: page,
      p_limit: limit,
    });
    if (error) throw new RouteError(500, error.message);
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  // Unread count (admin)
  if (method === "GET" && path === "/api/b2b-messages/unread-count") {
    const { data, error } = await supabase.rpc("get_b2b_unread_count");
    if (error) throw new RouteError(500, error.message);
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  // Update (admin – mark read/unread)
  if (method === "PATCH" && (m = match(path, "/api/b2b-messages/:id"))) {
    const { data, error } = await supabase.rpc("update_b2b_message_admin", {
      p_id: Number(m.id),
      p_is_read: body.isRead ?? null,
    });
    if (error) {
      if (error.message?.includes("not found")) throw new RouteError(404, "B2B message not found");
      throw new RouteError(500, error.message);
    }
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  // Delete (admin)
  if (method === "DELETE" && (m = match(path, "/api/b2b-messages/:id"))) {
    const { error } = await supabase.rpc("delete_b2b_message_admin", {
      p_id: Number(m.id),
    });
    if (error) throw new RouteError(500, error.message);
    return { data: null, status: 204 };
  }

  // ═══════════════════════════════════════════════════════
  //  PAGE VIEWS / ANALYTICS
  // ═══════════════════════════════════════════════════════

  if (method === "GET" && path === "/api/page-views/stats") {
    const { data, error } = await supabase.rpc("get_visit_stats");
    if (error) throw new RouteError(500, error.message);
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  if (method === "GET" && path === "/api/page-views/funnel") {
    const { data, error } = await supabase.rpc("get_funnel_stats");
    if (error) throw new RouteError(500, error.message);
    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { data: result, status: 200 };
  }

  // ═══════════════════════════════════════════════════════
  //  FALLBACK
  // ═══════════════════════════════════════════════════════
  throw new RouteError(404, `Route not found: ${method} ${path}`);
}

