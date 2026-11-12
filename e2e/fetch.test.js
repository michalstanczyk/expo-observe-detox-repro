describe('fetch under Detox', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('resolves a plain fetch()', async () => {
    await expect(element(by.id('fetch-result'))).toHaveText('idle');
    await element(by.id('fetch-button')).tap();
    await waitFor(element(by.id('fetch-result')))
      .toHaveText('status 200')
      .withTimeout(30000);
  });
});
