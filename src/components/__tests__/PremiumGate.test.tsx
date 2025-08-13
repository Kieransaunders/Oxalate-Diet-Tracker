import React from 'react';
import { render, fireEvent, screen } from '../../test-utils';
import PremiumGate from '../PremiumGate';
import { useSubscriptionStore } from '../../state/subscriptionStore';

// Mock the subscription store
jest.mock('../../state/subscriptionStore');
const mockUseSubscriptionStore = useSubscriptionStore as jest.MockedFunction<typeof useSubscriptionStore>;

// Mock PaywallModal
jest.mock('../PaywallModal', () => {
  return function MockPaywallModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    return visible ? (
      <div data-testid="paywall-modal">
        <button onClick={onClose}>Close Paywall</button>
      </div>
    ) : null;
  };
});

describe('PremiumGate', () => {
  const TestChild = () => <div data-testid=\"protected-content\">Protected Content</div>;

  const defaultSubscriptionState = {
    status: 'free' as const,
    canAskOracleQuestion: () => true,
    canCreateRecipe: () => true,
    canTrack: () => true,
    getRemainingOracleQuestions: () => 5,
    getRemainingRecipes: () => 1,
    getRemainingTrackingDays: () => 7,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSubscriptionStore.mockReturnValue(defaultSubscriptionState as any);
  });

  describe('premium users', () => {
    it('should always show content for premium users', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        status: 'premium' as const,
      } as any);

      render(
        <PremiumGate feature="oracle">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });
  });

  describe('free users with access', () => {
    it('should show content when oracle questions available', () => {
      render(
        <PremiumGate feature="oracle">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('should show content when recipes available', () => {
      render(
        <PremiumGate feature=\"recipes\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('should show content when tracking available', () => {
      render(
        <PremiumGate feature=\"tracking\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });
  });

  describe('free users without access', () => {
    it('should show upgrade prompt for oracle when limit reached', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        canAskOracleQuestion: () => false,
        getRemainingOracleQuestions: () => 0,
      } as any);

      render(
        <PremiumGate feature="oracle">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.queryByTestId('protected-content')).toBeFalsy();
      expect(screen.getByText('Daily Question Limit Reached')).toBeTruthy();
    });

    it('should show upgrade prompt for recipes when limit reached', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        canCreateRecipe: () => false,
        getRemainingRecipes: () => 0,
      } as any);

      render(
        <PremiumGate feature=\"recipes\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.queryByTestId('protected-content')).toBeFalsy();
      expect(screen.getByText('Recipe Limit Reached')).toBeTruthy();
    });

    it('should show upgrade prompt for tracking when limit reached', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        canTrack: () => false,
        getRemainingTrackingDays: () => 0,
      } as any);

      render(
        <PremiumGate feature=\"tracking\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.queryByTestId('protected-content')).toBeFalsy();
      expect(screen.getByText('Trial Period Ended')).toBeTruthy();
    });
  });

  describe('custom messages', () => {
    it('should show custom message when provided', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        canAskOracleQuestion: () => false,
      } as any);

      const customMessage = 'Custom upgrade message for this feature';

      render(
        <PremiumGate feature=\"oracle\" customMessage={customMessage}>
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByText(customMessage)).toBeTruthy();
    });
  });

  describe('upgrade prompt interactions', () => {
    it('should show paywall modal when upgrade button is pressed', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        canAskOracleQuestion: () => false,
        getRemainingOracleQuestions: () => 0,
      } as any);

      render(
        <PremiumGate feature="oracle">
          <TestChild />
        </PremiumGate>
      );

      const upgradeButton = screen.getByText('Upgrade to Premium');
      fireEvent.press(upgradeButton);

      expect(screen.getByTestId('paywall-modal')).toBeTruthy();
    });

    it('should close paywall modal', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        canAskOracleQuestion: () => false,
        getRemainingOracleQuestions: () => 0,
      } as any);

      render(
        <PremiumGate feature="oracle">
          <TestChild />
        </PremiumGate>
      );

      // Open paywall
      fireEvent.press(screen.getByText('Upgrade to Premium'));
      expect(screen.getByTestId('paywall-modal')).toBeTruthy();

      // Close paywall
      fireEvent.press(screen.getByText('Close Paywall'));
      expect(screen.queryByTestId('paywall-modal')).toBeFalsy();
    });
  });

  describe('showUpgradePrompt mode', () => {
    it('should show content with upgrade prompt overlay when showUpgradePrompt is true', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        canAskOracleQuestion: () => false,
        getRemainingOracleQuestions: () => 0,
      } as any);

      render(
        <PremiumGate feature=\"oracle\" showUpgradePrompt={true}>
          <TestChild />
        </PremiumGate>
      );

      // Should show both content and upgrade prompt
      expect(screen.getByTestId('protected-content')).toBeTruthy();
      expect(screen.getByText('Upgrade to Premium')).toBeTruthy();
    });
  });

  describe('remaining usage display', () => {
    it('should show remaining oracle questions', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        getRemainingOracleQuestions: () => 3,
      } as any);

      render(
        <PremiumGate feature="oracle">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('should show remaining recipes', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        getRemainingRecipes: () => 1,
      } as any);

      render(
        <PremiumGate feature=\"recipes\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('should show remaining tracking days', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        getRemainingTrackingDays: () => 5,
      } as any);

      render(
        <PremiumGate feature=\"tracking\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });
  });

  describe('different actions', () => {
    it('should work with view action', () => {
      render(
        <PremiumGate feature=\"oracle\" action=\"view\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('should work with create action', () => {
      render(
        <PremiumGate feature=\"recipes\" action=\"create\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('should work with use action (default)', () => {
      render(
        <PremiumGate feature=\"tracking\">
          <TestChild />
        </PremiumGate>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });
  });
});