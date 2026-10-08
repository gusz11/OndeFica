import { expect, it } from "vitest";
import { darkThemeColors, lightThemeColors } from "../src/styles/theme";

function luminance(hex: string): number {
  const values = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (
    (values[0] ?? 0) * 0.2126 +
    (values[1] ?? 0) * 0.7152 +
    (values[2] ?? 0) * 0.0722
  );
}

it("keeps normal text legible on supported light and dark surfaces", () => {
  const pairs = [
    ["textoPrimario", "backgroundPrincipal"],
    ["textoSecundario", "superficiePrimaria"],
    ["textoMuted", "superficieSecundaria"],
    ["botaoPrimarioTexto", "botaoPrimarioFundo"],
    ["positivo", "positivoFundo"],
    ["textoBotaoAcaoVermelho", "perigoFundo"],
    ["iconeInativo", "fundoFooter"],
    ["textoPrimario", "superficieSecundaria"],
    ["destaqueOliva", "backgroundPrincipal"],
    ["destaqueOliva", "superficieOliva"],
    ["destaqueOuro", "superficieOliva"],
    ["destaqueOuro", "superficiePrimaria"],
  ] as const;
  for (const theme of [darkThemeColors, lightThemeColors]) {
    for (const [text, background] of pairs) {
      const first = luminance(theme[text]);
      const second = luminance(theme[background]);
      expect(
        (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05),
        `${text} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});
