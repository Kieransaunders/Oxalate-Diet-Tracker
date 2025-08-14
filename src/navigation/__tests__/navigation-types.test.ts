import { MainTabParamList, RootStackParamList } from '../types';

describe('Navigation Types', () => {
  describe('MainTabParamList', () => {
    it('has correct tab route definitions', () => {
      // Test that the type structure is correct by creating valid param objects
      const homeParams: MainTabParamList['Home'] = undefined;
      const foodsParams: MainTabParamList['Foods'] = undefined;
      const trackerParams: MainTabParamList['Tracker'] = undefined;
      const oracleParams: MainTabParamList['Oracle'] = { contextFood: 'spinach' };
      const oracleParamsEmpty: MainTabParamList['Oracle'] = {};
      const recipesParams: MainTabParamList['Recipes'] = undefined;

      // These should compile without errors
      expect(homeParams).toBeUndefined();
      expect(foodsParams).toBeUndefined();
      expect(trackerParams).toBeUndefined();
      expect(oracleParams).toEqual({ contextFood: 'spinach' });
      expect(oracleParamsEmpty).toEqual({});
      expect(recipesParams).toBeUndefined();
    });

    it('allows Oracle route with optional contextFood parameter', () => {
      const oracleWithContext: MainTabParamList['Oracle'] = { contextFood: 'almonds' };
      const oracleWithoutContext: MainTabParamList['Oracle'] = {};
      
      expect(oracleWithContext.contextFood).toBe('almonds');
      expect(oracleWithoutContext.contextFood).toBeUndefined();
    });
  });

  describe('RootStackParamList', () => {
    it('has correct stack route definitions', () => {
      // Test that the type structure is correct
      const mainTabsParams: RootStackParamList['MainTabs'] = undefined;
      const settingsParams: RootStackParamList['Settings'] = undefined;

      expect(mainTabsParams).toBeUndefined();
      expect(settingsParams).toBeUndefined();
    });
  });

  describe('Type Safety', () => {
    it('ensures type safety for navigation parameters', () => {
      // This test ensures that TypeScript compilation will catch type errors
      // The actual test is that this file compiles without TypeScript errors
      
      type TestMainTabKeys = keyof MainTabParamList;
      type TestRootStackKeys = keyof RootStackParamList;
      
      const mainTabKeys: TestMainTabKeys[] = ['Home', 'Foods', 'Tracker', 'Oracle', 'Recipes'];
      const rootStackKeys: TestRootStackKeys[] = ['MainTabs', 'Settings'];
      
      expect(mainTabKeys).toHaveLength(5);
      expect(rootStackKeys).toHaveLength(2);
    });

    it('validates Oracle route parameter types', () => {
      // Test that Oracle contextFood parameter is properly typed as optional string
      type OracleParams = MainTabParamList['Oracle'];
      
      // This should compile - contextFood is optional
      const validParams1: OracleParams = {};
      const validParams2: OracleParams = { contextFood: 'test-food' };
      
      expect(validParams1).toEqual({});
      expect(validParams2).toEqual({ contextFood: 'test-food' });
    });
  });
});