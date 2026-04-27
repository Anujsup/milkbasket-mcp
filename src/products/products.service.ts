import { gqlRequest } from "../graphql/client.js";
import {
  FETCH_USER_DETAILS_QUERY,
  FETCH_USER_BALANCE_QUERY,
  FETCH_BASKET_QUERY,
  GET_EXTENDED_BASKET_QUERY,
  GET_HERO_COLLECTION_QUERY,
  GET_MEGA_FLASH_DEAL_QUERY,
  GET_MEGA_FLASH_DEAL_PRODUCTS_QUERY,
  GET_SEARCH_PRODUCTS_QUERY,
  ADD_TO_BASKET_MUTATION,
  REMOVE_FROM_BASKET_MUTATION,
} from "../graphql/queries.js";
import { getTokenMeta } from "../auth/token.store.js";
import { APP_VERSION } from "../config/constants.js";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PageInfo {
  limit: number;
  page: number;
  hasNextPage: boolean;
  records: number;
  pages: number;
}

export interface ProductPrice {
  currency: string;
  mrp: { amount: string; value: number } | null;
  price: { amount: string; value: number } | null;
  mbeyond: { amount: string; value: number } | null;
  discount: {
    amount: string;
    value: number;
    percent: number;
    text: string;
    displayValue: string;
  } | null;
}

export interface Product {
  id: number;
  name: string;
  type: number;
  kind: number;
  weight: { text: string; value: number | null; unit: string | null } | null;
  price: ProductPrice;
  availability: {
    isOos: boolean;
    oos: boolean;
    maxQuantity: number;
    cutOff: { text: string } | null;
  };
  assets: { image: { url: string; type: number } | null } | null;
  category: {
    id: number;
    name: string;
    subCategory: {
      id: number;
      name: string;
      type: string;
    } | null;
  } | null;
  offers: { count: number; label: string } | null;
}

export interface ProductDossier {
  product: Product;
  variant: {
    id: number;
    active: boolean;
    products: Pick<Product, "id" | "name" | "weight" | "price" | "availability">[];
  } | null;
}

// ─── User details ─────────────────────────────────────────────────────────────

interface UserDetailsResponse {
  getUserDetails: {
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      paid: boolean;
      walletFreeze: boolean;
      firstOrderDate: string | null;
      referralCode: string;
      deliveryStartDate: string | null;
      accountStatus: number;
      address: {
        cityId: string;
        cityName: string;
        hubId: string;
        line1: string;
        line2: string;
        fullAddress: string;
        status: number;
      } | null;
    };
  };
}

interface UserBalanceResponse {
  getUserBalance: {
    value: string;
    amount: number;
    valueType: string;
    badge: string;
    wallet: {
      foodCredits: string;
      mainCredits: string;
      cashbackCredits: string;
    };
  };
}

export async function getWalletBalance() {
  const data = await gqlRequest<UserBalanceResponse>(
    FETCH_USER_BALANCE_QUERY,
    {},
    { operationName: "fetchUserBalance", requiresAuth: true }
  );
  return data.getUserBalance;
}

export async function getUserDetails() {
  const [detailsData, balanceData] = await Promise.all([
    gqlRequest<UserDetailsResponse>(
      FETCH_USER_DETAILS_QUERY,
      {},
      { operationName: "fetchUserDetails", requiresAuth: true }
    ),
    gqlRequest<UserBalanceResponse>(
      FETCH_USER_BALANCE_QUERY,
      {},
      { operationName: "fetchUserBalance", requiresAuth: true }
    ),
  ]);

  return {
    user: detailsData.getUserDetails.user,
    balance: balanceData.getUserBalance,
  };
}

// ─── Basket ───────────────────────────────────────────────────────────────────

interface BasketResponse {
  getPrunedBasket: {
    id: string;
    date: string;
    quantity: number;
    isOtdf: boolean;
    products: Array<{
      id: number;
      type: number;
      price: {
        currency: string;
        price: { amount: string; value: number };
      };
      order: { productId: number; quantity: number };
      assets: { image: { url: string } | null } | null;
    }>;
    billDetails: {
      total: string;
      totalAmount: number;
      subTotal: string;
      subTotalAmount: number;
      subSavings: string;
      subSavingsAmount: number;
      cashbackUsed: string;
      cashbackUsedAmount: number;
      productDiscount: { label: string; amount: string } | null;
      coupon: { name: string; label: string; amount: string } | null;
      offerDiscount: { label: string; amount: string } | null;
    } | null;
  } | null;
}

export async function getBasket() {
  const data = await gqlRequest<BasketResponse>(
    FETCH_BASKET_QUERY,
    {},
    { operationName: "fetchBasket", requiresAuth: true }
  );
  return data.getPrunedBasket;
}

