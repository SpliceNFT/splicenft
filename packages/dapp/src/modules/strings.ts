export function truncateAddress(address: string) {
  const [first, last] = [
    address.substr(0, 6),
    address.substr(address.length - 3, 3)
  ];
  return `${first}..${last}`;
}
