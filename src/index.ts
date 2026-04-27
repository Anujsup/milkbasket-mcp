#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { requestOtp, verifyOtp, getAuthStatus, logout } from "./auth/auth.service.js";
import {
  getUserDetails,
  getWalletBalance,
  getBasket,
  getExtendedBasket,
  getHeroCollections,
  listProducts,
  searchProducts,
  addToCart,
  removeFromCart,
} from "./products/products.service.js";
import { AuthRequiredError } from "./graphql/client.js";

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "milkbasket-mcp",
  version: "1.0.0",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authErrorResponse() {
  return {
    content: [
      {
        type: "text" as const,
        text: "Not authenticated. Please call auth_request_otp with your phone number, then auth_verify_otp with the OTP you receive.",
      },
    ],
  };
}

function errorResponse(err: unknown) {
  if (err instanceof AuthRequiredError) return authErrorResponse();
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
  };
}

function jsonResponse(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

// ─── Auth tools ───────────────────────────────────────────────────────────────

server.registerTool(
  "auth_request_otp",
  {
    description:
      "Request a one-time password (OTP) to be sent to the given phone number. Call this first to initiate login.",
    inputSchema: {
      phone: z
        .string()
        .min(10)
        .max(15)
        .describe("Mobile phone number (10 digits for India, e.g. 9876543210)"),
    },
  },
  async ({ phone }) => {
    try {
      const result = await requestOtp(phone);
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "auth_verify_otp",
  {
    description:
      "Verify the OTP received on the phone number to complete login. Tokens are stored securely in the OS keychain.",
    inputSchema: {
      phone: z
        .string()
        .min(10)
        .max(15)
        .describe("The same phone number used in auth_request_otp"),
      otp: z.string().min(4).max(8).describe("The OTP received via SMS"),
    },
  },
  async ({ phone, otp }) => {
    try {
      const result = await verifyOtp(phone, otp);
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "auth_status",
  {
    description: "Check whether the current session is authenticated and when it expires.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await getAuthStatus();
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "auth_logout",
  {
    description: "Clear the stored access and refresh tokens, effectively logging out.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await logout();
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

// ─── User tools ───────────────────────────────────────────────────────────────

server.registerTool(
  "get_user_details",
  {
    description:
      "Fetch the logged-in user's profile (name, email, address, delivery info) and wallet balance. Requires authentication.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await getUserDetails();
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "get_wallet_balance",
  {
    description:
      "Fetch the logged-in user's wallet balance including main credits, food credits, and cashback credits. Requires authentication.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await getWalletBalance();
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "get_basket",
  {
    description:
      "Fetch a lightweight snapshot of the current cart — product IDs, quantities, unit prices, and a basic bill summary (subtotal, total, savings). " +
      "Use this tool when you need a quick cart check: verifying if a product is in the cart, getting the item count, or getting the basic total without full product details. " +
      "For the full checkout view with product names, images, discounts, delivery fee, GST, and final payable amount — use get_extended_basket instead. " +
      "Requires authentication.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await getBasket();
      if (!result) return jsonResponse({ message: "Your basket is empty.", products: [] });
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "get_extended_basket",
  {
    description:
      "Fetch the full basket (cart) with COMPLETE product details including product names, weights, images, MRP, selling price, discount percentage, and an EXTENDED bill breakdown that includes delivery fee, GST, membership charges, cashback used, and final payable amount. " +
      "Use this tool when you need to: show the user a detailed view of their cart (checkout screen), display product names or discount info for items in the cart, or show the complete bill breakdown including delivery fee and final payable amount. " +
      "Use get_basket instead when you only need a quick/lightweight cart check (e.g. verifying if a product is in the cart, getting item count, or getting the basic total). " +
      "Requires authentication.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await getExtendedBasket();
      if (!result) return jsonResponse({ message: "Your basket is empty.", products: [] });
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

// ─── Product / catalog tools ──────────────────────────────────────────────────

server.registerTool(
  "get_hero_collections",
  {
    description:
      "Fetch the homepage hero collections. Each collection has a listId that can be passed to list_products to browse its products.",
    inputSchema: {},
  },
  async () => {
    try {
      const collections = await getHeroCollections();
      const summarized = collections.map((c) => ({
        id: c.id,
        name: c.name,
        title: c.title,
        subtitle: c.subtitle,
        listId: c.listId,
        leafId: c.leafId,
        target: c.target,
        hasChildren: c.hasChildren,
        order: c.order,
      }));
      return jsonResponse({ total: summarized.length, collections: summarized });
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "list_products",
  {
    description:
      "List products from a specific collection by its listId (obtained from get_hero_collections). Supports pagination and in-stock filtering. Requires authentication.",
    inputSchema: {
      listId: z
        .string()
        .min(1)
        .describe("The listId of the collection to browse, obtained from get_hero_collections"),
      page: z.number().int().min(1).optional().default(1).describe("Page number (default: 1)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(20)
        .describe("Number of products per page (default: 20, max: 50)"),
      showInStockOnly: z
        .boolean()
        .optional()
        .default(false)
        .describe("If true, only return in-stock products (default: false)"),
    },
  },
  async ({ listId, page, limit, showInStockOnly }) => {
    try {
      const result = await listProducts({ listId, page, limit, showInStockOnly });
      return jsonResponse({
        pagination: result.pages,
        products: result.products.map(formatProductDossier),
      });
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "search_products",
  {
    description:
      "Search for products by name or keyword across the Milkbasket catalog. Supports pagination. Requires authentication.",
    inputSchema: {
      searchText: z.string().min(1).describe("The search query, e.g. 'milk', 'lassi', 'bread'"),
      page: z.number().int().min(1).optional().default(1).describe("Page number (default: 1)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(20)
        .describe("Number of results per page (default: 20, max: 50)"),
    },
  },
  async ({ searchText, page, limit }) => {
    try {
      const result = await searchProducts({ searchText, page, limit });
      return jsonResponse({
        pagination: result.pages,
        searchSuggestion: result.searchSuggestionKeyword,
        products: result.products.map(formatProductDossier),
      });
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "add_to_cart",
  {
    description:
      "Add a NEW product to the basket or INCREASE the quantity of an existing product. " +
      "Use this only when the quantity is going UP (e.g. adding a product for the first time, or bumping qty from 2 to 3). " +
      "To DECREASE quantity or DELETE a product from the cart, use remove_from_cart instead. " +
      "Requires authentication. Get productId and price from search_products or list_products.",
    inputSchema: {
      productId: z
        .number()
        .int()
        .describe("The product ID obtained from search_products or list_products"),
      price: z
        .number()
        .describe("The selling price of the product (the 'selling' field from search results)"),
      quantity: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe("Target quantity to set (must be >= 1). Default: 1"),
      date: z
        .string()
        .optional()
        .describe("Delivery date in YYYY-MM-DD format. Defaults to tomorrow if not provided."),
    },
  },
  async ({ productId, price, quantity, date }) => {
    try {
      const result = await addToCart({ productId, price, quantity, date });
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

server.registerTool(
  "remove_from_cart",
  {
    description:
      "DECREASE the quantity of a product in the basket or DELETE it entirely. " +
      "Use this when the quantity is going DOWN (e.g. reducing from 3 to 2, or removing a product). " +
      "Set quantity=0 to completely remove the product from the cart. " +
      "To ADD a new product or INCREASE quantity, use add_to_cart instead. " +
      "Requires authentication. Get productId and price from get_basket or get_extended_basket.",
    inputSchema: {
      productId: z
        .number()
        .int()
        .describe("The product ID to decrease or remove"),
      price: z
        .number()
        .describe("The selling price of the product"),
      quantity: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("New target quantity. Use 0 to completely remove the product. Default: 0"),
      date: z
        .string()
        .optional()
        .describe("Delivery date in YYYY-MM-DD format. Defaults to tomorrow if not provided."),
    },
  },
  async ({ productId, price, quantity, date }) => {
    try {
      const result = await removeFromCart({ productId, price, quantity, date });
      return jsonResponse(result);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

// ─── Product formatter ────────────────────────────────────────────────────────

function formatProductDossier(dossier: ReturnType<typeof Object.create>) {
  const p = dossier.product;
  if (!p) return dossier;

  return {
    id: p.id,
    name: p.name,
    weight: p.weight?.text ?? null,
    category: p.category
      ? `${p.category.name}${p.category.subCategory ? ` > ${p.category.subCategory.name}` : ""}`
      : null,
    price: p.price
      ? {
          currency: p.price.currency,
          mrp: p.price.mrp?.amount ?? null,
          selling: p.price.price?.amount ?? null,
          mbeyond: p.price.mbeyond?.amount ?? null,
          discount: p.price.discount ? `${p.price.discount.percent}% off` : null,
        }
      : null,
    availability: p.availability
      ? {
          inStock: !p.availability.isOos && !p.availability.oos,
          maxQuantity: p.availability.maxQuantity,
          orderCutOff: p.availability.cutOff?.text ?? null,
        }
      : null,
    image: p.assets?.image?.url ?? null,
    offers: p.offers ? `${p.offers.count} ${p.offers.label}` : null,
    variants: dossier.variant?.products?.length
      ? dossier.variant.products.map((v: ReturnType<typeof Object.create>) => ({
          id: v.id,
          name: v.name,
          weight: v.weight?.text ?? null,
          price: v.price?.price?.amount ?? null,
          inStock: v.availability ? !v.availability.isOos : null,
        }))
      : null,
  };
}

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("Milkbasket MCP server started (STDIO)\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
