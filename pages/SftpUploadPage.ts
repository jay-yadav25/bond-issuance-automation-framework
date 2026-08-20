import { Page, Locator } from '@playwright/test';

export class SftpUploadPage {
  readonly page: Page;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly validationErrors: Locator;
  readonly uploadResult: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fileInput = page.locator('[data-testid="sftp-file-input"]');
    this.uploadButton = page.locator('[data-testid="sftp-upload"]');
    this.validationErrors = page.locator('[data-testid="sftp-validation-error"]');
    this.uploadResult = page.locator('[data-testid="sftp-upload-result"]');
  }

  async upload(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
    await this.uploadButton.click();
  }
}
