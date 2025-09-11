import { test, expect } from '@playwright/test';

test.describe('Home Canvas E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Gemini API call to prevent actual network requests during tests
    await page.route('**/models/gemini-2.5-flash:generateContent', route => {
      // Immediately abort the route to simulate a network failure.
      // This is sufficient to test that the UI handles API failures gracefully.
      route.abort();
    });
    await page.route('**/models/gemini-2.5-flash-image-preview:generateContent', route => {
      route.abort();
    });
  });

  test('should allow a user to use "instant start" and attempt to place a product', async ({ page }) => {
    await page.goto('/');

    // 1. Check for the header and initial prompt
    await expect(page.getByRole('heading', { name: 'Home Canvas' })).toBeVisible();
    await expect(page.getByText('1. Start with a Scene')).toBeVisible();

    // 2. Click the "instant start" link
    await page.getByRole('button', { name: 'here' }).click();

  // 3. After instant start we immediately have a selected product and the main DnD view
  await expect(page.getByRole('heading', { name: 'Product' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scene' })).toBeVisible();
  const sceneDropZone = page.locator('[data-dropzone-id="scene-uploader"]');
  await expect(sceneDropZone).toBeVisible();

  // 4. Verify the main drag-and-drop hint text is present
  await expect(page.getByText('Drag the product onto a location in the scene')).toBeVisible();

  // 5. Click on the scene to place the product
    await sceneDropZone.click({ position: { x: 100, y: 100 } });

  // 6. Verify the loading spinner and message appear
    await expect(page.locator('.animate-spin')).toBeVisible();
    await expect(page.getByText('Analyzing your product...')).toBeVisible();

  // 7. Since we aborted the API call, verify the error message appears
    await expect(page.getByText('An Error Occurred')).toBeVisible();
    await expect(page.getByText(/Failed to generate the image/)).toBeVisible();

  // 8. Click "Try Again" to reset the app
    await page.getByRole('button', { name: 'Try Again' }).click();

  // 9. Verify the app has reset to the initial state
    await expect(page.getByText('1. Start with a Scene')).toBeVisible();
  });
});
