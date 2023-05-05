const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.occ.com.mx/empleos/");

  const jobs = await page.evaluate(function getJobInformation() {
    const elemCardJobs = [...document.querySelectorAll('[id*="jobcard-"]')];
    const jobs = elemCardJobs.map((cardJob) => {
      const [
        { href: url },
        {
          children: [
            {
              children: [
                { innerText: fecha },
                { innerText: title },
                { innerText: salario },
                { innerText: beneficios },
                {},
                {
                  children: [elementEmpresCiudad],
                },
              ],
            },
          ],
        },
      ] = cardJob.children;

      const empresa = elementEmpresCiudad?.querySelector("label")?.innerText;
      const ciudad = elementEmpresCiudad?.querySelector("p")?.innerText;
      return { url, fecha, title, salario, beneficios, empresa, ciudad };
    });

    return jobs;
  });

  console.log(JSON.stringify(jobs, null, 2));
  
})();
