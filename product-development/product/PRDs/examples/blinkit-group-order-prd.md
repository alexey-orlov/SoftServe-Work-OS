# Group Order Feature for Blinkit

**Stage:** Solution Review
**Last Updated:** January 7, 2026
**Owner:** Product Team
**Status:** Draft

---

## Hypothesis

Indian households often coordinate grocery shopping among family members, roommates, or neighbors, leading to multiple small orders or missed items. Currently, Blinkit users must either share their phone to add items or place separate orders, resulting in coordination friction, duplicate delivery fees, and inefficient cart management.

**If we** implement a real-time collaborative group ordering feature where multiple people can simultaneously add items to a shared cart,
**then** we'll see a 25-30% increase in average order value (AOV) and 15% higher order frequency among active users,
**because** 68% of quick commerce orders in India are household purchases where 2+ family members have input on what to buy, and removing coordination friction will unlock natural group buying behavior.

**Supporting Evidence:**
- User research: "My wife sends me a list on WhatsApp, but by the time I add everything, she remembers 3 more things and I have to edit the cart again. So annoying!" - 40+ similar complaints in support tickets
- Analytics: 23% of Blinkit orders under ₹500 are followed by another order from the same address within 2 hours (suggesting missed items)
- Market data: DoorDash and Uber Eats saw 35% AOV lift after launching group ordering for restaurants
- Competitive gap: Zepto, Swiggy Instamart, and BigBasket don't have group ordering (first-mover advantage)
- Voice of Customer: Group ordering was #3 requested feature in Q4 2025 user survey (behind dark mode and scheduled delivery)

---

## Strategic Fit

**Why this? Why now?**

This directly supports Blinkit's Q1 2026 goal of increasing AOV from ₹620 to ₹750+ while maintaining 10-minute delivery promise. As we expand to 2,000+ dark stores and compete with Zepto's aggressive growth (21% market share), we need product differentiation beyond speed.

Group ordering creates a moat: it builds social habits around Blinkit ("let's share a Blinkit cart") and increases switching costs (families/roommates coordinate on one platform).

**Impact Sizing:**
- Users affected: ~8-10 million users (estimated 60% of 15M monthly active users live in multi-person households)
- Revenue impact:
  - AOV increase: ₹620 → ₹780 (25% lift) = ₹160 per order
  - 8M users × 4 orders/month × ₹160 uplift = ₹512 crore additional GMV per month
  - Estimated ₹6,144 crore annual GMV impact
- Strategic value: **CRITICAL** - Creates network effects and social lock-in

**Alternatives Considered:**
- **Scheduled "family cart" feature** - Not doing because real-time collaboration is the key unlock; async carts don't solve the coordination pain
- **Bill splitting only** - Not doing because payment splitting alone doesn't help with cart coordination; people want to add items together
- **WhatsApp bot integration** - Not doing in v1; adds complexity and WhatsApp has rate limits; native app experience is faster

---

## Non-Goals

What we are explicitly NOT doing in v1:
- **Corporate/office ordering** - Focusing on households first; B2B can come in v2 (different use case, needs admin controls)
- **Cross-address group orders** - All participants must deliver to same address in v1; splitting deliveries adds 3x complexity
- **Voice-based cart collaboration** - Text/tap only; voice adds AI complexity and Hindi/regional language challenges
- **Item recommendations based on group members** - v1 is feature parity; personalization comes later
- **Group chat within the order** - Not building a messenger; users can use WhatsApp for discussion

**Trade-offs Made:**
- **Simplicity over flexibility** - One host controls checkout, not democratic voting (avoids decision paralysis)
- **Speed over features** - Real-time sync is harder than async, but it's the core value prop
- **Mobile-first only** - Desktop/web can come later; 97% of Blinkit orders are on mobile

---

## Success Metrics

**Primary Metric:** Average Order Value (AOV) for orders with 2+ participants
- Current baseline: ₹620 (overall platform AOV)
- Target: ₹780+ (25% lift)
- Timeline: Measure 60 days post-launch

**Secondary Metrics:**
- Group order adoption rate: 18% of all orders use group ordering within 90 days
- Repeat group order usage: 55% of users who try group ordering use it again within 30 days
- Items per order: Increase from avg 12 items to 16+ items for group orders
- Order completion rate: No degradation (<2% drop) despite added complexity

