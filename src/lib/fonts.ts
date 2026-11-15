const fonts = [
  {
    family: 'glyphsFont',
    style: 'normal',
    weight: '400',
    src: './Astrodotbasic-ow3Pd.ttf',
  },
];

/** Loads the glyph fonts so they are usable from both CSS and the canvas. */
export async function loadFonts() {
  await Promise.all(
    fonts.map(async ({ family, style, weight, src }) => {
      const font = new FontFace(family, `url(${src})`, { style, weight });
      await font.load();
      document.fonts.add(font);
    }),
  );
}
