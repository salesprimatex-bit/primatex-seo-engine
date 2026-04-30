function testAPI() {
  const response = UrlFetchApp.fetch("https://primatex-seo-engine.vercel.app/api/generate", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      keyword: "Test Geomembrane",
      anchorText: "Geomembrane",
      url: "https://primatex.co.id/",
      anchors: ["1","2","3","4","5","6","7","8","9","10"]
    })
  });

  Logger.log(response.getContentText());
}
