// ============================================================================
// File: pages/LoginPage.ts
// Description: Page Object for the SauceDemo Login Page ("/")
// ============================================================================
export class LoginPage {
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator('[data-test="username"], #user-name');
        this.passwordInput = page.locator('[data-test="password"], #password');
        this.loginButton = page.locator('[data-test="login-button"], #login-button');
    }
    /**
     * Navigates to the login page base URL.
     */
    async navigate(baseUrl) {
        await this.page.goto(baseUrl);
    }
    /**
     * Fills in the login form and clicks the login button.
     * @param username User credential name
     * @param password User credential password
     */
    async login(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}
//# sourceMappingURL=LoginPage.js.map