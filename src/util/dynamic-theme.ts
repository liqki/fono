import ColorThief from "colorthief";
import { useCallback, useState } from "react";

import { useSettings } from "../context/settings-context";

type RGB = [number, number, number];
export type DynamicColors = {
  background: string;
  text: string;
  primary: string;
};

function rgbToHex(rgb: RGB): string {
  return (
    `#${
      rgb
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? `0${hex}` : hex;
        })
        .join("")}`
  );
}

function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    (c1[0] - c2[0]) ** 2
    + (c1[1] - c2[1]) ** 2
    + (c1[2] - c2[2]) ** 2,
  );
}

function getTextColor(background: RGB): RGB {
  const luminance = (0.299 * background[0] + 0.587 * background[1] + 0.114 * background[2]) / 255;
  return luminance > 0.5 ? [0, 0, 0] : [255, 255, 255];
}

function getPrimaryColor(palette: RGB[], background: RGB, text: RGB): RGB {
  let bestColor = palette[0];
  let maxScore = -Infinity;

  for (const color of palette) {
    const distBg = colorDistance(color, background);
    const distText = colorDistance(color, text);

    const score = distBg + distText;

    if (score > maxScore && distBg > 50 && distText > 50) {
      maxScore = score;
      bestColor = color;
    }
  }

  return bestColor;
}

export function useDynamicTheme(): { colors: DynamicColors | null; imgRef: (node: HTMLImageElement | null) => void } {
  const [colors, setColors] = useState<DynamicColors | null>(null);
  const { settings } = useSettings();

  const refCallback = useCallback((node: HTMLImageElement | null) => {
    if (!node || !settings.dynamicTheme) {
      setColors(null);
      return;
    }

    const applyColors = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(node) as RGB[];
        const dominant = colorThief.getColor(node) as RGB;
        const text = getTextColor(dominant);

        setColors({
          background: rgbToHex(dominant),
          primary: rgbToHex(getPrimaryColor(palette, dominant, text)),
          text: rgbToHex(text),
        });
      }
      catch {
        setColors(null);
      }
    };

    if (node.complete && node.naturalWidth > 0) {
      applyColors();
    }
    else {
      node.addEventListener("load", applyColors, { once: true });
    }
  }, [settings.dynamicTheme]);

  return { colors, imgRef: refCallback };
}

export function getThemeColor(settingsColor: string, dynamicColor: string | undefined, dynamicTheme: boolean): string {
  if (dynamicTheme && dynamicColor) {
    return dynamicColor;
  }
  return settingsColor;
}