**Guardrail Metrics:** (Must not harm)
- Delivery time: Must stay <12 minutes avg (can't let group coordination slow down checkout)
- Cart abandonment: <5% increase (real-time sync must be smooth, not buggy)
- App crashes: 0 increase in crash rate related to real-time features
- Customer support tickets: <3% increase in order-related issues

**Kill Criteria:**
If group orders have <10% adoption after 60 days OR cause >8% increase in cart abandonment OR cause delivery time to exceed 13 minutes avg, we will pause rollout, analyze friction points, and either iterate or deprioritize.

---

## Rollout Plan

**Approach:** Phased Rollout with A/B Test

**Phase 1: Internal Beta (Week 1-2)**
- Blinkit employees + 500 power users in Gurgaon/Delhi dark store zones
- Passing criteria:
  - Zero critical bugs affecting checkout
  - <500ms latency for real-time cart sync
  - >70% positive feedback on usability
  - At least 40% of beta users try the feature

**Phase 2: A/B Test in Delhi NCR (Week 3-5)**
- 20% of Delhi NCR users get group ordering feature
- Passing criteria:
  - AOV lift >15% for group orders
  - Adoption rate >12%
  - No increase in delivery time
  - No increase in payment failures
  - Positive NPS delta (+5 points)

**Phase 3: Expand to Top 6 Metros (Week 6-8)**
- Mumbai, Bangalore, Hyderabad, Chennai, Pune, Kolkata
- 50% rollout in each city
- Monitor dark store operational metrics (can stores handle larger orders?)

**Phase 4: National Launch (Week 9+)**
- 100% rollout across all 153 cities
- In-app announcement, social media campaign, influencer partnerships
- Monitor GMV, AOV, retention closely

**Rollback Plan:**
If critical bugs emerge or delivery metrics degrade:
- Disable feature flag within 30 minutes (no app update needed)
- Preserve user data (group order history) for when we re-enable
- Communicate to users: "Group ordering temporarily unavailable, working on improvements"

---

## Behavior Examples

| Scenario | User Action | Expected Behavior | Notes |
|----------|-------------|-------------------|-------|
| **Create group order** | User taps "Start Group Order" button on cart screen | App generates unique shareable link + QR code valid for 60 minutes | Link format: `blinkit.com/group/ABC123` |
| **Join group order** | Friend scans QR code or clicks link | Opens Blinkit app, shows shared cart with live updates | If app not installed, redirects to app store first |
| **Add items simultaneously** | Host adds milk, guest adds bread at same time | Both items appear in cart within 1 second, no conflicts | WebSocket-based real-time sync |
| **Remove item someone else added** | Host removes bread that guest added | Bread disappears from cart for both users immediately | No permissions needed; anyone can edit anything |
| **Host leaves before checkout** | Host exits app or loses connection | Group order stays active; other participants can continue adding items | Host can rejoin via same link |
| **Checkout control** | Guest tries to proceed to checkout | See "Waiting for [Host Name] to checkout" message | Only host can initiate payment to avoid confusion |
| **Payment split** | After host pays, participants see order confirmation | Optional prompt: "Split ₹850 order with 3 people? Request ₹283 each via UPI" | Integration with Google Pay/PhonePe for split requests |
| **Timeout scenario** | No activity for 60 minutes | Group order link expires, cart saved to host's account only | Push notification: "Your group order expired, items saved to your cart" |
| **Different item variants** | Guest adds "Amul Milk 1L", host already has "Amul Milk 500ml" | Both variants appear separately in cart (not merged) | Clear labeling: "Added by [Name]" |
| **Out of stock during collab** | Item goes out of stock while 3 people are shopping | Real-time notification to all: "Maggi 12-pack now unavailable" + remove from cart | Prevents checkout failures |

**Reference Examples:**
- [Uber Eats group ordering](https://www.uber.com/us/en/deliver/group-orders/) - Good flow for inviting participants
- [DoorDash group orders](https://help.doordash.com/consumers/s/article/How-do-I-place-a-group-order) - Clean host/guest model
- Google Docs real-time collaboration - Gold standard for multi-user sync UX

---

## Open Questions

- [ ] Should we allow participants to "lock" items they added so others can't remove them? - @Design Team
- [ ] What's the max number of simultaneous participants? (Suggest: 8 people max) - @Engineering
- [ ] Do we show everyone's individual cart subtotal or just the combined total? - @UX Research
- [ ] Should host be able to remove participants from the group order? - @Product
- [ ] Do we need notifications when someone adds an expensive item (₹500+)? - @Design Team
- [ ] How do we handle promo codes when splitting payment? (Host's promo applies to full order) - @Business
- [ ] Should there be a "suggested items" section based on group members' past orders? - @Data Science
- [ ] Do we pre-announce this feature to build hype or surprise launch? - @Marketing

---

## Technical Approach

**High-Level Architecture:**

1. **Real-Time Sync:** WebSocket connection (Socket.io) for sub-second cart updates
2. **Link Generation:** Short-lived JWT tokens embedded in shareable links (60-min expiry)
3. **Conflict Resolution:** Last-write-wins with optimistic UI updates + server reconciliation
4. **State Management:** Redis for active group cart state (TTL: 60 min), PostgreSQL for order history
5. **Mobile:** React Native shared state using Redux + WebSocket hooks
6. **Scalability:** Horizontal scaling of WebSocket servers behind load balancer

**Key Technical Decisions:**
- WebSocket vs. Polling: WebSocket for real-time (polling would be 2-5 sec delay, bad UX)
- Session Management: Sticky sessions on WebSocket server to maintain connection state
- Offline Handling: Queue local changes, sync when reconnected
- Data Model: `group_orders` table with `participants` JSONB array

**API Endpoints (New):**
- `POST /api/v2/group-orders/create` - Create group order session
- `GET /api/v2/group-orders/:id/join` - Join existing group order
- `WS /api/v2/group-orders/:id/sync` - WebSocket for real-time cart sync
- `POST /api/v2/group-orders/:id/checkout` - Host initiates checkout

**Third-Party Integrations:**
- Google Pay / PhonePe APIs for payment split requests
- Firebase Cloud Messaging for push notifications when items added/removed

**Engineering Effort Estimate:** 6-8 weeks (3 engineers)
- Week 1-2: Backend infrastructure (WebSocket, Redis, APIs)
- Week 3-4: Mobile app UI/UX + real-time sync logic
- Week 5-6: Payment splitting, edge cases, error handling
- Week 7-8: Testing (load testing, edge cases), beta launch prep

---

## Design Considerations

**Entry Points:**
1. **Cart Screen:** Prominent "Start Group Order" button above cart items (primary CTA)
2. **Home Screen:** "Shop Together" promotional banner (first 2 weeks post-launch)
3. **Order History:** "Reorder as Group" option on past orders

**Visual Design:**
- Each cart item tagged with participant avatar (small circular photo)
- Live participant list at top of cart: "Shopping with: [Avatar] [Avatar] [Avatar]"
- Subtle animation when items are added by others (fade-in + highlight)
- Color coding: Host = Blue border, Guests = Gray border (subtle differentiation)

**Copywriting:**
- Primary CTA: "Start Group Order" (not "Share Cart" - more action-oriented)
- Invite message: "Join my Blinkit order! Add what you need: [link]"
- Empty state: "Waiting for others to add items..." (friendly, not dead)

**Accessibility:**
- Screen reader support for real-time updates: "Rohan added Amul Butter"
- High contrast mode for participant avatars
- Haptic feedback when items added by others

---

## Go-to-Market Plan

**Pre-Launch (2 weeks before):**
- Teaser campaign on Instagram/Twitter: "Shopping just got social 🛒"
- Influencer partnerships: Family/lifestyle influencers demo the feature
- PR outreach: Economic Times, YourStory, Inc42 (quick commerce innovation angle)

**Launch Day:**
- In-app modal for existing users: "Introducing Group Orders"
- Push notification: "Shop together with family. Try Group Orders!"
- Social media: Launch video showing family/roommates using feature
- Blog post: "How Blinkit's Group Ordering Makes Grocery Shopping Easier"

**Post-Launch (Week 1-4):**
- Onboarding tooltip: First-time cart users see "Shop with family" prompt
- Email campaign to power users highlighting feature
- Success stories: Share user testimonials ("saved us 3 orders a week!")
- Referral incentive: "Start a group order, get ₹50 off if 3+ people join"

**Customer Education:**
- 15-second tutorial video in app
- Help center article: "How to use Group Orders"
- WhatsApp support bot trained on group ordering FAQs

---

## Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Real-time sync bugs/lag** | Medium | High | Extensive load testing, graceful degradation to polling if WebSocket fails |
| **Users confused by collaborative editing** | Medium | Medium | Clear onboarding tutorial, participant avatars on each item |
| **Payment splitting disputes** | Low | Medium | Make split payment optional, not mandatory; host controls checkout |
| **Dark stores can't fulfill larger orders** | Medium | High | Monitor inventory levels, alert ops team if group orders deplete stock faster |
| **Abuse (strangers joining public links)** | Low | Low | Links expire in 60 min, host can end session anytime, analytics to detect abuse |
| **Increased checkout time hurts delivery SLA** | Medium | High | Set 60-min timeout, prompt host to checkout after 20 mins of inactivity |
| **App crashes from WebSocket memory leaks** | Low | High | Thorough memory profiling, crash monitoring, rollback plan ready |

---

## Dependencies

**Internal:**
- Engineering: 3 full-stack engineers + 1 mobile engineer (6-8 weeks)
- Design: 1 product designer (2 weeks for UI/UX)
- QA: 1 QA engineer (2 weeks for testing)
- Data Science: Analytics instrumentation (3 days)
- Ops: Dark store team alignment on larger orders (ongoing)

**External:**
- Google Pay / PhonePe: API access for payment split requests (2-week approval process)
- Firebase: Cloud Messaging for notifications (already integrated)
- AWS: Additional WebSocket server capacity (provision in Week 1)

**Blockers:**
- None currently; all dependencies manageable within timeline

---

## Success Criteria for Launch

**Week 4 Post-Launch (Go/No-Go for Phase 3):**
- ✅ Adoption: >12% of orders use group ordering
- ✅ AOV Lift: >15% for group orders vs. solo orders
- ✅ Retention: >50% of users who try it use again within 30 days
- ✅ Delivery Time: Stays <12 minutes avg
- ✅ NPS Impact: +5 points among group order users
- ✅ Tech Stability: <0.1% crash rate, <500ms sync latency

If 5/6 criteria met → Proceed to Phase 3
If <4/6 criteria met → Pause, iterate, retest

---

## Appendix

### User Research Quotes

"My husband and I both open Blinkit at the same time and then fight about who placed the order first. This is ridiculous." - Priya, 32, Mumbai

"I wish I could just send a cart link to my roommate and he adds his stuff. Right now I screenshot items and he WhatsApps me more screenshots. So inefficient." - Arjun, 25, Bangalore

"When my mom visits, she wants different items than what I usually buy. I have to hand her my phone and she takes forever scrolling. A shared cart would be perfect." - Neha, 28, Delhi

### Competitive Analysis

| Feature | Blinkit | Zepto | Swiggy Instamart | BigBasket | DoorDash (US) |
|---------|---------|-------|------------------|-----------|---------------|
| Group Ordering | ✅ (This PRD) | ❌ | ❌ | ❌ | ✅ |
| Real-time Sync | ✅ | - | - | - | ❌ (async) |
| Payment Splitting | ✅ | - | - | - | ❌ |
| Mobile-first | ✅ | ✅ | ✅ | ❌ (web-first) | ✅ |

**First-mover advantage:** No Indian quick commerce player has real-time collaborative ordering. This is a 6-12 month lead if we ship fast.

### Analytics Events to Track

**User Actions:**
- `group_order_created` (host initiates)
- `group_order_joined` (guest joins via link)
- `group_order_item_added` (who added, what item)
- `group_order_item_removed` (who removed, what item)
- `group_order_checkout_initiated` (host proceeds to payment)
- `group_order_payment_split_requested` (optional split)
- `group_order_completed` (successful order)
- `group_order_abandoned` (session expired or manually ended)

**Metrics to Monitor:**
- Time from group order creation to checkout (target: <20 minutes avg)
- Number of participants per group order (avg, max)
- Items added per participant (engagement metric)
- WebSocket latency (p50, p95, p99)
- Crash rate during group ordering sessions

### Rollback Procedure

**If critical bug detected:**
1. **Immediate:** Disable `group_ordering_enabled` feature flag via LaunchDarkly (takes effect in <2 min)
2. **Within 1 hour:** Investigate root cause, deploy hotfix to staging
3. **Within 4 hours:** Test hotfix, re-enable for 10% of users
4. **Within 24 hours:** Full re-enable if hotfix works, or communicate delay to users

**Data preservation:**
- All group order sessions saved to database (not lost on rollback)
- Users can resume as individual carts if group feature disabled

---

**Timeline Summary:**
- Weeks 1-2: Internal beta (500 users)
- Weeks 3-5: Delhi NCR A/B test (20% of users)
- Weeks 6-8: Top 6 metros (50% rollout)
- Week 9+: National launch (100%)

**Total time to full launch:** 9-10 weeks from dev start

---

## Approval & Sign-offs

**Stakeholders:**
- [ ] Product Lead - Strategic alignment
- [ ] Engineering Lead - Technical feasibility
- [ ] Design Lead - UX approval
- [ ] Operations Lead - Dark store readiness
- [ ] Data Science Lead - Metrics framework
- [ ] Marketing Lead - GTM plan

**Next Steps:**
1. Engineering to validate WebSocket infrastructure approach (by Week 1)
2. Design to create high-fidelity mockups (by Week 2)
3. Ops to analyze dark store inventory for larger orders (by Week 2)
4. Legal to review payment splitting compliance (by Week 3)
5. Schedule kickoff meeting with all stakeholders (next week)

---

*PRD Version 1.0 - Created using PM Operating System framework*
