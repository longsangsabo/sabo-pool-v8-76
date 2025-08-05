# Ranking System Testing Checklist

## Automated Tests ✅

Access the test suite at `/admin/test-ranking` (admin only)

### Test Coverage:
- [x] Tournament point calculation and distribution
- [x] Challenge daily limits (30% reduction after 2nd challenge)
- [x] Rank promotion trigger (1000+ SPA points)
- [x] Season reset functionality
- [x] Real-time notifications

---

## Manual Testing Checklist 📋

### 🏆 Tournament Flow
- [ ] **Create Tournament (Admin)**
  - Go to `/admin/tournaments`
  - Create new tournament with 8 slots
  - Set tournament type (season = 1.5x multiplier)
  
- [ ] **Player Registration**
  - Register 8 players of different ranks (K to E+)
  - Verify registration emails/notifications sent
  - Check participant count updates correctly
  
- [ ] **Tournament Completion**
  - Set final positions for all players
  - Complete tournament status
  - **Expected Results:**
    - Champion (1st): Base points × 1.5 (for season tournament)
    - Runner-up (2nd): 70% of champion points × 1.5
    - 3rd place: 50% of champion points × 1.5
    - Participation: 20% of champion points × 1.5
    - Top 4 get rank points: 1st=+1.0, 2nd=+0.5, 3rd=+0.25, 4th=+0.125

- [ ] **Verification Steps:**
  - Check SPA points awarded match calculation table
  - Verify rank points only given to top 4
  - Confirm notifications sent to all participants
  - Check ranking history updated

### ⚔️ Challenge Flow
- [ ] **Challenge Creation**
  - Player A challenges Player B
  - Set wager points: 50, 100, 150, or 200
  - Verify challenge notification sent
  
- [ ] **Challenge Response**
  - Player B accepts/rejects challenge
  - Verify response notification sent to challenger
  - Check challenge expires after 48 hours if no response
  
- [ ] **Match Completion (Daily Limits)**
  - **1st Challenge of Day:**
    - Winner gets 100% of wager points
    - Loser loses 50% of wager points
    - Verify full points awarded
  
  - **2nd Challenge of Day:**
    - Winner gets 100% of wager points
    - Verify full points awarded
  
  - **3rd+ Challenge of Day:**
    - Winner gets 30% of wager points only
    - Verify reduction applied
    - Check warning banner displayed
  
- [ ] **Rank Difference Bonus**
  - Lower rank player beats higher rank (+2 levels)
  - Verify 25% bonus applied to winner points
  - Example: K rank beats I+ rank = 125% points

### 📈 Rank Promotion Flow
- [ ] **Setup Player at 950 SPA**
  - Use admin tools to set player SPA points to 950
  - Verify current rank displayed correctly
  
- [ ] **Trigger Promotion**
  - Player completes tournament/challenge for 100+ points
  - **Expected Result:**
    - Auto-promotion to next rank (K → K+)
    - SPA points reduced by 1000 (promotion cost)
    - Promotion notification sent
    - Ranking history entry created
    - Profile badge updated
  
- [ ] **Verification Steps:**
  - Check new rank badge displays correctly
  - Verify remaining SPA points = (total - 1000)
  - Confirm promotion notification received
  - Check ranking history shows promotion
  - Verify club notification (if player is verified by club)

### 🔄 Season Reset (Quarterly)
- [ ] **Pre-Reset State**
  - Note current top 10 players' rank points
  - Record current SPA point leaders
  - Check active season start date
  
- [ ] **Execute Reset (Admin Only)**
  - Go to `/admin/season-management`
  - Click "Reset Season" button
  - Confirm action in dialog
  
- [ ] **Post-Reset Verification:**
  - All players' rank points = 0
  - Current ranks preserved (no rank changes)
  - Season start date updated to today
  - Ranking history archived with previous season data
  - All players receive season reset notification
  - SPA points remain unchanged (only rank points reset)

---

## 📱 UI/UX Testing

### Performance Tests
- [ ] **Page Load Times**
  - Ranking dashboard loads < 2 seconds
  - Leaderboard loads < 3 seconds with 100+ players
  - Challenge list loads < 1 second
  
- [ ] **Real-time Updates**
  - Points update immediately after match completion
  - Notifications appear within 5 seconds
  - Leaderboard updates without page refresh
  
### Responsive Design
- [ ] **Mobile (375px width)**
  - Ranking cards stack properly
  - Challenge modal fits screen
  - Progress bars display correctly
  - Navigation remains accessible
  
- [ ] **Tablet (768px width)**
  - Two-column layout works
  - Touch targets are 44px minimum
  - Modals centered properly
  
- [ ] **Desktop (1024px+ width)**
  - Three-column layout optimal
  - Hover states work correctly
  - Keyboard navigation functional

### Accessibility
- [ ] **Screen Reader Support**
  - Rank badges have proper alt text
  - Progress bars announce percentage
  - Modals have proper focus management
  
- [ ] **Keyboard Navigation**
  - Tab order logical
  - All buttons reachable
  - Escape closes modals
  
- [ ] **Color Contrast**
  - Rank badges readable
  - Error states clearly visible
  - Success notifications accessible

---

## 🚨 Edge Cases & Error Handling

### Data Integrity
- [ ] **Concurrent Matches**
  - Player completes 2 challenges simultaneously
  - Verify daily count calculated correctly
  - No double-point awards
  
- [ ] **Network Failures**
  - Complete match while offline
  - Verify retry mechanism works
  - Check data consistency after reconnect
  
- [ ] **Invalid Data**
  - Negative point values handled gracefully
  - Missing player ranks don't crash system
  - Tournament with 0 participants handled
  
### Security Tests
- [ ] **Unauthorized Access**
  - Non-admin cannot access test suite
  - Players cannot modify other's points
  - Challenge results require participant auth
  
- [ ] **SQL Injection Prevention**
  - Player names with special characters
  - Tournament names with quotes/semicolons
  - All inputs properly sanitized

---

## 📊 Monitoring & Analytics

### Key Metrics to Track
- [ ] **Tournament Participation**
  - Registration completion rate > 80%
  - Average participants per tournament
  - Tournament completion time
  
- [ ] **Challenge Activity**
  - Daily active challenge users
  - Challenge acceptance rate
  - Average challenges per player per day
  
- [ ] **Rank Progression**
  - Players promoted per month
  - Average time to promotion
  - Distribution across rank levels
  
- [ ] **System Performance**
  - Database query response times
  - Notification delivery rates
  - API error rates < 1%

---

## ✅ Test Pass Criteria

### Automated Tests: All Green ✅
- Tournament points calculation: PASS
- Challenge daily limits: PASS  
- Rank promotion: PASS
- Season reset: PASS

### Manual Tests: Critical Path ✅
- Tournament end-to-end flow complete
- Challenge with daily limits working
- Rank promotion triggered correctly
- Season reset preserves data integrity

### Performance: Acceptable Thresholds ✅
- Page loads < 3 seconds
- Real-time updates < 5 seconds
- Mobile responsive design working
- No memory leaks during extended use

---

## 📞 Support Information

**Issues or Questions?**
- Check console logs for detailed errors
- Use browser dev tools network tab
- Review Supabase function logs
- Test with different user accounts

**Emergency Rollback Plan:**
- Restore from daily database backup
- Revert SPA point changes via admin panel
- Manually adjust incorrect rankings
- Re-run season reset if needed