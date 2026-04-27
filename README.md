# milkbasket-mcp

An MCP (Model Context Protocol) server for the [Milkbasket](https://www.milkbasket.com/) grocery API. Lets you authenticate, search products, manage your cart, and check your wallet balance — all from any MCP client like [Cursor](https://cursor.com/) or Claude Desktop.

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

## Example usage in Cursor

```
Search for Amul milk products
→ search_products({ query: "amul milk" })

Add 2 units to cart
→ add_to_cart({ productId: 1234, price: 28, quantity: 2 })

View full cart with bill breakdown
→ get_extended_basket()

Remove the product
→ remove_from_cart({ productId: 1234, price: 28, quantity: 0 })
```

## License

MIT © [Anujsup](https://github.com/Anujsup)
