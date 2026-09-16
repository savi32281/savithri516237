// ============================================================================
// File: tests/verifyProductsPage.spec.ts
// Description: Test suite for verifying products page load functionality
// ============================================================================
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { testData } from '../testData';
test.describe('Products Page Verification', () => {
    let loginPage;
    let productsPage;
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        productsPage = new ProductsPage(page);
    });
    test('Verify Products Page Loads for Standard User', async ({ page }) => {
        // 1. Navigate to the login page
        await loginPage.navigate(testData.baseUrl);
        // 2. Perform login action with parameters
        await loginPage.login(testData.username, testData.password);
        // 3. Assertion: Verify redirection to the inventory page URL
        await expect(page).toHaveURL(testData.inventoryUrl);
        // 4. Assertion: Verify element '.title' text equals 'Products'
        await expect(productsPage.pageTitle).toBeVisible();
        await expect(productsPage.pageTitle).toHaveText(testData.expectedTitle);
        // 5. Assertion: Verify element count for '.inventory_item' is greater than or equal to minProductCount (1)
        const itemCount = await productsPage.getInventoryItemCount();
        expect(itemCount).toBeGreaterThanOrEqual(testData.minProductCount);
    });
});
//# sourceMappingURL=generated.spec.js.map