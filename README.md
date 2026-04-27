# milkbasket-mcp

An MCP (Model Context Protocol) server for the [Milkbasket](https://www.milkbasket.com/) grocery API. Connect your AI assistant to your Milkbasket account and let it handle your daily groceries — log in with OTP, browse products, build your cart, check your wallet, and review your full order summary, all through natural language.

**What you can do with this:**
- Ask your AI to find products — "Search for low-fat milk under ₹50"
- Build and manage your cart — "Add 2 Amul butter, remove the lassi"
- Check your order before delivery — "Show me my cart with the full bill"
- Keep track of your wallet — "What's my Milkbasket balance?"
- Fetch account details — "What city and hub am I assigned to?"

## Prerequisites

- Node.js 18 or higher
- A Milkbasket account (Indian mobile number)
- An MCP client (Cursor, Claude Desktop, etc.)

## Installation

### Option 1: npx (recommended, no install needed)

```json
{
  "mcpServers": {
    "milkbasket": {
      "command": "npx",
      "args": ["-y", "milkbasket-mcp"]
    }
  }
}
```

### Option 2: Global install

```bash
npm install -g milkbasket-mcp
```

```json
{
  "mcpServers": {
    "milkbasket": {
      "command": "milkbasket-mcp"
    }
  }
}
```

### Option 3: Local install

```bash
npm install milkbasket-mcp
```

```json
{
  "mcpServers": {
    "milkbasket": {
      "command": "node",
      "args": ["node_modules/milkbasket-mcp/dist/index.js"]
    }
  }
}
```

## Cursor setup

Add the config to `.cursor/mcp.json` in your project root (project-level) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "milkbasket": {
      "command": "npx",
      "args": ["-y", "milkbasket-mcp"]
    }
  }
}
```

Reload Cursor after saving.

## Available Tools

### Authentication

| Tool | Description |
|---|---|
| `auth_request_otp` | Send OTP to your registered mobile number |
| `auth_verify_otp` | Verify OTP and log in |
| `auth_status` | Check if you are currently authenticated |
| `auth_logout` | Log out and clear stored tokens |

### User

| Tool | Description |
|---|---|
| `get_user_details` | Fetch your name, email, city, hub, and membership info |
| `get_wallet_balance` | Fetch your current Milkbasket wallet balance and cashback |

### Products

| Tool | Description |
|---|---|
| `list_products` | List featured/flash-deal products (paginated) |
| `search_products` | Search products by name or keyword (paginated) |
| `get_hero_collections` | Fetch hero banner collections shown on the home screen |

### Cart

| Tool | Description |
|---|---|
| `add_to_cart` | Add a new product or increase quantity in the cart |
| `remove_from_cart` | Decrease quantity or remove a product from the cart |
| `get_basket` | Lightweight cart snapshot — item count, product IDs, basic totals |
| `get_extended_basket` | Full cart view — product names, images, discounts, delivery fee, GST, final payable amount |

## Authentication Flow

```
1. auth_request_otp  →  { phone: "9XXXXXXXXX" }
2. Receive OTP via SMS
3. auth_verify_otp   →  { phone: "9XXXXXXXXX", otp: "XXXX" }
4. You are now logged in
```

Tokens are stored securely using the OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service via `keytar`). If `keytar` is unavailable, an AES-256-GCM encrypted file is used as fallback.

## Cart Flow

```
search_products  →  find productId and price
add_to_cart      →  { productId, price, quantity }
remove_from_cart →  { productId, price, quantity: 0 }  ← set 0 to delete
get_extended_basket  →  full checkout view
```

## What you can ask your AI

Once connected, just talk to your AI naturally:

| What you say | What happens |
|---|---|
| "Log me in to Milkbasket" | Sends OTP → verifies → stores token |
| "Search for paneer" | Calls `search_products` and returns matches |
| "Add 2 Amul Gold milk to my cart" | Calls `add_to_cart` with the right product |
| "Remove the lassi from my cart" | Calls `remove_from_cart` with quantity 0 |
| "Show me my cart with full bill" | Calls `get_extended_basket` with itemized bill |
| "What is my wallet balance?" | Calls `get_wallet_balance` |
| "What are my account details?" | Calls `get_user_details` — name, city, hub, membership |
| "What deals are on today?" | Calls `list_products` for flash deals |
| "Log me out" | Clears tokens from keychain |

## Example usage in Cursor

```
Search for Amul milk products
→ search_products({ query: "amul milk" })

Add 2 units to cart
→ add_to_cart({ productId: 1234, price: 28, quantity: 2 })

View full cart with bill breakdown (product names, discounts, delivery fee, GST, payable)
→ get_extended_basket()

Reduce quantity by 1
→ remove_from_cart({ productId: 1234, price: 28, quantity: 1 })

Remove product entirely
→ remove_from_cart({ productId: 1234, price: 28, quantity: 0 })

Check wallet balance
→ get_wallet_balance()

Get account info
→ get_user_details()
```

## License

MIT © [Anujsup](https://github.com/Anujsup)
