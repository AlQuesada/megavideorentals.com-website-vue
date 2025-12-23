---
name: Movie Review Feature
overview: Add a movie review system with member authentication using Supabase. Users can optionally leave reviews when adding movies to cart, and reviews are submitted to the backend when they checkout. Includes 80s-themed member card system with login/signup flow.
todos:
  - id: git-branch
    content: Create feature/movie-reviews branch and install @supabase/supabase-js
    status: completed
  - id: supabase-schema
    content: Create supabase/schema.sql with tables, functions, and RLS policies
    status: completed
  - id: env-config
    content: Add Supabase config to src/config/env.ts
    status: completed
  - id: types
    content: Create src/types/member.ts with Member, CartReview, CartItem interfaces
    status: completed
  - id: supabase-client
    content: Create src/services/supabaseClient.ts
    status: completed
  - id: rental-service
    content: Create src/services/rentalService.ts for submitting rentals
    status: completed
  - id: auth-composable
    content: Create src/composables/useAuth.ts with login/signup/logout
    status: completed
  - id: cart-composable
    content: Modify src/composables/useCart.ts to support reviews
    status: completed
  - id: review-modal
    content: Create src/components/ReviewModal.vue
    status: completed
  - id: login-modal
    content: Create src/components/MemberLoginModal.vue
    status: completed
  - id: update-vhscard
    content: Update VhsCard.vue to emit add-to-cart-request
    status: completed
  - id: update-moviemodal
    content: Update MovieModal.vue to emit add-to-cart-request
    status: completed
  - id: update-cartsidebar
    content: Update CartSidebar.vue to show review indicators
    status: completed
  - id: update-header
    content: Update AppHeader.vue to show member card when logged in
    status: completed
  - id: update-checkout
    content: Update CheckoutModal.vue to show member info
    status: completed
  - id: integrate-app
    content: Update App.vue with new modal flow and auth integration
    status: completed
---

# Movie Review Feature with Supabase Integration

## Architecture Overview

```mermaid
flowchart TD
    subgraph frontend [Frontend - Vue 3]
        VhsCard[VhsCard.vue]
        MovieModal[MovieModal.vue]
        ReviewModal[ReviewModal.vue]
        MemberLogin[MemberLoginModal.vue]
        CartSidebar[CartSidebar.vue]
        AppHeader[AppHeader.vue]
        useCart[useCart.ts]
        useAuth[useAuth.ts]
    end
    
    subgraph backend [Supabase Backend]
        Members[(members table)]
        Reviews[(reviews table)]
        Rentals[(rentals table)]
        RPCs[RPC Functions]
    end
    
    VhsCard -->|"Add to Cart click"| ReviewModal
    MovieModal -->|"Add to Cart click"| ReviewModal
    ReviewModal -->|"stores review"| useCart
    CartSidebar -->|"Rent Now click"| MemberLogin
    MemberLogin -->|"authenticate"| useAuth
    useAuth -->|"login/signup"| RPCs
    CartSidebar -->|"submit rentals"| RPCs
    RPCs --> Members
    RPCs --> Reviews
    RPCs --> Rentals
    AppHeader -->|"displays"| useAuth
```



## Phase 1: Git Setup and Dependencies

### Step 1.1: Create feature branch

Create a new local branch `feature/movie-reviews` from current HEAD.

### Step 1.2: Install Supabase client

Add `@supabase/supabase-js` to dependencies in [package.json](package.json).

### Step 1.3: Add environment variables

Update [src/config/env.ts](src/config/env.ts) to include Supabase configuration alongside existing TMDB config.---

## Phase 2: Supabase Database Setup (Manual)

You will need to run the following SQL in your Supabase SQL Editor. This creates:

- `members` table with auto-generated member numbers (MV-198X-XXXX format)
- `reviews` table for movie reviews (1-5 stars, 500 char text)
- `rentals` table for rental history
- RPC functions for signup, login, and rental submission
- Row Level Security policies

I will provide the complete SQL script as a new file `supabase/schema.sql` for reference.---

## Phase 3: New Type Definitions

### Step 3.1: Create member types

New file `src/types/member.ts` defining:

- `Member` interface (id, memberNumber, name, memberSince)
- `CartReview` interface (rating, text)
- `CartItem` interface (movie + optional review)

---

## Phase 4: Supabase Service Layer

### Step 4.1: Create Supabase client

New file `src/services/supabaseClient.ts` - initializes Supabase client with env vars.

### Step 4.2: Create rental service

New file `src/services/rentalService.ts` - handles submitting rentals and reviews to Supabase.---

## Phase 5: Composables

### Step 5.1: Create auth composable

New file `src/composables/useAuth.ts` with:

- `signup(name, pin)` - creates new member, returns member card number
- `login(memberNumber, pin)` - authenticates existing member
- `logout()` - clears session
- `restoreSession()` - restores from localStorage
- Reactive state: `currentMember`, `isLoggedIn`, `memberNumber`, `memberName`

### Step 5.2: Modify cart composable

Update [src/composables/useCart.ts](src/composables/useCart.ts) to:

- Store `CartItem` objects (movie + optional review) instead of just movies
- Add `updateReview(movieId, review)` method
- Add `getReview(movieId)` method
- Maintain backward compatibility with `movies` computed property

---

## Phase 6: New Components

### Step 6.1: Create ReviewModal component

New file `src/components/ReviewModal.vue`:

- Shows movie poster and title
- 5-star rating selector with hover effects
- Optional 500-character review text area
- "Skip" and "Add to Cart" buttons
- Emits review data or null on submit

### Step 6.2: Create MemberLoginModal component

New file `src/components/MemberLoginModal.vue`:

- Toggle between login and signup modes
- Login: member number + 4-digit PIN
- Signup: name + 4-digit PIN (with confirmation)
- Error handling and loading states
- 80s-themed styling matching existing modals

---

## Phase 7: Component Modifications

### Step 7.1: Update VhsCard

Modify [src/components/VhsCard.vue](src/components/VhsCard.vue):

- Emit event to trigger ReviewModal instead of directly adding to cart
- Change `handleCartClick` to emit `'add-to-cart-request'` event

### Step 7.2: Update MovieModal

Modify [src/components/MovieModal.vue](src/components/MovieModal.vue):

- Same change - emit event to trigger ReviewModal

### Step 7.3: Update CartSidebar

Modify [src/components/CartSidebar.vue](src/components/CartSidebar.vue):

- Display review indicator (star rating) next to cart items that have reviews
- Pass through to checkout flow

### Step 7.4: Update AppHeader

Modify [src/components/AppHeader.vue](src/components/AppHeader.vue):

- Show member card number when logged in
- Add logout button

### Step 7.5: Update CheckoutModal

Modify [src/components/CheckoutModal.vue](src/components/CheckoutModal.vue):

- Display member card number on receipt
- Show count of reviews submitted

---

## Phase 8: Main App Integration

### Step 8.1: Update App.vue

Modify [src/App.vue](src/App.vue):

- Import and manage ReviewModal state
- Import and manage MemberLoginModal state
- Add `useAuth` composable with session restoration on mount
- Handle new cart flow:

1. VhsCard/MovieModal emits add-to-cart-request
2. Show ReviewModal
3. On review submit, add to cart with optional review

- Handle checkout flow:

1. User clicks "Rent Now"
2. If not logged in, show MemberLoginModal
3. On login success, submit rentals to Supabase
4. Show CheckoutModal success

---