// ─── Extended basket ──────────────────────────────────────────────────────────

interface ExtendedBasketProduct {
  id: number;
  name: string;
  type: number;
  kind: number;
  weight: { text: string; value: number | null; unit: string | null } | null;
  price: {
    currency: string;
    perUnit: string | null;
    discount: { amount: string; value: number; percent: number; displayValue: string } | null;
    mrp: { amount: string; value: number } | null;
    price: { amount: string; value: number } | null;
    mbeyond: { amount: string; value: number } | null;
  };
  availability: {
    isOos: boolean;
    oos: boolean;
    maxQuantity: number | null;
    cutOff: { time: string; text: string } | null;
  } | null;
  assets: { image: { url: string; type: number } | null } | null;
  category: {
    id: number;
    name: string | null;
    subCategory: { id: number; name: string; type: string } | null;
  } | null;
  order: { productId: number; quantity: number } | null;
}

interface ExtendedBasketResponse {
  getExtendedBasket: {
    basket: {
      id: number;
      date: string;
      quantity: number;
      saving: string;
      taxes: string;
      total: string;
      data: Array<{
        key: string;
        title: string;
        type: number;
        data: Array<{ product: ExtendedBasketProduct }>;
      }>;
      billDetails: {
        subSavings: string;
        subSavingsAmount: number;
        subTotal: string;
        subTotalAmount: number;
        total: string;
        totalAmount: number;
        deliveryFee: string | null;
        deliveryFeeAmount: number | null;
        gst: string | null;
        gstAmount: number | null;
        membershipCharged: string | null;
        membershipChargedAmount: number | null;
        cashbackUsed: string | null;
        cashbackUsedAmount: number | null;
        payable: string | null;
        payableAmount: number | null;
        coupon: { name: string; label: string; amount: number } | null;
        productDiscount: { label: string; amount: number } | null;
        offerDiscount: { label: string; amount: number } | null;
      } | null;
    } | null;
  };
}

export async function getExtendedBasket() {
  const data = await gqlRequest<ExtendedBasketResponse>(
    GET_EXTENDED_BASKET_QUERY,
    {},
    { operationName: "getExtendedBasket", requiresAuth: true }
  );

  const basket = data.getExtendedBasket.basket;
  if (!basket) return null;

  // Flatten grouped product sections into a single list
  const products: Array<{
    id: number;
    name: string;
    weight: string | null;
    quantity: number;
    price: { currency: string; mrp: string | null; selling: string | null; discount: string | null };
    image: string | null;
    inStock: boolean;
  }> = [];

  for (const group of basket.data) {
    for (const item of group.data) {
      const p = item.product;
      products.push({
        id: p.id,
        name: p.name,
        weight: p.weight?.text ?? null,
        quantity: p.order?.quantity ?? 0,
        price: {
          currency: p.price.currency,
          mrp: p.price.mrp?.amount ?? null,
          selling: p.price.price?.amount ?? null,
          discount: p.price.discount?.percent
            ? `${p.price.discount.percent}% off`
            : null,
        },
        image: p.assets?.image?.url ?? null,
        inStock: p.availability ? !p.availability.isOos && !p.availability.oos : true,
      });
    }
  }

  const bill = basket.billDetails;

  return {
    id: basket.id,
    date: basket.date,
    totalItems: basket.quantity,
    saving: basket.saving,
    taxes: basket.taxes,
    total: basket.total,
    products,
    bill: bill
      ? {
          subTotal: bill.subTotal,
          subSavings: bill.subSavings,
          total: bill.total,
          deliveryFee: bill.deliveryFee ?? "0.00",
          gst: bill.gst ?? null,
          membershipCharged: bill.membershipCharged ?? null,
          cashbackUsed: bill.cashbackUsed ?? null,
          payable: bill.payable ?? bill.total,
          coupon: bill.coupon?.amount ? bill.coupon : null,
          productDiscount: bill.productDiscount?.amount ? bill.productDiscount : null,
        }
      : null,
  };
}

// ─── Hero collections ─────────────────────────────────────────────────────────

interface HeroCollectionResponse {
  getHeroCollection: {
    collection: Array<{
      id: string;
      name: string;
      title: string;
      subtitle: string | null;
      position: number;
      order: number;
      showViewAll: boolean;
      badge: number;
      leafId: string | null;
      listId: string | null;
      adhoc: boolean;
      target: string | null;
      hasChildren: boolean;
      expires: string | null;
      design: {
        displayType: string;
        bgColor: string | null;
        template: string | null;
      } | null;
    }>;
  };
}

