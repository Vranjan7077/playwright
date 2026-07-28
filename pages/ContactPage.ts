import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ContactFormInput {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export class ContactPage extends BasePage {
  readonly path = '/contact/';

  readonly form: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly companyInput: Locator;
  readonly messageInput: Locator;
  readonly honeypotInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.locator('#contactForm');
    this.nameInput = page.getByLabel('Your name');
    this.emailInput = page.getByLabel('Your email');
    this.companyInput = page.getByLabel(/company or organization/i);
    this.messageInput = page.getByLabel(/write your message here/i);
    this.honeypotInput = page.locator('input[name="bot-field"]');
    this.submitButton = page.getByRole('button', { name: /send message/i });
    this.successMessage = page.locator('#formSuccess');
    this.errorMessage = page.locator('#formError');
  }

  async fillForm(input: ContactFormInput): Promise<void> {
    await this.nameInput.fill(input.name);
    await this.emailInput.fill(input.email);
    if (input.company) await this.companyInput.fill(input.company);
    await this.messageInput.fill(input.message);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** The submit handler validates via native HTML constraints before it will fetch(). */
  async validationMessage(field: Locator): Promise<string> {
    return field.evaluate((el: HTMLInputElement | HTMLTextAreaElement) => el.validationMessage);
  }
}
