import { Container } from "./Container";

export function TopBar() {
  return (
    <div className="bg-[#1f2d30] py-2 text-sm text-white">
      <Container className="flex items-center justify-between">
        <p className="text-xs sm:text-sm">
          Summer launch offer: free shipping above Rs 999
        </p>
        <button className="text-xs text-white/90 transition hover:text-white sm:text-sm">
          English
        </button>
      </Container>
    </div>
  );
}