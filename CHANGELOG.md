# Changelog

All notable changes to `@anujsup/milkbasket-mcp` are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.3] — 2026-04-28

### Added
- `get_flash_deals` tool: fetch today's Mega Flash Deal products without needing to look up a listId (defaults to collection `157975`).
- `get_flash_deal_status` tool: fetch deal metadata (eligibility, basket progress, timing, status label) for a Mega Flash Deal.
- `add_flash_deal_to_cart` tool: add a Mega Flash Deal product to cart for free using the correct `flashDealId` and `type: 6` payload fields.

### Changed
- `add_to_cart` description updated to redirect to `add_flash_deal_to_cart` for flash deal items.
- `get_flash_deals` description updated to guide AI to use `add_flash_deal_to_cart` automatically.
- `add_flash_deal_to_cart` description instructs AI to attempt add directly and only call `get_flash_deal_status` on failure.

---

## [1.0.2] — 2026-04-27

### Added
- Scoped package name `@anujsup/milkbasket-mcp` replacing the previous unscoped name.
- Comprehensive `README.md` with badges, tool table, natural-language query examples, and a Security & Privacy section.
- GitHub repository topics for improved discoverability.
- Extended npm `keywords` list for better search indexing.
- `prepublishOnly` and `typecheck` scripts in `package.json`.

### Changed
- Package renamed from `milkbasket-mcp` to `@anujsup/milkbasket-mcp` for clear ownership.
- `README.md` description and examples expanded to cover all ten tools.

---

## [1.0.1] — 2026-04-26

### Added
- `remove_from_cart` tool: decrease quantity or fully remove an item using `removeFromBasket` mutation with `bypassTimeCheck: true`.
- `get_extended_basket` tool: detailed basket view with full item list, quantities, prices, and bill breakdown.
- Security reassurance messages in `auth_request_otp` and `auth_verify_otp` tool descriptions.

### Changed
- `add_to_cart` description clarified — for adding/increasing only.
- `get_basket` description updated to distinguish it from the new extended view.
- `repository.url` in `package.json` corrected to `git+https://` format.

### Fixed
- Null-safety guard on `basket.billDetails` when the last item is removed (`?? "₹0.00"`).

---

## [1.0.0] — 2026-04-25

### Added
- Initial release.
- OTP-based authentication (`auth_request_otp`, `auth_verify_otp`, `auth_logout`, `auth_status`).
- User tools: `get_user_details`, `get_wallet_balance`.
- Product tools: `list_products`, `search_products`, `get_hero_collections`.
- Cart tools: `add_to_cart`, `get_basket`.
- Cross-platform secure token storage via `keytar` with AES-256-GCM encrypted file fallback.
- Dynamic GraphQL headers including `Authorization`, `cityId`, `hubId`, `appVersion`, and `role`.
- Modular source layout: `config`, `graphql`, `auth`, `products`.
- STDIO transport compatible with Cursor, Claude Desktop, and any MCP client.

[Unreleased]: https://github.com/Anujsup/milkbasket-mcp/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/Anujsup/milkbasket-mcp/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Anujsup/milkbasket-mcp/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Anujsup/milkbasket-mcp/releases/tag/v1.0.0
