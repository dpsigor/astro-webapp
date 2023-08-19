export async function loadFonts() {
  const fonts = [
    {
      fontFamily: "glyphsFont",
      fontStyle: "normal",
      fontWeight: "400",
      src: "./Astrodotbasic-ow3Pd.ttf",
    },
  ];

  for (let i = 0; i < fonts.length; i++) {
    let fontProps = fonts[i];
    let fontFamily = fontProps.fontFamily;
    let fontWeight = fontProps.fontWeight;
    let fontStyle = fontProps.fontStyle;
    let fontUrl = Array.isArray(fontProps["src"])
      ? fontProps["src"][0][0]
      : fontProps["src"];
    if (fontUrl.indexOf("url(") === -1) {
      fontUrl = "url(" + fontUrl + ")";
    }
    // let fontFormat = fontProps["src"][0][1] ? fontProps["src"][1] : "";
    const font = new FontFace(fontFamily, fontUrl);
    font.weight = fontWeight;
    font.style = fontStyle;
    await font.load();
    document.fonts.add(font);
    console.log(fontFamily, "loaded");
    // apply font styles to body
    let fontDOMEl = document.createElement("div");
    fontDOMEl.textContent = "";
    document.body.appendChild(fontDOMEl);
    fontDOMEl.setAttribute(
      "style",
      `position:fixed; height:0; width:0; overflow:hidden; font-family:${fontFamily}; font-weight:${fontWeight}; font-style:${fontStyle}`
    );
  }
}