export async function getHeroCollections() {
  const data = await gqlRequest<HeroCollectionResponse>(
    GET_HERO_COLLECTION_QUERY,
    { appVersion: APP_VERSION, inviteCode: null },
    { operationName: "getHeroCollection", requiresAuth: true }
  );
  return data.getHeroCollection.collection;
}

// ─── Flash deal status ────────────────────────────────────────────────────────

interface MegaFlashDeal {
  id: number;
  title: string;
  description: string;
  maxQtyLabel: string;
  movLabel: string;
  dealStatusLabel: string;
  availedQuantity: number;
  subtitleValues: Array<{ key: string; value: string }>;
  status: number;
  serverCurrentTime: string;
  startTime: string;
  endTime: string;
  mov: number;
  maxQty: number;
  listId: number;
  isMovReached: boolean;
  basketValue: number;
  percentage: number;
  headerImage: string | null;
  backgroundImage: string | null;
}

export async function getFlashDealStatus(id: number) {
  const data = await gqlRequest<{ getMegaFlashDeal: MegaFlashDeal }>(
    GET_MEGA_FLASH_DEAL_QUERY,
    { id },
    { operationName: "getMegaFlashDeal", requiresAuth: true }
  );
  return data.getMegaFlashDeal;
}

// ─── List products by listId ──────────────────────────────────────────────────

interface ProductListResponse {
  getMegaFlashDealProducts: {
    products: ProductDossier[];
    config: {
      layout: string;
      design: {
        rows: number;
        showAvailability: boolean;
        showDiscount: boolean;
      } | null;
    };
    pages: PageInfo;
  };
}

export async function listProducts(params: {
  listId: string;
  page?: number;
  limit?: number;
  showInStockOnly?: boolean;
}) {
  const data = await gqlRequest<ProductListResponse>(
    GET_MEGA_FLASH_DEAL_PRODUCTS_QUERY,
    {
      listId: params.listId,
      showInStockOnly: params.showInStockOnly ?? false,
      page: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    },
    { operationName: "getMegaFlashDealProducts", requiresAuth: true }
  );
  return data.getMegaFlashDealProducts;
}

// ─── Search products ──────────────────────────────────────────────────────────

interface SearchProductsResponse {
  getSearchProducts: {
    products: ProductDossier[];
    config: {
      layout: string;
      design: { rows: number; showDiscount: boolean } | null;
    };
    pages: PageInfo;
    usePrevResults: boolean;
    searchSuggestionKeyword: string | null;
    attributionToken: string | null;
    correlationId: string | null;
  };
}

export async function searchProducts(params: {
  searchText: string;
  page?: number;
  limit?: number;
}) {
  const meta = await getTokenMeta();
  const cityId = meta ? Number(meta.cityId) : 54;

  const data = await gqlRequest<SearchProductsResponse>(
    GET_SEARCH_PRODUCTS_QUERY,
    {
      searchPayload: {
        searchText: params.searchText,
        experimentId: 1,
        suggestedSearchText: "",
      },
      cityId,
      page: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    },
    { operationName: "getSearchProducts", requiresAuth: true }
  );
  return data.getSearchProducts;
}

// ─── Add to cart ──────────────────────────────────────────────────────────────

interface AddToBasketResponse {
  addToBasket: {
    appliedOffers: Array<{
      id: string;
      benefitType: string;
      cashbackAmount: number;
      offerType: string;
      productName: string;
      isNewUserOffer: boolean;
    }> | null;
    removedOffers: Array<{
      id: string;
      productName: string;
    }> | null;
    isMembershipApplied: boolean;
    isRefreshBasket: boolean;
    isCouponRemoved: boolean | null;
    flashDealsRemoved: boolean | null;
    error: {
      error: string;
      errorMsg: string;
      nextOrderDate: string | null;
      parentProductId: number | null;
    } | null;
    basket: {
      id: number;
      date: string;
      quantity: number;
      saving: string;
      total: string;
      products: Array<{
        id: number;
        name: string;
        weight: { text: string } | null;
        price: {
          currency: string;
          mrp: { amount: string; value: number } | null;
          price: { amount: string; value: number } | null;
          discount: { percent: number; displayValue: string } | null;
        };
        order: { productId: number; quantity: number };
        assets: { image: { url: string } | null } | null;
      }>;
      billDetails: {
        subSavings: string;
        subTotal: string;
        total: string;
        subSavingsAmount: number;
        subTotalAmount: number;
        totalAmount: number;
      };
    } | null;
  };
}

