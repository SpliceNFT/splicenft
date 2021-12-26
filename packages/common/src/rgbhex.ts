export default function (red: number, green: number, blue: number) {
  return (blue | (green << 8) | (red << 16) | (1 << 24)).toString(16).slice(1);
}
