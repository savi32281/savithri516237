export const testData = {
  baseUrl: 'https://www.saucedemo.com',
  username: process.env.SAUCE_USERNAME || 'standard_user',
  password: process.env.SAUCE_PASSWORD || 'secret_sauce',
  expectedInventoryUrl: 'https://www.saucedemo.com/inventory.html',
  expectedTitleText: 'Products',
  minimumProductCount: 1,
};