/** Returns tomorrow's date as YYYY-MM-DD in local time. */
function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function addToCart(params: {
  productId: number;
  price: number;
  quantity: number;
  date?: string;
}) {
  const deliveryDate = params.date ?? getTomorrowDate();

  const data = await gqlRequest<AddToBasketResponse>(
    ADD_TO_BASKET_MUTATION,
    {
      payload: {
        productId: params.productId,
        quantity: params.quantity,
        price: params.price,
        date: deliveryDate,
        bypassTimeCheck: false,
        appVersion: APP_VERSION,
        offerIds: [],
        fetchOffers: true,
        params: {},
      },
    },
    { operationName: "addToBasket", requiresAuth: true }
  );

  const result = data.addToBasket;

  if (result.error) {
    return {
      success: false,
      error: result.error.errorMsg || result.error.error,
      nextOrderDate: result.error.nextOrderDate,
    };
  }

  const basket = result.basket;

  return {
    success: true,
    action: params.quantity === 0 ? "removed" : "added",
    deliveryDate,
    basket: basket
      ? {
          id: basket.id,
          date: basket.date,
          totalItems: basket.quantity,
          total: basket.billDetails?.total ?? "₹0.00",
          savings: basket.billDetails?.subSavings ?? "₹0.00",
          products: basket.products.map((p) => ({
            id: p.id,
            name: p.name,
            weight: p.weight?.text ?? null,
            quantity: p.order.quantity,
            price: p.price.price?.amount ?? null,
            image: p.assets?.image?.url ?? null,
          })),
        }
      : null,
    appliedOffers: result.appliedOffers?.map((o) => o.productName) ?? [],
    isMembershipApplied: result.isMembershipApplied,
  };
}

export async function addFlashDealToCart(params: {
  productId: number;
  flashDealId: number;
  date?: string;
}) {
  const deliveryDate = params.date ?? getTomorrowDate();

  const data = await gqlRequest<AddToBasketResponse>(
    ADD_TO_BASKET_MUTATION,
    {
      payload: {
        productId: params.productId,
        quantity: 1,
        price: 0,
        date: deliveryDate,
        bypassTimeCheck: false,
        appVersion: APP_VERSION,
        offerIds: [],
        fetchOffers: true,
        params: { flashDealId: params.flashDealId },
        type: 6,
      },
    },
    { operationName: "addToBasket", requiresAuth: true }
  );

  const result = data.addToBasket;

  if (result.error) {
    return {
      success: false,
      error: result.error.errorMsg || result.error.error,
      nextOrderDate: result.error.nextOrderDate,
    };
  }

  const basket = result.basket;

  return {
    success: true,
    action: "flash_deal_added",
    deliveryDate,
    basket: basket
      ? {
          id: basket.id,
          date: basket.date,
          totalItems: basket.quantity,
          total: basket.billDetails?.total ?? "₹0.00",
          savings: basket.billDetails?.subSavings ?? "₹0.00",
          products: basket.products.map((p) => ({
            id: p.id,
            name: p.name,
            weight: p.weight?.text ?? null,
            quantity: p.order.quantity,
            price: p.price.price?.amount ?? null,
            image: p.assets?.image?.url ?? null,
          })),
        }
      : null,
    appliedOffers: result.appliedOffers?.map((o) => o.productName) ?? [],
    isMembershipApplied: result.isMembershipApplied,
  };
}

export async function removeFromCart(params: {
  productId: number;
  price: number;
  quantity: number;
  date?: string;
}) {
  const deliveryDate = params.date ?? getTomorrowDate();

  const data = await gqlRequest<{ removeFromBasket: AddToBasketResponse["addToBasket"] }>(
    REMOVE_FROM_BASKET_MUTATION,
    {
      payload: {
        productId: params.productId,
        quantity: params.quantity,
        price: params.price,
        date: deliveryDate,
        bypassTimeCheck: true,
        appVersion: APP_VERSION,
        offerIds: [],
        fetchOffers: true,
      },
    },
    { operationName: "removeFromBasket", requiresAuth: true }
  );

  const result = data.removeFromBasket;

  if (result.error) {
    return {
      success: false,
      error: result.error.errorMsg || result.error.error,
      nextOrderDate: result.error.nextOrderDate,
    };
  }

  const basket = result.basket;

  return {
    success: true,
    action: params.quantity === 0 ? "removed" : "decreased",
    deliveryDate,
    basket: basket
      ? {
          id: basket.id,
          date: basket.date,
          totalItems: basket.quantity,
          total: basket.billDetails?.total ?? "₹0.00",
          savings: basket.billDetails?.subSavings ?? "₹0.00",
          products: basket.products.map((p) => ({
            id: p.id,
            name: p.name,
            weight: p.weight?.text ?? null,
            quantity: p.order.quantity,
            price: p.price.price?.amount ?? null,
            image: p.assets?.image?.url ?? null,
          })),
        }
      : null,
    appliedOffers: result.appliedOffers?.map((o) => o.productName) ?? [],
    isMembershipApplied: result.isMembershipApplied,
  };
}
