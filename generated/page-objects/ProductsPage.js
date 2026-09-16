// ============================================================================
// File: pages/ProductsPage.ts
// Description: Page Object for the SauceDemo Inventory Page ("/inventory.html")
// ============================================================================
export class ProductsPage {
    constructor(page) {
        this.page = page;
        this.pageTitle = page.locator('.title');
        this.inventoryItems = page.locator('.inventory_item');
    }
    /**
     * Retrieves the current page title header text.
     */
    async getTitleText() {
        return (await this.pageTitle.innerText()).trim();
    }
    /**
     * Gets the total count of inventory items currently displayed on the page.
     */
    async getInventoryItemCount() {
        return await this.inventoryItems.count();
    }
}
//# sourceMappingURL=ProductsPage.js.map