# 🛍️ Shopify Checkout Upsell & Promotion Suite

[![Shopify UI Extensions](https://img.shields.io/badge/Shopify%20UI%20Extensions-2026.7-green.svg)](https://shopify.dev/docs/api/checkout-ui-extensions)
[![Preact](https://img.shields.io/badge/Preact-10.10.x-blue.svg)](https://preactjs.com/)
[![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Shopify%20Checkout%20Extensibility-orange.svg)](https://shopify.dev/docs/apps/checkout)

An enterprise-ready, high-converting suite of Shopify Checkout UI Extensions built with **Preact**, **Shopify Web Components**, and the **GraphQL Storefront API**. Engineered for Shopify Checkout Extensibility to boost Average Order Value (AOV) and conversion rates while seamlessly adapting across desktop and mobile devices.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Extensions Included](#-extensions-included)
  - [1. Checkout Upsell Offer](#1-checkout-upsell-offer)
  - [2. Responsive Image Banner](#2-responsive-image-banner)
  - [3. Announcement Banner](#3-announcement-banner)
  - [4. Admin App Dashboard](#4-admin-app-dashboard)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start & Local Development](#-quick-start--local-development)
- [Customizer Configuration Guide](#-customizer-configuration-guide)
- [Deployment](#-deployment)
- [Contributing & License](#-contributing--license)

---

## 🚀 Overview

Shopify's Checkout Extensibility replaces legacy `checkout.liquid` with secure, upgrade-safe Web Components running in sandboxed execution environments. 

This repository delivers an all-in-one checkout enhancement solution:
- **Intelligent Upselling:** Dynamic recommendations with real-time cart deduplication (never recommends products or variants already being purchased).
- **Art-Directed Media:** Device-specific promotional banners with container-query responsive switching (< 749px mobile, ≥ 750px desktop).
- **Checkout Notifications:** Urgent store announcements with rich tone treatments.
- **Merchant Controls:** 100% manageable through the native Shopify Theme / Checkout Editor without modifying code.

---

## 🧩 Extensions Included

### 1. Checkout Upsell Offer
*Path: `extensions/checkout-upsell-offer`*  
*Targets: `purchase.checkout.block.render`, `purchase.checkout.actions.render-before`, `purchase.thank-you.block.render`*

- **Smart Cart Deduplication:** Inspects product GIDs, numeric IDs, variant IDs, and titles against the customer's current checkout items. Any product or variant already present in the cart is automatically excluded from recommendations.
- **Strict In-Stock Filtering:** Guarantees out-of-stock items (`availableForSale: false`) are never recommended.
- **Automated Fallback Catalog:** If dynamic recommendations are exhausted by cart exclusions, seamlessly displays in-stock complementary items.
- **One-Click Cart Injection:** Leverages Shopify's `applyCartLinesChange` API to add selected items directly to the checkout with immediate order total recalculation.
- **Checkout Flow Lock:** Upon clicking "Add to order", the offer smoothly locks into a disabled *"Added to order"* confirmation state, preventing user distraction and duplicate additions.
- **Custom Product Override:** Merchants can configure a specific Product ID in the Checkout Customizer to promote high-priority merchandise.

### 2. Responsive Image Banner
*Path: `extensions/checkout-image-banner`*  
*Targets: `purchase.checkout.header.render-after`, `purchase.checkout.block.render`, `purchase.thank-you.block.render`*

- **Modular Dual-Component Design:** Divided into separate [`MobileBannerImage`](file:///extensions/checkout-image-banner/src/Checkout.jsx) and [`DesktopBannerImage`](file:///extensions/checkout-image-banner/src/Checkout.jsx) components for granular code control and maintenance.
- **749px Breakpoint Switching:** Utilizes native `<s-query-container>` container queries:
  - **Mobile (< 749px):** Shows the mobile-optimized vertical/wide banner image with full-width flexible sizing (`inlineSize="fill"`).
  - **Desktop (≥ 750px):** Shows the high-resolution desktop banner image.
- **Intelligent Fallback:** If no mobile image is uploaded by the merchant, the desktop banner renders seamlessly across all screen sizes.
- **Clickable Destinations:** Supports optional URL redirect wrapper via `<s-clickable>`.
- **Styling Controls:** Merchant-configurable corner roundness (`none`, `small`, `base`, `large`), aspect ratios (`3/1`, `2/1`, `16/9`, `1/1`), optional headline, and descriptive caption.

### 3. Announcement Banner
*Path: `extensions/checkout-banner-announcement`*  
*Targets: `purchase.checkout.header.render-after`, `purchase.checkout.block.render`*

- High-visibility promotional alerts (e.g., shipping deadlines, discount reminders).
- Semantic status tones: `info`, `warning`, `critical`, `success`.

### 4. Admin App Dashboard
*Path: `extensions/app-home` & `extensions/app-tools`*

- Shopify Admin embedded portal built with Preact and App Bridge for merchant analytics, extension configuration status, and health diagnostics.

---

## 🛠 Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Preact](https://preactjs.com/) (`v10.10.x`) | Lightweight Virtual DOM engine optimized for sandboxed checkout runtimes |
| **UI System** | `@shopify/ui-extensions` (`2026.7.x`) | Native Shopify Checkout custom elements (`<s-box>`, `<s-image>`, `<s-stack>`, `<s-query-container>`) |
| **State Management** | `@preact/signals` | Fine-grained reactivity bound to live `shopify.settings` and `shopify.lines` |
| **API Layer** | Storefront GraphQL API | Real-time product recommendations and variant querying |
| **Tooling** | Shopify CLI (`v3.x`), Vite, TypeScript | Modern compilation, tunneling, and extension lifecycle management |

---

## 📁 Repository Structure

```text
checkout-upsell/
├── extensions/
│   ├── checkout-upsell-offer/          # In-checkout product upsell extension
│   │   ├── src/
│   │   │   ├── Checkout.jsx            # Deduplication, GraphQL query, add-to-cart logic
│   │   │   └── locales/                # Internationalization strings (en, etc.)
│   │   └── shopify.extension.toml      # Extension targets, permissions & customizer fields
│   ├── checkout-image-banner/          # Art-directed responsive banner extension
│   │   ├── src/
│   │   │   ├── Checkout.jsx            # MobileBannerImage & DesktopBannerImage components
│   │   │   └── locales/
│   │   └── shopify.extension.toml      # Desktop/mobile URL settings & aspect ratio controls
│   ├── checkout-banner-announcement/   # Urgency & promotional notice banner
│   ├── app-home/                       # Admin embedded app home view
│   └── app-tools/                      # Diagnostic and administration tools
├── shared/                             # Shared utility models and types
├── shopify.app.toml                    # Root application manifest & capabilities
├── package.json                        # Workspaces & dependency declarations
└── README.md                           # Documentation & developer guide
```

---

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

1. **Node.js:** `v18.16.0` or higher ([Download Node.js](https://nodejs.org/))
2. **Package Manager:** `npm` (included with Node.js) or `pnpm`
3. **Shopify CLI:** Install globally or run via `npm`:
   ```bash
   npm install -g @shopify/cli@latest
   ```
4. **Shopify Partner Account & Development Store:** With Checkout Extensibility enabled (Shopify Plus or Development Store).

---

## 💻 Quick Start & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/AbhishekGautam0/checkout-upsells.git
cd checkout-upsells
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Connect to Your Shopify Development Store
Start the local development server:
```bash
npm run dev
```

During initialization, Shopify CLI will:
1. Prompt you to log in to your Shopify Partner account.
2. Select or create your Shopify App.
3. Automatically generate a secure Cloudflare tunnel to stream your local extension code into your development store's checkout.

### 4. Preview in Checkout Customizer
Press **`P`** in your terminal or follow the preview link provided by the CLI (e.g. `https://your-store.myshopify.com/admin/checkouts/settings`).
1. In the Shopify Checkout Editor, select **Add app block**.
2. Add **Checkout Upsell Offer** and **Checkout Image Banner** to your desired sections.
3. Use the top toolbar in the customizer to toggle between **Desktop** and **Mobile** view to test responsive behavior.

---

## ⚙️ Customizer Configuration Guide

Both extensions provide full merchant customization via the Shopify theme editor:

### Checkout Image Banner Settings
| Setting Key | Type | Description |
| :--- | :--- | :--- |
| `show_banner` | Boolean | Toggle display of the entire promotional banner |
| `desktop_image_url` | Text URL | Image URL for desktop viewports (≥ 750px) |
| `mobile_image_url` | Text URL | Image URL for mobile viewports (< 749px). Falls back to desktop image if left blank |
| `aspect_ratio` | Text | Proportional ratio: `3/1`, `2/1`, `16/9`, or `1/1` |
| `border_radius` | Text | Corner roundness style: `none`, `small`, `base`, or `large` |
| `link_url` | Text URL | Optional click destination redirect |
| `banner_title` | Text | Optional headline text rendered underneath banner |
| `banner_caption` | Multiline | Optional supporting promotional copy |

### Checkout Upsell Offer Settings
| Setting Key | Type | Description |
| :--- | :--- | :--- |
| `title` | Text | Offer section headline (e.g. *"Exclusive Offer For You"*) |
| `description` | Text | Promotional subtitle or urgency copy |
| `product_id` | Text GID | Optional direct product override (e.g. `gid://shopify/Product/1234567890`) |
| `button_text` | Text | Action button label (defaults to *"Add to order"*) |

---

## 🚢 Deployment

When you are ready to deploy your extensions to production:

```bash
# Build production bundles
npm run build

# Deploy extensions to your Shopify Partner App
npm run deploy
```

Once deployed, publish the app version in your **Shopify Partner Dashboard** under **Apps > [Your App] > Versions**.

---

## 🔒 Best Practices Implemented

- **Native Web Components:** Uses exclusively `<s-*>` custom elements; zero third-party DOM dependencies for maximum sandboxed performance.
- **Non-blocking Execution:** Lightweight Preact Virtual DOM ensures negligible checkout page load impact and optimal Core Web Vitals.
- **Safe Fallbacks:** Robust error boundaries prevent layout breaks in the event of missing metadata or network interruptions.

---

## 👨‍💻 Developer & Maintenance

Developed and maintained by **Abhishek Gautam**.  
Repository: [https://github.com/AbhishekGautam0/checkout-upsells.git](https://github.com/AbhishekGautam0/checkout-upsells.git)

For support, feature requests, or contributions, please open an issue or submit a pull request on GitHub.
