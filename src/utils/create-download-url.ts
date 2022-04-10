export function createDownloadUrl(
  telegramUrl: string,
  telegramToken: string,
  filePath?: string
): string {
  return `${telegramUrl}${telegramToken}/${filePath}`;
}
