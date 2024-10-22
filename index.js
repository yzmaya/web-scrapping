const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const url = require('url');

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

async function scrapeAllPhones() {
  const browser = await puppeteer.launch({ headless: false }); // Considera cambiar a true para producción
  const page = await browser.newPage();

  // URL actualizada según tu solicitud
  const mainUrl = 'https://bnimexico.com/es-MX/chapterlist?countryIds=3521&regionId=3526&chapterName=&chapterCity=&chapterArea=&chapterMeetingDay=&chapterMeetingTime=&chapterMeetingType=';
  await page.goto(mainUrl, { waitUntil: 'networkidle2' });

  const chapterUrls = await page.evaluate(() => Array.from(document.querySelectorAll('table a')).map(link => link.href));
  console.log("URLs de capítulos recogidas: ", chapterUrls.length);

  let dataForExcel = [];
  let workbook = xlsx.utils.book_new(); 

  for (const chapterUrl of chapterUrls) {
    console.log("Procesando URL: ", chapterUrl);
    await page.goto(chapterUrl, { waitUntil: 'networkidle2' });
    await delay(8000); // Espera explícita de 8 segundos

    const groupName = new url.URL(chapterUrl).searchParams.get('name').replace('BNI+', '').trim();

    const phoneNumbers = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      return rows.map(row => {
        const phoneCell = row.querySelector('td:nth-child(4)');
        return phoneCell ? phoneCell.innerText.match(/\d{10}/g) : [];
      }).flat();
    });

    if (phoneNumbers.length) {
      const validNumbers = phoneNumbers.filter(number => number !== null);
      dataForExcel.push(...validNumbers.map(phone => ({ 'Teléfono': phone, 'Grupo': groupName })));
      console.log(`Datos agregados con éxito para el grupo: ${groupName} - Números:`, validNumbers);
    } else {
      console.log(`No se encontraron números válidos para el grupo: ${groupName}`);
    }
  }

  if (dataForExcel.length > 0) {
    const worksheet = xlsx.utils.json_to_sheet(dataForExcel);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Números de Teléfono');
    xlsx.writeFile(workbook, 'Numeros_de_Telefono.xlsx');
    console.log("Todos los datos se han guardado correctamente en el archivo Excel.");
  } else {
    console.log("No se guardaron datos en Excel.");
  }

  await browser.close();
}

scrapeAllPhones();
