export function createFolderName(): string {
  return new Date().toLocaleDateString().split(".").join("-");
}
