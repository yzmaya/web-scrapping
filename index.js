// index.js

async function loadModule() {
    const { extract } = await import('@extractus/article-extractor');
    const article = await extract('https://leahinmobiliaria.com/propiedades/departamento-de-285-m-2-con-terraza-en-torre-alamos-reforma-santa-fe/');
    console.log(article);
  }
  
  loadModule();
  