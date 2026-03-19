# Product Details User Flow Report (Mobile)

**Project:** MomBabyMilk Mobile App (React Native + Expo)  
**Date:** March 19, 2026  
**Document Purpose:** Mobile-specific analysis and implementation guide for Product Detail flow

---

## Table of Contents

1. [Overview](#overview)
2. [Current Mobile State](#current-mobile-state)
3. [Target User Journey (Mobile)](#target-user-journey-mobile)
4. [Frontend Architecture (Mobile)](#frontend-architecture-mobile)
5. [Backend/API Integration](#backendapi-integration)
6. [Data Structures](#data-structures)
7. [Integration Points](#integration-points)
8. [Error Handling](#error-handling)
9. [State Management](#state-management)
10. [Accessibility and UX](#accessibility-and-ux)
11. [Performance Considerations](#performance-considerations)
12. [Implementation Checklist](#implementation-checklist)

---

## Overview

The Product Detail flow on mobile should provide a full product decision experience:

- View full product information and image gallery
- See stock and pre-order status
- Select quantity and add to cart
- Read and submit product reviews/comments
- Handle loading, empty, and error states clearly

Unlike web, mobile does not use URL routes like `/product/:id`. It uses React Navigation params:

- `ProductsStack > ProductDetail`
- Route params example: `{ productId: string }`

---

## Current Mobile State

### What is already implemented

- Product listing screen with search/filter/pagination and add-to-cart
- Product cards with stock/pre-order badges
- API methods for product detail and comments
- CartContext with persistence
- AuthContext with SecureStore token handling
- Real Product Detail screen with gallery, tabs, add-to-cart, and reviews CRUD
- Product card tap navigation to ProductDetail via `productId`

### What is not implemented yet

- ProductDetail and navigation are implemented
- Next enhancement candidates: pagination for reviews and deeper accessibility semantics

This means mobile now supports an end-to-end detail/review flow from product discovery to cart/review actions.

---

## Target User Journey (Mobile)

### 1) Product Discovery -> Navigation

1. User opens Products tab.
2. User taps product card.
3. App navigates to `ProductDetail` with `productId`.

### 2) Initial Detail Load

1. ProductDetail screen mounts.
2. `useEffect` triggers `productApi.getById(productId)`.
3. `loading=true` and activity indicator is shown.

### 3) Data Fetch + Render

1. If success: render product sections.
2. If 404: show not found message and back button.
3. If network/server error: show retry state.

### 4) Product Interaction

- Image gallery with selectable thumbnails
- Price block with optional sale price and discount
- Stock/pre-order status
- Quantity stepper with min/max validation
- Add to cart / pre-order action

### 5) Tabs on Mobile

- Description
- Usage Instructions
- Reviews

### 6) Review CRUD

- Authenticated user: create/edit/delete own review
- Guest user: see list + login prompt
- Refresh comments after each mutation

---

## Frontend Architecture (Mobile)

### Navigation

- Stack: `ProductsStackNavigator`
- Screens:
  - `ProductListing` (implemented)
  - `ProductDetail` (placeholder today)

### Recommended new screen

Create:

- `src/screens/Products/ProductDetailScreen.tsx`

### Suggested local state in ProductDetail

- `product: Product | null`
- `loading: boolean`
- `error: string | null`
- `selectedImage: number`
- `quantity: number`
- `activeTab: 'description' | 'usage' | 'reviews'`
- `comments: Comment[]`
- `commentsLoading: boolean`
- `newComment: { rating: number; content: string }`
- `submitting: boolean`
- `editingId: string | null`
- `editContent: { rating: number; content: string }`

### Key handlers

- `fetchProductDetail(productId)`
- `fetchComments(productId)`
- `handleAddToCart()`
- `handleSubmitComment()`
- `handleUpdateComment(commentId)`
- `handleDeleteComment(commentId)`

---

## Backend/API Integration

Mobile app already exposes these methods in API layer:

### Product

- `GET /api/product/:id` via `productApi.getById(id)`

### Comments

- `POST /api/product/:productId/comments`
- `PUT /api/product/:productId/comments/:commentId`
- `DELETE /api/product/:productId/comments/:commentId`

### Auth token behavior

- Access token stored in `expo-secure-store`
- Axios request interceptor auto-attaches `Authorization: Bearer <token>`
- Token refresh flow exists on `401/403`

---

## Data Structures

### Product (mobile typing)

Current mobile type includes:

- `_id`, `name`, `price`, `sale_price`
- `imageUrl`, `image_url`
- `quantity`, `expectedRestockDate`, `allowPreOrder`
- `brand`, `category`, `description`, `comments`

### Cart item (mobile)

Stored shape in cart context:

- `id`, `name`, `price`, `sale_price`
- `image_url`, `quantity`, `availableStock`
- Optional pre-order fields: `isPreOrder`, `preOrderType`, `paymentOption`, `releaseDate`

### Storage differences from web

- Web used `localStorage`
- Mobile uses:
  - `AsyncStorage` for cart
  - `SecureStore` for auth tokens/user

---

## Integration Points

### 1) ProductList -> ProductDetail

Required change:

- Replace log-only product press handler with navigation:
  - `navigation.navigate('ProductDetail', { productId: product._id })`

### 2) ProductDetail -> CartContext

- Call `addToCart()` from `useCart()`
- For out-of-stock + pre-order allowed, open pre-order modal path

### 3) ProductDetail -> AuthContext

- Gate review form by `isAuthenticated`
- Show login CTA when unauthenticated

### 4) ProductDetail -> Toast

- Success toast on add to cart / comment submit
- Error toast on failed mutation

---

## Error Handling

### Product load

- Loading indicator on first fetch
- Error view with retry action
- Not found state with navigation back

### Comment operations

- Validate non-empty content before submit
- Handle auth requirement with login prompt
- Show toast on API errors
- Keep inline form state consistent after failure

### Images

- Fallback image URI if primary image fails
- Graceful handling when image array is empty

---

## State Management

### Component state

ProductDetail should keep UI-centric state locally (`useState`) for:

- active tab
- selected image
- quantity
- form editing status

### Shared state

- Cart: `CartContext`
- Auth: `AuthContext`

### Persisted state

- Cart persisted to `AsyncStorage` key `mom_baby_cart`
- Auth tokens persisted in SecureStore (`accessToken`, `refreshToken`)

---

## Accessibility and UX

### Recommended mobile UX behavior

- Touch targets >= 44x44
- Add accessibility labels for icon-only actions
- Make quantity controls screen-reader friendly
- Announce loading and error states
- Keep add-to-cart fixed near bottom for one-handed use

### Suggested accessibility labels

- Product image selector buttons
- Add-to-cart button
- Review edit/delete actions
- Rating stars as accessible buttons with selected state

---

## Performance Considerations

### Current baseline

- Product list supports pagination and debounced search
- Product detail (future) will likely fetch one item by id

### Recommendations for ProductDetail

- Lazy-load non-critical tabs (usage/reviews) after description is ready
- Avoid re-fetching full product data for each review mutation if backend can return updated comments
- Memoize heavy sub-sections (image gallery, review list rows)
- Use `FlatList` for large review sets

---

## Implementation Checklist

1. Create `ProductDetailScreen.tsx` with full UI sections.
2. Wire `ProductsStack` to use real ProductDetail component.
3. Update ProductList `handleProductPress` to navigate with `productId`.
4. Implement product fetch + loading/error/not-found states.
5. Implement gallery, pricing, stock, quantity, add-to-cart.
6. Implement tabs: description, usage, reviews.
7. Implement review CRUD with auth gating and toast feedback.
8. Add accessibility labels and semantic actions.
9. Add manual QA scenarios (stock=0, pre-order, guest user, API failures).

---

## Mobile Flow Diagram

```text
User taps ProductCard
        |
        v
navigate('ProductDetail', { productId })
        |
        v
ProductDetail mount
        |
        v
GET /api/product/:id
   |           |
 success      error
   |           |
   v           v
Render UI    Error/Retry
   |
   +--> Add to Cart / Pre-order -> CartContext -> AsyncStorage
   |
   +--> Reviews tab
           |
      Authenticated?
        |       |
       yes      no
        |       |
  Create/Edit/Delete   Show login prompt
        |
        v
   Refresh comments
```

---

## Conclusion

The mobile codebase already has most building blocks for Product Detail (API, cart/auth integration, product list entry points). The missing piece is a full ProductDetail screen and navigation wiring. Once implemented, the mobile user flow can reach parity with the web flow while using mobile-native navigation, storage, and interaction patterns.
